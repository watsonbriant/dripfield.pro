import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Song = {
  song: string;
  song_id: string;
  song_category: string;
  song_categoryorder: number;
  song_originalartist: string;
};

type Category = {
  category: string;
  category_canonid: number;
  category_display_name: string;
  category_color1: string;
  category_color2: string;
  category_artwork: string;
};

type UserSongStat = {
  song_id: string;
  count: number;
  last_seen_date?: string;
};

// CircularProgress component
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#e5e5e5" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#f9ae37" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-black">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface UserSongsProps {
  userId?: string;
}

const UserSongs: React.FC<UserSongsProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSongStats, setUserSongStats] = useState<UserSongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Fetch username if viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            return;
          }
          
          if (data?.username) {
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Error in username fetch:', error);
        }
      };
      
      fetchUsername();
    }
  }, [userId, isOwnProfile, user]);

  // Recalculate the column distribution based on responsive breakpoints
  const useResponsiveColumns = () => {
    // Track current column count
    const [columnCount, setColumnCount] = useState(1);
    
    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width >= 1280) {
          setColumnCount(4); // xl breakpoint - 4 columns for original/other
        } else if (width >= 1024) {
          setColumnCount(3); // lg breakpoint - 3 columns for original/other
        } else if (width >= 640) {
          setColumnCount(2); // sm breakpoint - 2 columns for all sections
        } else {
          setColumnCount(1); // mobile - 1 column
        }
      };
      
      // Initial calculation
      handleResize();
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return columnCount;
  };
  
  // Get current column count for responsive layout
  const currentColumnCount = useResponsiveColumns();

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingProgress(5);

      if (!effectiveUserId) {
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
        return;
      }
      
      try {
        // Fetch categories sorted by canonid with pagination
        let allCategoriesData = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('category_canonid', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allCategoriesData = [...allCategoriesData, ...data];
            page++;
            
            // Update progress based on pagination (5-15%)
            setLoadingProgress(Math.min(15, 5 + (page * 2)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        setLoadingProgress(20);
        
        // Fetch all songs with pagination
        let allSongsData = [];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('song', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSongsData = [...allSongsData, ...data];
            page++;
            
            // Update progress based on pagination (20-40%)
            setLoadingProgress(Math.min(40, 20 + (page * 1)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        setLoadingProgress(45);

        // Fetch user's attended shows with pagination
        let allAttendedShowsData = [];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShowsData = [...allAttendedShowsData, ...data];
            page++;
            
            // Update progress based on pagination (45-60%)
            setLoadingProgress(Math.min(60, 45 + (page * 3)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(65);
        
        // If user has attended shows, get song stats
        if (allAttendedShowsData && allAttendedShowsData.length > 0) {
          const showIds = allAttendedShowsData.map(show => show.show_id);
          
          // Split showIds into chunks for batch processing
          const showIdChunks = [];
          const chunkSize = 200; // Supabase has limits on IN clause size
          
          for (let i = 0; i < showIds.length; i += chunkSize) {
            showIdChunks.push(showIds.slice(i, i + chunkSize));
          }
          
          // Get entries for all attended shows with pagination and chunking
          let allEntriesData = [];
          
          for (let i = 0; i < showIdChunks.length; i++) {
            const currentChunk = showIdChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              
              const { data, error } = await supabase
                .from('setlist_entries')
                .select('entry_song, entry_show')
                .in('entry_show', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allEntriesData = [...allEntriesData, ...data];
                page++;
                
                // Update progress based on pagination and chunks (65-75%)
                const progressPerChunk = 10 / showIdChunks.length;
                const chunkProgress = (i / showIdChunks.length) * 10;
                const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
                setLoadingProgress(Math.min(75, 65 + chunkProgress + pageProgress));
                
                // If we got fewer records than the page size, we're done with this chunk
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Get shows data to know when each song was seen with pagination and chunking
          let allShowsData = [];
          
          for (let i = 0; i < showIdChunks.length; i++) {
            const currentChunk = showIdChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              
              const { data, error } = await supabase
                .from('shows')
                .select('show_id, show_date')
                .in('show_id', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allShowsData = [...allShowsData, ...data];
                page++;
                
                // Update progress based on pagination and chunks (75-85%)
                const progressPerChunk = 10 / showIdChunks.length;
                const chunkProgress = (i / showIdChunks.length) * 10;
                const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
                setLoadingProgress(Math.min(85, 75 + chunkProgress + pageProgress));
                
                // If we got fewer records than the page size, we're done with this chunk
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Create a map of show IDs to dates
          const showDates: Record<string, string> = {};
          allShowsData.forEach(show => {
            showDates[show.show_id] = show.show_date;
          });
          
          // First get song IDs from song names
          const songNames = [...new Set(allEntriesData.map(entry => entry.entry_song))];
          
          // Split songNames into chunks for batch processing
          const songNameChunks = [];
          const songChunkSize = 200; // Supabase has limits on IN clause size
          
          for (let i = 0; i < songNames.length; i += songChunkSize) {
            songNameChunks.push(songNames.slice(i, i + songChunkSize));
          }
          
          // Get song ID mapping with pagination and chunking
          let allSongMappingData = [];
          
          for (let i = 0; i < songNameChunks.length; i++) {
            const currentChunk = songNameChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              
              const { data, error } = await supabase
                .from('songs')
                .select('song, song_id')
                .in('song', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allSongMappingData = [...allSongMappingData, ...data];
                page++;
                
                // Update progress based on pagination and chunks (85-95%)
                const progressPerChunk = 10 / songNameChunks.length;
                const chunkProgress = (i / songNameChunks.length) * 10;
                const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
                setLoadingProgress(Math.min(95, 85 + chunkProgress + pageProgress));
                
                // If we got fewer records than the page size, we're done with this chunk
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Create a mapping from song name to song_id
          const songNameToId: Record<string, string> = {};
          allSongMappingData.forEach(song => {
            songNameToId[song.song] = song.song_id;
          });
          
          // Count unique shows for each song and track last seen date
          const songCounts: Record<string, {count: number, dates: string[], showsSet: Set<string>}> = {};
          allEntriesData.forEach(entry => {
            const songId = songNameToId[entry.entry_song];
            if (songId) {
              if (!songCounts[songId]) {
                songCounts[songId] = { count: 0, dates: [], showsSet: new Set() };
              }
              // Only count each show once per song
              if (!songCounts[songId].showsSet.has(entry.entry_show)) {
                songCounts[songId].showsSet.add(entry.entry_show);
                songCounts[songId].count += 1;
                if (showDates[entry.entry_show]) {
                  songCounts[songId].dates.push(showDates[entry.entry_show]);
                }
              }
            }
          });
          
          // Convert to array format with last seen date
          const songStats = Object.entries(songCounts).map(([song_id, data]) => {
            // Sort dates in descending order to get most recent
            const sortedDates = [...data.dates].sort((a, b) => 
              new Date(b).getTime() - new Date(a).getTime()
            );
            
            return {
              song_id,
              count: data.count,
              last_seen_date: sortedDates[0] || undefined
            };
          });
          
          setUserSongStats(songStats);
        }
        setLoadingProgress(97);

        setCategories(allCategoriesData || []);
        setSongs(allSongsData || []);
        setLoadingProgress(100);
        
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingProgress(100);
        
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchData();
  }, [effectiveUserId]);

  // Group songs by category
  const songsByCategory = React.useMemo(() => {
    const grouped: Record<string, Song[]> = {};
    
    categories.forEach(category => {
      // Filter songs for this category
      const categorySongs = songs.filter(
        song => song.song_category === category.category
      );
      
      // Sort by song_categoryorder first, then alphabetically by song name
      const sortedSongs = categorySongs.sort((a, b) => {
        // First compare by categoryorder
        if (a.song_categoryorder !== b.song_categoryorder) {
          return a.song_categoryorder - b.song_categoryorder;
        }
        // If categoryorder is the same, sort alphabetically
        return a.song.localeCompare(b.song);
      });
      
      grouped[category.category] = sortedSongs;
    });
    
    return grouped;
  }, [songs, categories]);

  // Get song stats for a specific song
  const getSongStats = (songId: string): { count: number, lastSeenDate?: string } => {
    const stat = userSongStats.find(s => s.song_id === songId);
    return {
      count: stat ? stat.count : 0,
      lastSeenDate: stat?.last_seen_date
    };
  };

  // Separate categories into three sections based on category_canonid
  const sectionedCategories = React.useMemo(() => {
    // First section: Categories with canonid 1-98
    const section1 = categories.filter(cat => cat.category_canonid >= 1 && cat.category_canonid <= 98);
    
    // Second section: Categories with canonid 99 and 100
    const section2 = categories.filter(cat => cat.category_canonid === 99 || cat.category_canonid === 100);
    
    // Third section: Categories with canonid 101+
    const section3 = categories.filter(cat => cat.category_canonid >= 101);

    return { section1, section2, section3 };
  }, [categories]);

  // Create columns with the proper distribution based on column count
  const createCategoryColumns = (sectionCategories: Category[], numColumns: number = 4) => {
    // Sort categories by canonid first
    const sortedCategories = [...sectionCategories].sort(
      (a, b) => a.category_canonid - b.category_canonid
    );
    
    if (numColumns === 1) {
      // For single column, just return all categories in one column
      return [sortedCategories];
    }
    
    const totalCategories = sortedCategories.length;
    const result: Category[][] = Array.from({ length: numColumns }, () => []);
    
    // For multi-column layouts, distribute vertically first, then horizontally
    // This distributes as:
    // 1, n+1, 2n+1, ...
    // 2, n+2, 2n+2, ...
    // etc.
    
    const rowsNeeded = Math.ceil(totalCategories / numColumns);
    
    // First create a virtual grid laid out in rows
    const grid: Category[][] = [];
    for (let i = 0; i < rowsNeeded; i++) {
      grid.push([]);
      for (let j = 0; j < numColumns; j++) {
        const index = i + j * rowsNeeded;
        if (index < totalCategories) {
          grid[i].push(sortedCategories[index]);
        }
      }
    }
    
    // Then transform the grid into columns
    for (let col = 0; col < numColumns; col++) {
      for (let row = 0; row < rowsNeeded; row++) {
        if (grid[row] && grid[row][col]) {
          result[col].push(grid[row][col]);
        }
      }
    }
    
    return result;
  };

  // Create columns for each section, using the currentColumnCount for responsive sizing
  const section1Columns = React.useMemo(() => {
    // For original songs: 4 columns on xl, 3 on lg, 2 on sm, 1 on xs
    let cols = currentColumnCount;
    return createCategoryColumns(sectionedCategories.section1, cols);
  }, [sectionedCategories.section1, currentColumnCount]);
  
  // Section 2: Covers - maximum of 2 columns
  const section2Columns = React.useMemo(() => {
    // For covers: 2 columns max, 1 on mobile
    let cols = Math.min(currentColumnCount, 2);
    return createCategoryColumns(sectionedCategories.section2, cols);
  }, [sectionedCategories.section2, currentColumnCount]);
  
  // Section 3: Other Songs - same responsive behavior as section 1
  const section3Columns = React.useMemo(() => {
    // For other songs: 4 columns on xl, 3 on lg, 2 on sm, 1 on xs
    let cols = currentColumnCount;
    return createCategoryColumns(sectionedCategories.section3, cols);
  }, [sectionedCategories.section3, currentColumnCount]);

  // Get loading and empty state messages based on whose profile is being viewed
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading song data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} song data...`;
    }
  };

  // Render a category section
  const renderCategorySection = (columns: Category[][], title: string, sectionType: 'original' | 'covers' | 'other') => {
    if (columns.flat().length === 0) return null;
    
    // Special layout for covers section with responsive column behavior
    const getCoverSongGridClass = () => {
      if (sectionType !== 'covers') return "space-y-0";
      
      // Responsive grid layout for covers section:
      // 2 columns on xl and sm-md breakpoints, 1 column on lg and xs
      return `grid ${
        currentColumnCount === 4 || (currentColumnCount === 2 && window.innerWidth < 1024) 
          ? 'grid-cols-2' 
          : 'grid-cols-1'
      } gap-x-2 gap-y-0`;
    };
    
    const songListClass = getCoverSongGridClass();
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-4">{title}</h3>
        <div className={`grid grid-cols-1 ${
          sectionType === 'covers' 
            ? 'sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2' 
            : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        } gap-6`}>
          {columns.map((columnCategories, columnIndex) => (
            <div key={`${title}-column-${columnIndex}`} className="flex flex-col gap-6">
              {columnCategories.map(category => {
                const categorySongs = songsByCategory[category.category] || [];
                
                return (
                  <div 
                    key={category.category} 
                    className="bg-primary rounded-lg p-4 border border-black h-auto w-full relative"
                  >
                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-black/20">
                      <h4 className="text-lg font-semibold text-black">
                        {category.category || category.category}
                      </h4>
                      {category.category_artwork && (
                        <div className="h-7 flex-shrink-0">
                          <img 
                            src={category.category_artwork} 
                            alt={`${category.category} artwork`}
                            className="h-full object-contain rounded border border-black/10"
                          />
                        </div>
                      )}
                    </div>
                    <ul className={songListClass}>
                      {categorySongs.map(song => {
                        const { count } = getSongStats(song.song_id);
                        const seen = count > 0;
                        
                        return (
                          <li 
                            key={song.song_id} 
                            className="text-xs hover:bg-black/5 transition-colors py-0.5 px-1 rounded cursor-pointer"
                            onClick={() => navigate(`/song/${song.song_id}`)}
                          >
                            <span 
                              className={`${seen 
                                ? 'font-bold hover:text-[#f9ae37] hover:underline transition-colors text-left text-xs text-[#a9682e]' 
                                : 'text-black/70'}`}
                            >
                              {song.song}
                            </span>
                            {seen && (
                              <span className="ml-2 text-black font-semibold">({count})</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-black mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Section 1: Categories with canonid 1-98 */}
      {renderCategorySection(section1Columns, "Original Songs", 'original')}
      
      {/* Section 2: Categories with canonid 99-100 */}
      {renderCategorySection(section2Columns, "Covers", 'covers')}
      
      {/* Section 3: Categories with canonid 101+ */}
      {renderCategorySection(section3Columns, "Other Songs", 'other')}
    </div>
  );
}

export default UserSongs;