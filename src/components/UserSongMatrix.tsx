import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import { ArrowDownUp } from 'lucide-react';
import { CompactModal } from './CompactModal';

// Define matrix sort mode type (same as in TourSongsCombined)
export type MatrixSortMode = 'alphabetical' | 'chronological' | 'playcount';

const cleanSongName = (songName: string): string => {
  return songName
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/∆/g, 'a');
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
          stroke="#b4b2b2" 
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
      <div className="absolute text-lg font-bold text-[#a9682e]">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface UserSongMatrixProps {
  userId?: string;
  songIdMap?: { [songName: string]: string };
  yearIdMap?: { [year: string]: string };
  hideTitle?: boolean;
  className?: string;
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

const UserSongMatrix: React.FC<UserSongMatrixProps> = ({ 
  userId,
  songIdMap = {}, 
  yearIdMap = {},
  hideTitle = false,
  className = ""
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shows, setShows] = useState<Array<any>>([]);
  const [songMatrix, setSongMatrix] = useState<{
    songs: string[];
    showDates: string[];
    data: Record<string, Array<{ 
      showId: string, 
      placement: string | null,
      count: number,
      venueAppearanceCount: number
    }>>;
  }>({ songs: [], showDates: [], data: {} });
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadItem[]>([]);
  const [songCategoryMap, setSongCategoryMap] = useState<Record<string, { category: string, canonid: number, artist?: string }>>({});
  const [username, setUsername] = useState<string | null>(null);
  
  // Add state for sorting mode
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>('alphabetical');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortedSongs, setSortedSongs] = useState<string[]>([]);

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

  useEffect(() => {
    async function fetchUserShows() {
      if (!effectiveUserId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true); // Ensure loading state is set to true at the beginning
      setLoadingProgress(5);
      
      try {
        // First get the user's attended show IDs with pagination
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            // Update progress based on pagination (5-20%)
            setLoadingProgress(Math.min(20, 5 + (page * 3)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(25);
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          // Keep loading state true until we decide loading is complete
          // We'll set this at the end of the function with a delay
          setShows([]);
          setLoadingProgress(100);
          
          // Small delay to ensure we don't flash "No show data" message
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
          return;
        }

        // Get full show details for these IDs with pagination and chunking
        const showIds = allAttendedShows.map(s => s.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        let allShowsData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('shows')
              .select('*')
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('show_date', { ascending: true });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allShowsData = [...allShowsData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (25-45%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(45, 25 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        // Sort shows by date
        allShowsData.sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());
        
        setShows(allShowsData);
        setLoadingProgress(50);
        
      } catch (error) {
        console.error('Error fetching user attended shows:', error);
        setErrorMessage('Failed to load attended shows data');
        setLoadingProgress(100);
        
        // Only set loading to false after a delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }

    fetchUserShows();
  }, [effectiveUserId]);

  useEffect(() => {
    async function buildSongMatrix() {
      if (!shows || shows.length === 0) {
        return; // Don't proceed or change loading state here
      }

      try {
        // Keep the loading state true during the matrix building process
        setIsLoading(true);
        setLoadingProgress(55);
        
        // Extract all show IDs for query
        const showIds = shows.map(show => show.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        // Get all setlist entries for these shows with pagination and chunking
        let allEntriesData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          let page = 0;
          let hasMore = true;
          const pageSize = 1000;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('setlist_entries')
              .select(`
                entry_id,
                entry_song,
                entry_show,
                entry_placement,
                entry_set,
                entry_setnum,
                entry_short,
                shows(show_date),
                songs:entry_song(
                  song,
                  song_category,
                  song_originalartist,
                  categories:song_category(
                    category_canonid
                  )
                )
              `)
              .in('entry_show', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('entry_song', { ascending: true });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allEntriesData = [...allEntriesData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (55-80%)
              const progressPerChunk = 25 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 25;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(80, 55 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        setLoadingProgress(85);

        // Extract unique songs and sort alphabetically
        const uniqueSongs = Array.from(new Set(allEntriesData.map(entry => entry.entry_song))).sort();
        
        // Create song category mapping for song spread
        const categoryMap: Record<string, { category: string, canonid: number, artist?: string }> = {};
        allEntriesData.forEach(entry => {
          if (entry.songs && !categoryMap[entry.entry_song]) {
            categoryMap[entry.entry_song] = {
              category: entry.songs.song_category || 'Uncategorized',
              canonid: entry.songs.categories?.category_canonid || 9999,
              artist: entry.songs.song_originalartist
            };
          }
        });
        setSongCategoryMap(categoryMap);
        
        setLoadingProgress(88);
        
        // Map of show IDs to their dates and create an ordered list of show dates
        const showDateMap = new Map();
        shows.forEach(show => {
          showDateMap.set(show.show_id, show.show_date);
        });
        
        // Create the ordered dates array from sorted shows
        const showDates = shows.map(show => ({
          id: show.show_id,
          date: show.show_date,
          // Format as MM.DD using formatInTimeZone
          displayDate: formatInTimeZone(
            new Date(show.show_date),
            'UTC',
            'MM.dd'
          )
        }));

        // Build data structure for matrix
        const matrixData: Record<string, Array<{ 
          showId: string, 
          placement: string | null,
          count: number,
          venueAppearanceCount: number
        }>> = {};
        
        // Initialize all songs with empty arrays
        uniqueSongs.forEach(song => {
          matrixData[song] = [];
        });
        
        // Group entries by show and song to count occurrences
        const songShowCountMap = new Map();
        
        // Keep track of sequential appearances for each song across shows
        const songVenueAppearances = new Map();
        uniqueSongs.forEach(song => {
          songVenueAppearances.set(song, 0);
        });
        
        setLoadingProgress(90);
        
        // First, sort entries by show date, then set and setnum to process chronologically
        const sortedEntries = [...allEntriesData].sort((a, b) => {
          const showDateA = showDateMap.get(a.entry_show) || "";
          const showDateB = showDateMap.get(b.entry_show) || "";
          
          // First sort by show date
          if (showDateA !== showDateB) {
            return new Date(showDateA).getTime() - new Date(showDateB).getTime();
          }
          
          // Then by set
          if (a.entry_set !== b.entry_set) {
            return a.entry_set.localeCompare(b.entry_set);
          }
          
          // Finally by setnum
          return a.entry_setnum - b.entry_setnum;
        });
        
        setLoadingProgress(92);

        const skipShorts = ["fake", "tease", "reprise", "aborted"];

        // Group entries by show to identify valid songs
        const showEntriesMap = new Map<string, any[]>();
        sortedEntries.forEach(entry => {
          const showId = entry.entry_show;
          if (!showEntriesMap.has(showId)) {
            showEntriesMap.set(showId, []);
          }
          showEntriesMap.get(showId).push(entry);
        });

        // Process each show to find valid songs
        const validEntries: any[] = [];
        showEntriesMap.forEach((showEntries, showId) => {
          // Find songs with valid performances in this show
          const validSongs = new Set<string>();
          showEntries.forEach(entry => {
            if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
              validSongs.add(entry.entry_song);
            }
          });
          
          // Only include entries for songs that have valid performances
          showEntries.forEach(entry => {
            if (validSongs.has(entry.entry_song)) {
              validEntries.push(entry);
            }
          });
        });

        // Process entries to build the matrix data (replace sortedEntries with validEntries)
        validEntries.forEach(entry => {
          const song = entry.entry_song;
          const showId = entry.entry_show;
          const placement = entry.entry_placement;
          
          // Create a key for this song+show combination
          const songShowKey = `${song}|${showId}`;
          
          // Get or initialize the count for this song in this show
          const currentCount = songShowCountMap.get(songShowKey) || 0;
          
          // Only count the first occurrence of the song in each show for venue-wide sequential numbering
          let venueAppearanceCount = songVenueAppearances.get(song) || 0;
          if (currentCount === 0) {
            // This is the first time this song appears in this show
            venueAppearanceCount += 1;
            songVenueAppearances.set(song, venueAppearanceCount);
          }
          
          // Increment the within-show count
          songShowCountMap.set(songShowKey, currentCount + 1);
          
          // Add this performance to the song's list if it's the first appearance in this show
          if (!matrixData[song]) {
            matrixData[song] = [];
          }
          
          // Check if we already have an entry for this song + show
          const existingEntry = matrixData[song].find(item => item.showId === showId);
          
          if (!existingEntry) {
            // First appearance in this show - add with count 1
            matrixData[song].push({ 
              showId, 
              placement,
              count: currentCount + 1,
              venueAppearanceCount
            });
          } else if (currentCount > 0) {
            // For subsequent appearances, keep the first one's placement but update count
            existingEntry.count = currentCount + 1;
          }
        });
        
        setLoadingProgress(95);
        
        setSongMatrix({
          songs: uniqueSongs,
          showDates: showDates.map(s => s.displayDate),
          data: matrixData
        });
        
        // Prepare song spread data
        await prepareSongSpreadData(matrixData, categoryMap);
        
        setLoadingProgress(100);
        
        // Small delay to ensure smooth transition and avoid flash of no-data state
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching song matrix data:', error);
        setErrorMessage('Failed to load song matrix data');
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }

    if (shows && shows.length > 0) {
      buildSongMatrix();
    }
    // We don't set isLoading=false here since that would cause a flash
  }, [shows]);
  
  // Effect to sort songs when songMatrix or sort mode changes
  useEffect(() => {
    if (!songMatrix.songs.length) return;
    
    let sorted = [...songMatrix.songs];
    
    switch (matrixSortMode) {
      case 'alphabetical':
        // Already alphabetical from data fetching
        break;
      case 'chronological':
        // Sort by first appearance date (first show in which each song appears)
        sorted = sorted.sort((a, b) => {
          const aPerformances = songMatrix.data[a] || [];
          const bPerformances = songMatrix.data[b] || [];
          
          // Get the first show ID for each song
          const aFirstShowId = aPerformances.length > 0 ? aPerformances[0].showId : '';
          const bFirstShowId = bPerformances.length > 0 ? bPerformances[0].showId : '';
          
          // Find the index of these shows in the shows array to determine chronology
          const aShowIndex = shows.findIndex(show => show.show_id === aFirstShowId);
          const bShowIndex = shows.findIndex(show => show.show_id === bFirstShowId);
          
          return aShowIndex - bShowIndex;
        });
        break;
      case 'playcount':
        // Sort by number of performances (highest to lowest)
        sorted = sorted.sort((a, b) => {
          const aCount = songMatrix.data[a]?.length || 0;
          const bCount = songMatrix.data[b]?.length || 0;
          return bCount - aCount;
        });
        break;
    }
    
    setSortedSongs(sorted);
  }, [songMatrix, matrixSortMode, shows]);
  
  // Function to prepare song spread data similar to SongsPlayed component
  const prepareSongSpreadData = async (
    matrixData: Record<string, Array<any>>,
    categoryMap: Record<string, { category: string, canonid: number, artist?: string }>
  ) => {
    // Group songs by category and count performances
    const categorySongs: Record<string, Array<{song: string, playCount: number, artist?: string}>> = {};
    const categoryTotalPerformances: Record<string, number> = {};
    
    // Process each song in the matrix
    Object.entries(matrixData).forEach(([song, performances]) => {
      const songInfo = categoryMap[song] || { category: 'Uncategorized', canonid: 9999 };
      const category = songInfo.category;
      const playCount = performances.length; // Number of shows where this song was played
      
      if (!categorySongs[category]) {
        categorySongs[category] = [];
        categoryTotalPerformances[category] = 0;
      }
      
      categorySongs[category].push({
        song,
        playCount,
        artist: songInfo.artist
      });
      
      // Add to total performances for this category
      categoryTotalPerformances[category] += playCount;
    });
    
    // Get category canon IDs
    const categoryCanonIds: Record<string, number> = {};
    Object.values(categoryMap).forEach(info => {
      if (!categoryCanonIds[info.category]) {
        categoryCanonIds[info.category] = info.canonid;
      }
    });
    
    // Fetch category artwork first
    let categoryArtwork: Record<string, string | null> = {};
    try {
      const categories = Object.keys(categoryTotalPerformances);
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('category, category_artwork')
        .in('category', categories);
        
      if (!error && categoriesData) {
        categoriesData.forEach(cat => {
          categoryArtwork[cat.category] = cat.category_artwork;
        });
      }
    } catch (error) {
      console.error('Error fetching category artwork:', error);
    }
    
    // Now that we have artwork, create the spread data
    const spreadData = Object.keys(categoryTotalPerformances).map(category => ({
      category,
      count: categoryTotalPerformances[category],
      canonid: categoryCanonIds[category] || 9999,
      artwork: categoryArtwork[category] || null,
      songs: categorySongs[category].sort((a, b) => b.playCount - a.playCount)
    })).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.canonid - b.canonid;
    });
    
    setSongSpreadData(spreadData);
  };

  const getColumnBackgroundColor = (placement: string | null): string => {
    if (!placement) return '';
    
    const colorMap: { [key: string]: string } = {
      'Set 1 Opener': '#006400', // Dark green
      'Set 1 Closer': '#995905', // Brown
      'Set 2 Opener': '#019B7A', // Teal
      'Set 3 Opener': '#019B7A',
      'Set 4 Opener': '#019B7A',
      'Set 5 Opener': '#019B7A',
      'Set 2 Closer': '#E17401', // Orange
      'Set 3 Closer': '#E17401',
      'Set 4 Closer': '#E17401',
      'Set 5 Closer': '#E17401',
      'Encore 1': '#7C2128', // Dark red
      'Encore 2': '#CE1126', // Bright red
      'Encore 3': '#AF1E2D'  // Medium red
    };
    
    // For Main Set entries, use the specified color from the attachment (dark navy)
    if (placement.startsWith('Main Set')) {
      return '#000000'; // Dark navy color from TourSongMatrix
    }
    
    return colorMap[placement] || '#1C4482'; // Default to navy if no specific color
  };

  // Get loading message based on profile ownership
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading your song matrix...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} song matrix...`;
    }
  };

  // Get title text based on profile ownership
  const getTitle = () => {
    if (isOwnProfile) {
      return `${songMatrix.songs.length} Songs`;
    } else if (username) {
      return `${songMatrix.songs.length} Songs`;
    } else {
      return `${songMatrix.songs.length} Songs`;
    }
  };

  // Get empty state messages based on profile ownership
  const getNoShowsMessage = () => {
    if (isOwnProfile) {
      return "No show data available. Add shows you've attended to see your song matrix.";
    } else if (username) {
      return `${username} hasn't attended any shows yet.`;
    } else {
      return "No show data available for this user.";
    }
  };

  const getNoSongDataMessage = () => {
    if (isOwnProfile) {
      return "No song data available for your attended shows";
    } else if (username) {
      return `No song data available for ${username}'s attended shows`;
    } else {
      return "No song data available for this user's attended shows";
    }
  };

  const getErrorMessage = () => {
    if (isOwnProfile) {
      return errorMessage || "An error occurred loading your song matrix";
    } else if (username) {
      return `An error occurred loading ${username}'s song matrix`;
    } else {
      return "An error occurred loading the song matrix";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-secondary">Song Matrix</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">{getLoadingMessage()}</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-fifth inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-secondary mb-4">{getTitle()}</h2>
        <div className="text-center py-6 text-red-500">{getErrorMessage()}</div>
      </div>
    );
  }

  // We'll only check these conditions once loading is fully complete
  // This prevents the flash of "no data" messages during loading
  const noShows = !isLoading && shows.length === 0;
  const noSongData = !isLoading && shows.length > 0 && songMatrix.songs.length === 0;

  if (noShows) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-fifth inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-secondary mb-4">{isOwnProfile ? "Your Song Matrix" : `${username ? username + "'s" : "Their"} Song Matrix`}</h2>
        <div className="text-center py-6 text-fifth">
          {getNoShowsMessage()}
        </div>
      </div>
    );
  }

  if (noSongData) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-fifth inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-secondary mb-4">{isOwnProfile ? "Your Song Matrix" : `${username ? username + "'s" : "Their"} Song Matrix`}</h2>
        <div className="text-center py-6 text-fifth">{getNoSongDataMessage()}</div>
      </div>
    );
  }

  // Group shows by year
  const groupShowsByYear = () => {
    if (!shows || shows.length === 0) return [];
    
    const yearGroups = [];
    let currentYear = '';
    let currentGroup = [];
    
    shows.forEach((show, index) => {
      const year = new Date(show.show_date).getFullYear().toString();
      
      if (year !== currentYear) {
        if (currentGroup.length > 0) {
          yearGroups.push({
            year: currentYear,
            shows: currentGroup,
            startIndex: index - currentGroup.length,
            endIndex: index - 1
          });
        }
        currentYear = year;
        currentGroup = [show];
      } else {
        currentGroup.push(show);
      }
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      yearGroups.push({
        year: currentYear,
        shows: currentGroup,
        startIndex: shows.length - currentGroup.length,
        endIndex: shows.length - 1
      });
    }
    
    return yearGroups;
  };
  
  const yearGroups = groupShowsByYear();
  
  // Calculate max count for song spread bars
  const maxCount = Math.max(...songSpreadData.map(cat => cat.count), 1);
  
  return (
    <div className={`${!hideTitle ? "bg-primary border border-secondary rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-secondary">
            {getTitle()}
          </h2>
          <div className="flex items-center gap-3">
            {/* Desktop version of sort controls */}
            <div className="hidden md:flex items-center bg-canvas rounded-md border border-secondary py-1 px-2">
              <span className="text-fifth text-xs mr-2 font-medium">Sort:</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setMatrixSortMode('alphabetical')}
                  className={`px-2 py-0.5 text-xs rounded font-light ${
                    matrixSortMode === 'alphabetical' 
                      ? 'bg-tertiary text-fifth' 
                      : 'text-fifth hover:bg-tertiary/40'
                  }`}
                >
                  A-Z
                </button>
                <button 
                  onClick={() => setMatrixSortMode('chronological')}
                  className={`px-2 py-0.5 text-xs rounded font-light ${
                    matrixSortMode === 'chronological' 
                      ? 'bg-tertiary text-fifth' 
                      : 'text-fifth hover:bg-tertiary/40'
                  }`}
                >
                  First Seen
                </button>
                <button 
                  onClick={() => setMatrixSortMode('playcount')}
                  className={`px-2 py-0.5 text-xs rounded font-light ${
                    matrixSortMode === 'playcount' 
                      ? 'bg-tertiary text-fifth' 
                      : 'text-fifth hover:bg-tertiary/40'
                  }`}
                >
                  Most Seen
                </button>
              </div>
            </div>
            
            {/* Mobile version - sort button */}
            <button 
              onClick={() => setIsSortModalOpen(true)}
              className="md:hidden flex items-center justify-center bg-tertiary hover:bg-tertiary/40 rounded-md border border-secondary p-1.5"
              aria-label="Sort options"
            >
              <ArrowDownUp className="w-4 h-4 text-fifth" />
            </button>
            
            {/* Chart button */}
            <button 
              onClick={() => setIsSpreadModalOpen(true)} 
              className="text-fourth hover:text-tertiary transition-colors"
              aria-label="Show song spread"
            >
              <ChartBarDecreasing size={20} />
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
        <table className="w-full border-collapse min-w-max">
          <thead>
            {/* Year headers row */}
            <tr className="bg-canvas border-y border-[#b4b2b2]">
              {/* Song cell that spans both rows */}
              <th 
                className="px-2 py-1 text-left text-xs font-medium text-fifth border-l border-r border-secondary"
                rowSpan={2}
                style={{ 
                  verticalAlign: 'bottom'
                }}
              >
                Song
              </th>
              
              {/* Year spans */}
              {yearGroups.map((group, i) => {
                const colSpan = group.shows.length;
                return (
                  <th 
                    key={`year-${i}`} 
                    colSpan={colSpan}
                    className="px-1 py-1 text-center text-xs font-semibold bg-canvas"
                    style={{
                      borderRight: '1px solid #b4b2b2',
                      borderTop: '1px solid #b4b2b2'
                    }}
                  >
                    <button 
                      onClick={() => {
                        const yearId = yearIdMap[group.year];
                        if (yearId) {
                          navigate(`/years/${yearId}`);
                        }
                      }}
                      className="hover:underline transition-colors"
                    >
                      {group.year}
                    </button>
                  </th>
                );
              })}
            </tr>
            
            {/* Date headers row */}
            <tr className="bg-canvas border-y border-[#b4b2b2]">
              {shows.map((show, index) => {
                const showId = show.show_id;
                // Format date as MM.DD
                const formattedDate = formatInTimeZone(
                  new Date(show.show_date),
                  'UTC',
                  'MM.dd'
                );
                
                return (
                  <th 
                    key={index} 
                    className="px-1 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border-l border-r border-secondary" 
                    style={{ 
                      width: 'min-content'
                    }}
                  >
                    <button 
                      onClick={() => navigate(`/setlist/${showId}`)}
                      className="hover:text-[#a9682e] hover:underline transition-colors"
                    >
                      {formattedDate}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b4b2b2]">
          {sortedSongs.map((song) => {
            const performances = songMatrix.data[song] || [];
            const songIndex = sortedSongs.indexOf(song);
            
            return (
              <tr 
                key={song} 
                className={songIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'}
              >
                <td className="font-trad text-fifth text-[.875rem] leading-[1rem] pb-1 pl-2 whitespace-nowrap font-trad border"
                    style={{ borderColor: 'rgb(180, 178, 178)' }}>
                  <button 
                    onClick={() => {
                      const songId = songIdMap[song];
                      if (songId) {
                        navigate(`/song/${songId}`);
                      }
                    }}
                    className="hover:underline transition-colors cursor-pointer"
                  >
                    {cleanSongName(song)}
                  </button>
                </td>
                
                {shows.map((show) => {
                  const performance = performances.find(p => p.showId === show.show_id);
                  const bgColor = performance ? getColumnBackgroundColor(performance.placement) : '';
                  
                  return (
                    <td 
                      key={`${song}-${show.show_id}`} 
                      className="text-center border"
                      style={{ backgroundColor: bgColor, borderColor: 'rgb(180, 178, 178)' }}
                    >
                      {performance && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                          {performance.venueAppearanceCount}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
      
      {/* Song Spread Modal */}
      <Modal
        isOpen={isSpreadModalOpen}
        onClose={() => setIsSpreadModalOpen(false)}
        title="Song Spread"
      >
        <div className="bg-primary">
          <div className="space-y-1.5">
            {songSpreadData.map(({ category, count, songs, artwork }) => (
              <div key={category}>
                <div className="text-fifth text-sm font-medium">
                  {category}
                </div>
                <div className="h-5 rounded overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded border border-secondary relative flex items-center"
                    style={{ 
                      width: `${(count / maxCount) * 100}%`,
                      minWidth: '48px'
                    }}
                  >
                    {artwork && (
                      <img 
                        src={artwork} 
                        alt=""
                        onError={(e) => {
                          console.error(`Failed to load image for ${category}:`, artwork);
                          e.currentTarget.style.display = 'none';
                        }}
                        className="h-4 w-4 ml-0.5 object-cover rounded-sm"
                      />
                    )}
                    <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                      <span className="text-fifth text-sm font-semibold">{count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* Sort Modal for Mobile */}
      <CompactModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Songs By"
      >
        <div className="flex flex-col w-full">
          <button 
            onClick={() => {
              setMatrixSortMode('alphabetical');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'alphabetical' 
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            A-Z
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('chronological');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'chronological' 
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            First Seen
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('playcount');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'playcount' 
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            Most Seen
          </button>
        </div>
      </CompactModal>
    </div>
  );
};

export default UserSongMatrix;