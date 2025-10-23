import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Move static data outside component to prevent recreation on every render
const EXCLUDED_TERMS = ['fake', 'tease', 'reprise'];

// Update the interface to match the structure we actually have
interface SetlistEntry {
  entry_song: string;
  entry_short?: string;  // Added this field
  song_category?: string;
  category_canonid?: number;
  song_originalartist?: string;
  category_artwork?: string;
  songs: {
    song_id: string;
    song_category: string;
    song_originalartist: string | null;
    categories: {
      category_canonid: number;
      category_artwork: string | null;
    };
  };
}

interface SongSpreadProps {
  setlist: SetlistEntry[];
  onCategoryHover?: (category: string | null) => void;
}

const SongSpread: React.FC<SongSpreadProps> = ({ setlist, onCategoryHover }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Use useMemo to calculate songsToExclude only when setlist changes
  const songsToExclude = useMemo(() => {
    const excluded = new Set<string>();
    
    // Group entries by song name
    const songEntries = setlist.reduce((acc, entry) => {
      if (!acc[entry.entry_song]) {
        acc[entry.entry_song] = [];
      }
      acc[entry.entry_song].push(entry);
      return acc;
    }, {} as Record<string, SetlistEntry[]>);

    // Determine which songs should be excluded
    Object.entries(songEntries).forEach(([songName, entries]) => {
      const allEntriesHaveExcludedTerms = entries.every(entry => 
        entry.entry_short && 
        EXCLUDED_TERMS.some(term => 
          entry.entry_short!.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (allEntriesHaveExcludedTerms) {
        excluded.add(songName);
      }
    });
    
    return excluded;
  }, [setlist]);
  
  // Memoize unique categories to optimize useEffect dependency
  const uniqueCategories = useMemo(() => {
    return [...new Set(
      setlist
        .filter(entry => !songsToExclude.has(entry.entry_song))
        .map(entry => entry.songs?.song_category)
        .filter(Boolean)
    )];
  }, [setlist, songsToExclude]);

  // Fetch artwork for categories directly from the database
  useEffect(() => {
    const fetchCategoryArtwork = async () => {
      try {
        if (uniqueCategories.length > 0) {
          // Reset loaded images when categories change
          setLoadedImages(new Set());
          
          // Fetch artwork for these categories from the categories table
          const { data, error } = await supabase
            .from('categories')
            .select('category, category_artwork')
            .in('category', uniqueCategories);
            
          if (error) {
            console.error('Error fetching category artwork:', error);
            return;
          }
          
          // Create a mapping of category names to artwork URLs
          const artworkMap = data.reduce((map, item) => {
            if (item.category && item.category_artwork) {
              map[item.category] = item.category_artwork;
            }
            return map;
          }, {} as Record<string, string>);

          setCategoryArtwork(artworkMap);
        }
      } catch (error) {
        console.error('Failed to fetch category artwork:', error);
      }
    };
    
    fetchCategoryArtwork();
  }, [uniqueCategories]); // Only run when unique categories change

  // Preload images to ensure they're ready before display
  useEffect(() => {
    const preloadImages = () => {
      Object.entries(categoryArtwork).forEach(([category, artworkUrl]) => {
        if (artworkUrl && !loadedImages.has(category)) {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => {
              // Only update if the image isn't already loaded
              if (!prev.has(category)) {
                return new Set([...prev, category]);
              }
              return prev;
            });
          };
          img.onerror = () => {
            console.error(`Failed to load image for ${category}:`, artworkUrl);
          };
          img.src = artworkUrl;
        }
      });
    };

    preloadImages();
  }, [categoryArtwork]); // Removed loadedImages from dependencies to prevent loops

  // Memoize expensive calculations to prevent recalculation on every render
  const categoryData = useMemo(() => {
    return setlist.reduce((acc, entry) => {
      // Skip excluded songs
      if (songsToExclude.has(entry.entry_song)) {
        return acc;
      }
      
      const category = entry.songs?.song_category || 'undefined';
      
      const songKey = `${entry.entry_song}-${category}`;
      
      // Only count each unique song once
      if (!acc.songsSeen.has(songKey)) {
        acc.songsSeen.add(songKey);
        acc.counts[category] = (acc.counts[category] || 0) + 1;
        
        // Initialize songs array if it doesn't exist
        if (!acc.songs[category]) {
          acc.songs[category] = [];
        }
        
        // Add song to category's song list with original artist if applicable
        const hasArtist = ['Cover Songs', 'Live Collaborations'].includes(category);
        const originalArtist = entry.songs?.song_originalartist;
        
        const songWithArtist = hasArtist && originalArtist
          ? { 
              song: entry.entry_song,
              artist: originalArtist,
              isSpecialCategory: true
            }
          : { 
              song: entry.entry_song,
              isSpecialCategory: false
            };
        
        const songExists = acc.songs[category].some(s => s.song === songWithArtist.song);
        
        if (!songExists) {
          acc.songs[category].push(songWithArtist);
        }
      }
      
      return acc;
    }, { 
      counts: {} as Record<string, number>, 
      songs: {} as Record<string, any[]>, 
      songsSeen: new Set<string>()
    });
  }, [setlist, songsToExclude]);

  // Memoize category canonids calculation
  const categoryCanonIds = useMemo(() => {
    return setlist.reduce((acc, entry) => {
      // Skip excluded songs
      if (songsToExclude.has(entry.entry_song)) {
        return acc;
      }
      
      // Determine the correct category
      const category = entry.songs?.song_category || 'undefined';
      
      // Try to find the canonid in multiple possible locations
      if (category !== 'undefined') {
        // Direct canonid property
        if (entry.songs?.categories?.category_canonid !== undefined) {
          acc[category] = entry.songs.categories.category_canonid;
        } else if (entry.category_canonid !== undefined) {
          acc[category] = entry.category_canonid;
        }
      }
      return acc;
    }, {} as Record<string, number>);
  }, [setlist, songsToExclude]);

  // Memoize max count calculation
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(categoryData.counts));
  }, [categoryData]);

  // Optimize mouse event handlers to prevent recreation on every render
  const handleMouseEnter = useCallback((category: string, e: React.MouseEvent) => {
    if (!isMobile) {
      setHoveredCategory(category);
      setMousePosition({ x: e.clientX, y: e.clientY });
      onCategoryHover?.(category);
    }
  }, [onCategoryHover, isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setHoveredCategory(null);
      onCategoryHover?.(null);
    }
  }, [onCategoryHover, isMobile]);

  // Handle click on mobile devices
  const handleClick = useCallback((category: string) => {
    if (isMobile) {
      if (selectedCategory === category) {
        // If clicking the same category, deselect it
        setSelectedCategory(null);
        onCategoryHover?.(null);
      } else {
        // Select the new category
        setSelectedCategory(category);
        onCategoryHover?.(category);
      }
    }
  }, [isMobile, selectedCategory, onCategoryHover]);

  // Sort categories by canonid for vertical chart
  const verticalSortedCategories = useMemo(() => {
    return Object.entries(categoryData.counts)
      .map(([category, count]) => ({
        category,
        count,
        canonid: categoryCanonIds[category] || 0,
        artwork: categoryArtwork[category] || null,
        songs: categoryData.songs[category]
      }))
      .sort((a, b) => a.canonid - b.canonid);
  }, [categoryData, categoryCanonIds, categoryArtwork]);

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3" key="song-spread">
      <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth mb-1.5">Song Spread</h2>
      
      <div>
        <div className="flex items-end gap-1 w-full">
          {verticalSortedCategories.map(({ category, count, songs, artwork }) => {
            const barHeight = maxCount > 0 ? Math.max(Math.min((count / maxCount) * 200, 200), 27) : 27;
            
            return (
              <div key={`vertical-${category}`} className="flex flex-col items-center flex-1">
                {/* Vertical bar container - always full height */}
                <div 
                  className="cursor-pointer relative w-full transition-all duration-300"
                  style={{ 
                    height: '200px'
                  }}
                  onMouseEnter={(e) => handleMouseEnter(category, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(category)}
                >
                  {/* Empty space above the filled portion - only render if not 100% height */}
                  {barHeight < 200 && (
                    <div 
                      className="w-full border-l border-r border-t border-secondary rounded-t"
                      style={{ 
                        height: `${200 - barHeight}px`,
                        backgroundColor: '#d8d7d7' // bg-secondary color
                      }}
                    />
                  )}
                  
                  {/* Filled portion with artwork - positioned on top */}
                  <div 
                    className={`w-full border border-secondary relative overflow-hidden ${
                      barHeight < 200 ? 'rounded-b' : 'rounded'
                    }`}
                    style={{ 
                      height: `${barHeight}px`
                    }}
                  >
                    {/* Artwork background - separate from border, clipped to container shape */}
                    <div 
                      className="w-full h-full flex items-start justify-center absolute inset-0"
                      style={{ 
                        backgroundImage: artwork && loadedImages.has(category) ? `url(${artwork})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: (hoveredCategory === category || (isMobile && selectedCategory === category)) ? 'none' : 'grayscale(100%) brightness(0.5)',
                        opacity: (hoveredCategory === category || (isMobile && selectedCategory === category)) ? '1' : '1',
                        backgroundColor: !artwork || !loadedImages.has(category) ? '#594e5f' : undefined // bg-tertiary fallback
                      }}
                    />
                    
                    {/* Content overlay */}
                    <div className="relative z-10 w-full h-full flex items-start justify-center">
                      {(hoveredCategory === category || (isMobile && selectedCategory === category)) && (
                        <div className="text-fifth text-sm font-semibold mt-0.5 bg-primary rounded border border-secondary px-1">{count}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Artwork underneath bar */}
                <div 
                  className="mt-2 flex justify-center cursor-pointer"
                  onMouseEnter={(e) => handleMouseEnter(category, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(category)}
                >
                  {artwork && loadedImages.has(category) && (
                    <img 
                      src={artwork} 
                      alt=""
                      onError={(e) => {
                        console.error(`Failed to load image for ${category}. URL was:`, artwork);
                        e.currentTarget.style.display = 'none';
                      }}
                      className="h-8 w-8 object-cover rounded border border-secondary"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Tooltip - disabled on mobile */}
        {hoveredCategory && !isMobile && (
          <div 
            className="fixed bg-tertiary text-fifth px-2 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999] text-[0.625rem] leading-[0.75rem]"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`
            }}
          >
            <div className="font-semibold text-sm mb-0.5">{hoveredCategory}</div>
            {verticalSortedCategories
              .find(cat => cat.category === hoveredCategory)
              ?.songs
              .sort((a, b) => a.song.localeCompare(b.song))
              .map((song, index) => (
                <div key={index}>
                  <span className="font-medium">{song.song}</span>
                  {song.isSpecialCategory && song.artist && (
                    <>&nbsp;&nbsp;<span className="font-light">[{song.artist === '[Traditional]' ? 'Traditional' : song.artist}]</span></>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap component in React.memo to prevent unnecessary re-renders when props haven't changed
export default React.memo(SongSpread, (prevProps, nextProps) => {
  // Only re-render if the setlist actually changes
  // Compare setlist length and first few entries to determine if it's truly different
  if (prevProps.setlist.length !== nextProps.setlist.length) {
    return false; // Different lengths, need to re-render
  }
  
  // Check if the first few entries are the same to avoid deep comparison
  const maxCheck = Math.min(5, prevProps.setlist.length);
  for (let i = 0; i < maxCheck; i++) {
    if (prevProps.setlist[i]?.entry_song !== nextProps.setlist[i]?.entry_song) {
      return false; // Different content, need to re-render
    }
  }
  
  return true; // Same content, skip re-render
});