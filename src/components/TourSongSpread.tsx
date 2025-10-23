import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface SetlistEntry {
  entry_song: string;
  entry_short: string | null;
  songs: {
    song_category: string;
    song_originalartist: string | null;
    categories: {
      category_canonid: number;
      category_artwork: string | null;
    };
  };
}

interface Show {
  show_id: string;
  setlist_entries?: SetlistEntry[];
}

interface TourSongSpreadProps {
  shows: Show[];
}

const TourSongSpread: React.FC<TourSongSpreadProps> = ({ shows }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
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

  // Memoize category data processing for better performance
  const categoryData = useMemo(() => {
    return shows.reduce((acc, show) => {
      const skipShorts = ["fake", "tease", "reprise", "aborted"];
      
      // First pass: identify songs with at least one valid performance in this show
      const songsWithValidPerformance = new Set<string>();
      show.setlist_entries?.forEach(entry => {
        if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
          songsWithValidPerformance.add(entry.entry_song);
        }
      });
      
      // Track unique songs for this show
      const showSongKeys = new Set<string>();
      
      show.setlist_entries?.forEach(entry => {
        // Skip this entry if the song doesn't have any valid performances in this show
        if (!songsWithValidPerformance.has(entry.entry_song)) {
          return;
        }
        
        const songKey = `${entry.entry_song}-${entry.songs.song_category}`;
        const category = entry.songs.song_category || 'undefined';
        
        // Only count each song once per show
        if (!showSongKeys.has(songKey)) {
          showSongKeys.add(songKey);
          acc.counts[category] = (acc.counts[category] || 0) + 1;
          
          // Initialize songs array if it doesn't exist
          if (!acc.songs[category]) {
            acc.songs[category] = [];
          }
          
          // Add song to category's song list with original artist if applicable
          const songWithArtist = ['Cover Songs', 'Live Collaborations'].includes(category) && entry.songs.song_originalartist
            ? { 
                song: entry.entry_song,
                artist: entry.songs.song_originalartist,
                playCount: 1
              }
            : { 
                song: entry.entry_song,
                playCount: 1
              };
          
          // Check if song already exists in the category
          const existingSongIndex = acc.songs[category].findIndex(s => s.song === songWithArtist.song);
          if (existingSongIndex === -1) {
            acc.songs[category].push(songWithArtist);
          } else {
            // Increment play count if song exists
            acc.songs[category][existingSongIndex].playCount++;
          }
        }
      });
      
      return acc;
    }, { counts: {} as Record<string, number>, songs: {} as Record<string, any[]> });
  }, [shows]);

  // Memoize category metadata
  const categoryMeta = useMemo(() => {
    return shows.reduce((acc, show) => {
      show.setlist_entries?.forEach(entry => {
        if (entry.songs.song_category) {
          const currentArtwork = entry.songs.categories?.category_artwork;
          const hasExistingArtwork = acc[entry.songs.song_category]?.artwork;
          
          // Only update if we don't have artwork yet or we find a non-null artwork
          if (!acc[entry.songs.song_category] || (currentArtwork && !hasExistingArtwork)) {
            acc[entry.songs.song_category] = {
              canonid: entry.songs.categories?.category_canonid || 0,
              artwork: currentArtwork || null
            };
          }
        }
      });
      return acc;
    }, {} as Record<string, { canonid: number, artwork: string | null }>);
  }, [shows]);

  // Memoize sorted categories
  const sortedCategories = useMemo(() => {
    // Sort songs alphabetically within each category
    Object.keys(categoryData.songs).forEach(category => {
      categoryData.songs[category].sort((a, b) => 
        a.song.localeCompare(b.song)
      );
    });

    return Object.entries(categoryData.counts)
      .map(([category, count]) => ({
        category,
        count,
        canonid: categoryMeta[category]?.canonid || 0,
        artwork: categoryMeta[category]?.artwork,
        songs: categoryData.songs[category]
      }))
      .sort((a, b) => a.canonid - b.canonid);
  }, [categoryData, categoryMeta]);

  // Memoize max count calculation
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(categoryData.counts));
  }, [categoryData]);

  // Preload images to ensure they're ready before display
  useEffect(() => {
    const preloadImages = () => {
      sortedCategories.forEach(({ artwork, category }) => {
        if (artwork && !loadedImages.has(category)) {
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
            console.error(`Failed to load image for ${category}:`, artwork);
          };
          img.src = artwork;
        }
      });
    };

    preloadImages();
  }, [sortedCategories, loadedImages]);

  // Optimize mouse event handlers to prevent recreation on every render
  const handleMouseEnter = useCallback((category: string, e: React.MouseEvent) => {
    if (!isMobile) {
      setHoveredCategory(category);
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMobile) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setHoveredCategory(null);
    }
  }, [isMobile]);

  // Handle click on mobile devices
  const handleClick = useCallback((category: string) => {
    if (isMobile) {
      if (selectedCategory === category) {
        // If clicking the same category, deselect it
        setSelectedCategory(null);
      } else {
        // Select the new category
        setSelectedCategory(category);
      }
    }
  }, [isMobile, selectedCategory]);

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3" key="tour-song-spread">
      <h2 className="text-lg font-semibold bg-fourth text-primary inline-block px-3 rounded-lg border border-secondary mb-2">
        Song Spread
      </h2>
      
      <div>
        <div className="flex items-end gap-1 w-full">
          {sortedCategories.map(({ category, count, artwork }) => {
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
        
        {/* Desktop tooltip - follows mouse */}
        {hoveredCategory && !isMobile && (
          <div 
            className="fixed bg-tertiary text-fifth px-2 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999] text-[0.625rem] leading-[0.75rem]"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`
            }}
          >
            <div className="font-semibold text-sm mb-0.5">{hoveredCategory}</div>
            {sortedCategories
              .find(cat => cat.category === hoveredCategory)
              ?.songs
              .sort((a, b) => a.song.localeCompare(b.song))
              .map((song, index) => (
                <div key={index}>
                  <span className="font-medium">{song.song}</span>
                  {song.artist && ['Cover Songs', 'Live Collaborations'].includes(hoveredCategory) && (
                    <>&nbsp;&nbsp;<span className="font-light">[{song.artist === '[Traditional]' ? 'Traditional' : song.artist}]</span></>
                  )}
                  &nbsp;&nbsp;<span className="font-light">[{song.playCount}]</span>
                </div>
              ))}
          </div>
        )}
        
        {/* Mobile tooltip - underneath chart */}
        {selectedCategory && isMobile && (
          <div className="mt-4 flex justify-center">
            <div className="bg-tertiary text-fifth px-3 py-2 rounded border border-secondary shadow-lg text-[0.625rem] leading-[0.75rem] w-fit max-w-full">
              <div className="font-semibold text-sm mb-1">{selectedCategory}</div>
              {sortedCategories
                .find(cat => cat.category === selectedCategory)
                ?.songs
                .sort((a, b) => a.song.localeCompare(b.song))
                .map((song, index) => (
                  <div key={index}>
                    <span className="font-medium">{song.song}</span>
                    {song.artist && ['Cover Songs', 'Live Collaborations'].includes(selectedCategory) && (
                      <>&nbsp;&nbsp;<span className="font-light">[{song.artist === '[Traditional]' ? 'Traditional' : song.artist}]</span></>
                    )}
                    &nbsp;&nbsp;<span className="font-light">[{song.playCount}]</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourSongSpread;