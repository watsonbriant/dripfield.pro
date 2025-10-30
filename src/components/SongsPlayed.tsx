import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { Modal } from './Modal';
import { CircularProgress as CircularProgressComponent } from './ui/CircularProgress';

interface SongCount {
  song: string;
  play_count: number;
  category?: string;
  category_canonid?: number;
  original_artist?: string;
}

interface SongsPlayedProps {
  PersonnelID: string | undefined;
  isLoading: boolean;
  selectedSong: string | null;
  onSongClick: (song: string) => void;
  CircularProgress?: React.FC<{ value: number }>;
  cleanSongName?: (songName: string) => string;
  songs: SongCount[];
  songSpreadData: SongSpreadItem[];
  loadingProgress: number;
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork?: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

export function SongsPlayed({ 
  PersonnelID, 
  isLoading, 
  selectedSong, 
  onSongClick,
  CircularProgress = CircularProgressComponent,
  cleanSongName,
  songs,
  songSpreadData,
  loadingProgress
}: SongsPlayedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'song' | 'count'>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
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

  // Preload images to ensure they're ready before display
  useEffect(() => {
    const preloadImages = () => {
      songSpreadData.forEach(({ artwork, category }) => {
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
  }, [songSpreadData, loadedImages]);

  // Optimize mouse event handlers to prevent recreation on every render
  const handleMouseEnter = useCallback((category: string) => {
    if (!isMobile) {
      setHoveredCategory(category);
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

  // Check scroll position and update fade visibility
  const updateScrollFades = useCallback(() => {
    if (chartContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = chartContainerRef.current;
      const isScrollable = scrollWidth > clientWidth;
      
      setIsScrollable(isScrollable);
      
      if (isScrollable) {
        // Show left fade if not at the start (with small threshold)
        setShowLeftFade(scrollLeft > 1);
        // Show right fade if not at the end (with small threshold)
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
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
  }, [songSpreadData, updateScrollFades]);

  // Add scroll event listener to update fades dynamically
  useEffect(() => {
    const container = chartContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollFades);
      return () => container.removeEventListener('scroll', updateScrollFades);
    }
  }, [updateScrollFades]);

  // Handle sorting
  const handleSortClick = (column: 'song' | 'count') => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for count, ascending for song name
      setSortBy(column);
      setSortDirection(column === 'count' ? 'desc' : 'asc');
    }
  };
  
  // Filter songs based on search term
  const filteredSongs = songs.filter(song => 
    song.song.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort songs based on current sort settings or default multi-level sort
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'song') {
      // If explicitly sorting by song name
      return sortDirection === 'asc' 
        ? a.song.localeCompare(b.song) 
        : b.song.localeCompare(a.song);
    } else if (sortBy === 'count') {
      // If explicitly sorting by count
      if (a.play_count !== b.play_count) {
        return sortDirection === 'asc' 
          ? a.play_count - b.play_count 
          : b.play_count - a.play_count;
      }
      // If counts are equal, use the default secondary and tertiary sort
      if ((a.category_canonid || 0) !== (b.category_canonid || 0)) {
        return (a.category_canonid || 0) - (b.category_canonid || 0);
      }
      return a.song.localeCompare(b.song);
    } else {
      // Default multi-level sorting:
      // 1. Play count (descending)
      if (a.play_count !== b.play_count) {
        return b.play_count - a.play_count;
      }
      // 2. Category canonid (ascending)
      if ((a.category_canonid || 0) !== (b.category_canonid || 0)) {
        return (a.category_canonid || 0) - (b.category_canonid || 0);
      }
      // 3. Song name (A-Z)
      return a.song.localeCompare(b.song);
    }
  });
  
  if (isLoading) {
    return (
      <div className="max-h-[320px] overflow-y-auto">
        <div className="flex items-center justify-center py-6">
          <CircularProgress value={loadingProgress} />
        </div>
      </div>
    );
  }
  
  // Memoize max count calculation
  const maxCount = useMemo(() => {
    return Math.max(...songSpreadData.map(cat => cat.count), 1);
  }, [songSpreadData]);
  
  return (
    <div>
      <div className="pl-2 pr-2 flex justify-between items-center mb-3">
        <h2 className="text-fifth text-sm flex justify-between font-light">
          {songs.length} Unique Songs
        </h2>
        <button 
          onClick={() => setIsSpreadModalOpen(true)} 
          className="text-fifth hover:text-tertiary transition-colors"
          aria-label="Show song spread"
        >
          <ChartBarDecreasing size={18} />
        </button>
      </div>
      
      {/* Search input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-canvas border border-secondary rounded-md px-3 py-1.5 text-sm text-fifth focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
        />
      </div>
      
      {sortedSongs.length > 0 ? (
        <div className="relative">
          {/* Sticky table header */}
          <div className="sticky top-0 z-10 bg-primary grid grid-cols-2 text-sm text-fifth border-b border-secondary pb-1 mb-2">
            <div 
              className="cursor-pointer hover:text-tertiary font-medium flex items-center"
              onClick={() => handleSortClick('song')}
            >
              <span>Song</span>
              {sortBy === 'song' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-tertiary font-medium text-right flex items-center justify-end"
              onClick={() => handleSortClick('count')}
            >
              <span>Count</span>
              {sortBy === 'count' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          </div>
          
          {/* Scrollable song list */}
          <div className="max-h-[234px] overflow-y-auto">
            <div>
              {sortedSongs.map((song, index) => (
                <div 
                  key={index} 
                  onClick={() => onSongClick(song.song)}
                  className={`flex justify-between text-sm cursor-pointer ${
                    selectedSong === song.song 
                      ? 'bg-tertiary/80' 
                      : 'hover:bg-tertiary/40'
                  }`}
                >
                  <span className="pl-2 truncate font-trad text-fifth">{cleanSongName ? cleanSongName(song.song) : song.song}</span>
                  <span className="pr-2 text-fifth font-base">{song.play_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-fifth/70 text-center py-4">
          {searchTerm ? 'No songs match your search.' : 'No songs found.'}
        </div>
      )}
      
      {/* Song Spread Modal */}
      <Modal
        isOpen={isSpreadModalOpen}
        onClose={() => setIsSpreadModalOpen(false)}
        title="Song Category Spread"
        maxWidth="1050px"
      >
        <div className="bg-primary">
          <div className="relative">
            {/* Left fade overlay - only show when not scrolled all the way left */}
            {showLeftFade && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, #f5f4f6 0%, #f5f4f6 30%, transparent 100%)'
                }}
              />
            )}
            
            {/* Right fade overlay - only show when not scrolled all the way right */}
            {showRightFade && (
              <div 
                className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
                style={{
                  background: 'linear-gradient(to left, #f5f4f6 0%, #f5f4f6 30%, transparent 100%)'
                }}
              />
            )}
            
            <div 
              ref={chartContainerRef}
              className="overflow-x-auto songs-played-scrollbar"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <style>{`
                .songs-played-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex items-end gap-1" style={{ minWidth: 'fit-content' }}>
                {songSpreadData.map(({ category, count, artwork }) => {
                  const barHeight = maxCount > 0 ? Math.max(Math.min((count / maxCount) * 200, 200), 27) : 27;
                  
                  return (
                    <div key={`vertical-${category}`} className="flex flex-col items-center" style={{ minWidth: '2rem', flex: '1 1 2rem' }}>
                  {/* Vertical bar container - always full height */}
                  <div 
                    className="cursor-pointer relative w-full transition-all duration-300"
                    style={{ 
                      height: '200px'
                    }}
                    onMouseEnter={() => handleMouseEnter(category)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(category)}
                  >
                    {/* Empty space above the filled portion - only render if not 100% height */}
                    {barHeight < 200 && (
                      <div 
                        className="w-full border-l border-r border-t border-secondary rounded-t"
                        style={{ 
                          height: `${200 - barHeight}px`,
                          backgroundColor: '#ededed' // bg-secondary color
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
                          filter: (hoveredCategory === category || (isMobile && selectedCategory === category)) ? 'none' : 'grayscale(20%) brightness(0.5)',
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
                    onMouseEnter={() => handleMouseEnter(category)}
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
            </div>
          </div>
          
          {/* Tooltip underneath bar chart */}
          {(hoveredCategory || selectedCategory) && (
            <div className="mt-4 flex justify-center">
              <div className="bg-tertiary text-fifth px-3 py-2 rounded border border-secondary shadow-lg text-[0.625rem] leading-[0.75rem] w-fit max-w-full">
                <div className="font-semibold text-sm mb-1">{hoveredCategory || selectedCategory}</div>
                {songSpreadData
                  .find(cat => cat.category === (hoveredCategory || selectedCategory))
                  ?.songs
                  .sort((a: any, b: any) => a.song.localeCompare(b.song))
                  .map((song: any, index: number) => (
                    <div key={index}>
                      <span className="font-medium">{song.song}</span>
                      {song.artist && ['Cover Songs', 'Live Collaborations'].includes(hoveredCategory || selectedCategory || '') && (
                        <>&nbsp;&nbsp;<span className="font-light">[{song.artist === '[Traditional]' ? 'Traditional' : song.artist}]</span></>
                      )}
                      &nbsp;&nbsp;<span className="font-light">[{song.playCount}]</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}