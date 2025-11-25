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
  hideTitle?: boolean;
  hideContainer?: boolean;
}

const SongSpread: React.FC<SongSpreadProps> = ({ setlist, onCategoryHover, hideTitle = false, hideContainer = false }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

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

  // Memoize max count width for consistent spacing
  const maxCountDigits = useMemo(() => {
    return maxCount.toString().length;
  }, [maxCount]);

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

  // Sort categories by count descending, then by canonid ascending
  const verticalSortedCategories = useMemo(() => {
    return Object.entries(categoryData.counts)
      .map(([category, count]) => ({
        category,
        count,
        canonid: categoryCanonIds[category] || 0,
        artwork: categoryArtwork[category] || null,
        songs: categoryData.songs[category]
      }))
      .sort((a, b) => {
        // First sort by count descending
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort by canonid ascending
        return a.canonid - b.canonid;
      });
  }, [categoryData, categoryCanonIds, categoryArtwork]);

  // Check scroll position and update fade visibility
  const updateScrollFades = useCallback(() => {
    if (chartContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chartContainerRef.current;
      const isScrollable = scrollHeight > clientHeight;
      
      if (isScrollable) {
        // Show top fade if not at the start (with small threshold)
        setShowLeftFade(scrollTop > 1);
        // Show bottom fade if not at the end (with small threshold)
        setShowRightFade(scrollTop < scrollHeight - clientHeight - 1);
      } else {
        setShowLeftFade(false);
        setShowRightFade(false);
      }
    }
  }, []);

  // Check if the chart is scrollable and update fades
  useEffect(() => {
    updateScrollFades();
    window.addEventListener('resize', updateScrollFades);

    return () => window.removeEventListener('resize', updateScrollFades);
  }, [verticalSortedCategories, updateScrollFades]);

  // Add scroll event listener to update fades dynamically
  useEffect(() => {
    const container = chartContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollFades);
      return () => container.removeEventListener('scroll', updateScrollFades);
    }
  }, [updateScrollFades]);

  const content = (
    <>
      <div className="relative">
        <div 
          ref={chartContainerRef}
          className="overflow-y-auto song-spread-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            maxHeight: '400px'
          }}
        >
          <style>{`
            .song-spread-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex flex-col">
            {verticalSortedCategories.map(({ category, count, artwork }) => {
              // Calculate bar width based on count proportion, factoring in count width
              // Estimate count width based on max digits for consistent spacing
              // Using roughly 0.6rem per digit + 0.75rem padding (text-sm + px-1)
              const estimatedCountWidthRem = maxCountDigits * 0.9;
              // Convert to approximate percentage (assuming typical container width)
              // Using a more dynamic approach: calculate based on available space
              const barRatio = maxCount > 0 
                ? Math.max(Math.min(count / maxCount, 1), 0.02) 
                : 0.02;
              
              return (
                <div key={`horizontal-${category}`} className="flex items-center">
                  {/* Artwork on left */}
                  {artwork && loadedImages.has(category) && (
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onMouseEnter={(e) => handleMouseEnter(category, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(category)}
                    >
                      <img 
                        src={artwork} 
                        alt=""
                        onError={(e) => {
                          console.error(`Failed to load image for ${category}. URL was:`, artwork);
                          e.currentTarget.style.display = 'none';
                        }}
                        className="h-[20px] w-[20px] object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Horizontal bar container - always full width */}
                  <div 
                    className="cursor-pointer relative flex-1 transition-all duration-300 flex items-center gap-1"
                    style={{ 
                      height: '20px'
                    }}
                    onMouseEnter={(e) => handleMouseEnter(category, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(category)}
                  >
                    {/* Filled portion with artwork - positioned on left */}
                    <div 
                      className="h-full relative overflow-hidden flex-shrink-0 transition-all"
                      style={{ 
                        width: `calc((100% - ${estimatedCountWidthRem}rem) * ${barRatio})`
                      }}
                    >
                      {/* Artwork background - always show, change filter on hover */}
                      <div 
                        className="w-full h-full flex items-center justify-start absolute inset-0 transition-all"
                        style={{ 
                          backgroundImage: artwork && loadedImages.has(category) ? `url(${artwork})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: (hoveredCategory === category || (isMobile && selectedCategory === category)) 
                            ? 'grayscale(100%)' 
                            : 'grayscale(100%) brightness(0.4)',
                          opacity: '1',
                          backgroundColor: !artwork || !loadedImages.has(category) ? '#3c1e40' : undefined // bg-fourth fallback
                        }}
                      />
                    </div>
                    
                    {/* Count display - always visible to the right of the filled portion */}
                    <div className="text-fifth text-[0.625rem] font-medium flex-shrink-0 whitespace-nowrap">
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
        
      {/* Desktop tooltip - follows mouse */}
      {hoveredCategory && !isMobile && (
        <div 
          className="fixed bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg min-w-max z-[9999] text-[0.625rem] leading-[0.75rem]"
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
      
      {/* Mobile tooltip - underneath chart */}
      {selectedCategory && isMobile && (
        <div className="mt-2 flex justify-center">
          <div className="bg-canvas text-fifth px-2 py-1 border border-fourth rounded shadow-lg text-[0.625rem] leading-[0.75rem] w-fit max-w-[calc(100%-10px)]">
            <div className="font-semibold text-xs leading-[0.75rem] mb-0.5">{selectedCategory}</div>
            {verticalSortedCategories
              .find(cat => cat.category === selectedCategory)
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
        </div>
      )}
    </>
  );

  if (hideContainer) {
    return content;
  }

  return (
    <div className="bg-primary border border-fourth rounded-lg p-3" key="song-spread">
      {!hideTitle && (
        <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth mb-1.5">Song Spread</h2>
      )}
      {content}
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