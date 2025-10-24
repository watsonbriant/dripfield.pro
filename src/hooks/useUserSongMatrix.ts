import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { MatrixSortMode } from '../components/UserSongMatrix';

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

interface UserSongMatrixData {
  songs: string[];
  showDates: string[];
  data: Record<string, Array<{ 
    showId: string, 
    placement: string | null,
    count: number,
    venueAppearanceCount: number
  }>>;
}

export const useUserSongMatrix = (shows: Array<any>, sortMode: MatrixSortMode) => {
  const [songMatrix, setSongMatrix] = useState<UserSongMatrixData>({ 
    songs: [], 
    showDates: [], 
    data: {} 
  });
  const [sortedSongs, setSortedSongs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(50);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadItem[]>([]);
  const [songCategoryMap, setSongCategoryMap] = useState<Record<string, { category: string, canonid: number, artist?: string }>>({});
  const [songFirstAppearance, setSongFirstAppearance] = useState<Record<string, {
    showDate: string,
    entrySet: string,
    entrySetnum: number
  }>>({});
  const [songLastAppearance, setSongLastAppearance] = useState<Record<string, {
    showDate: string,
    entrySet: string,
    entrySetnum: number
  }>>({});

  useEffect(() => {
    async function buildSongMatrix() {
      if (!shows || shows.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadingProgress(55);
        
        // Extract all show IDs for query
        const showIds = shows.map(show => show.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200;
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        // Get all setlist entries for these shows with pagination and chunking
        let allEntriesData: Array<any> = [];
        
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
        
        // Store first appearance data for sorting
        const songFirstAppearance: Record<string, {
          showDate: string,
          entrySet: string,
          entrySetnum: number
        }> = {};
        
        // Store last appearance data for 'Most Played' sorting
        const songLastAppearanceDetails: Record<string, {
          showDate: string,
          entrySet: string,
          entrySetnum: number
        }> = {};
        
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
          
          if (showDateA !== showDateB) {
            return new Date(showDateA).getTime() - new Date(showDateB).getTime();
          }
          
          if (a.entry_set !== b.entry_set) {
            return a.entry_set.localeCompare(b.entry_set);
          }
          
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
          showEntriesMap.get(showId)?.push(entry);
        });

        // Process each show to find valid songs
        const validEntries: any[] = [];
        showEntriesMap.forEach((showEntries) => {
          const validSongs = new Set<string>();
          showEntries.forEach(entry => {
            if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
              validSongs.add(entry.entry_song);
            }
          });
          
          showEntries.forEach(entry => {
            if (validSongs.has(entry.entry_song)) {
              validEntries.push(entry);
            }
          });
        });

        // Process entries to build the matrix data
        validEntries.forEach(entry => {
          const song = entry.entry_song;
          const showId = entry.entry_show;
          const placement = entry.entry_placement;
          
          const songShowKey = `${song}|${showId}`;
          
          const currentCount = songShowCountMap.get(songShowKey) || 0;
          
          let venueAppearanceCount = songVenueAppearances.get(song) || 0;
          if (currentCount === 0) {
            venueAppearanceCount += 1;
            songVenueAppearances.set(song, venueAppearanceCount);
            
            // Store first appearance data for chronological sorting
            if (!songFirstAppearance[song]) {
              const showDate = showDateMap.get(showId);
              songFirstAppearance[song] = {
                showDate: showDate || "",
                entrySet: entry.entry_set || "",
                entrySetnum: entry.entry_setnum || 0
              };
            }
            
            // Update last appearance data for 'Most Played' sorting
            const showDate = showDateMap.get(showId);
            if (showDate) {
              songLastAppearanceDetails[song] = {
                showDate: showDate,
                entrySet: entry.entry_set || "",
                entrySetnum: entry.entry_setnum || 0
              };
            }
          }
          
          songShowCountMap.set(songShowKey, currentCount + 1);
          
          if (!matrixData[song]) {
            matrixData[song] = [];
          }
          
          const existingEntry = matrixData[song].find(item => item.showId === showId);
          
          if (!existingEntry) {
            matrixData[song].push({ 
              showId, 
              placement,
              count: currentCount + 1,
              venueAppearanceCount
            });
          } else if (currentCount > 0) {
            existingEntry.count = currentCount + 1;
          }
        });
        
        setLoadingProgress(95);
        
        setSongMatrix({
          songs: uniqueSongs,
          showDates: showDates.map(s => s.displayDate),
          data: matrixData
        });
        
        // Store first appearance data for sorting
        setSongFirstAppearance(songFirstAppearance);
        setSongLastAppearance(songLastAppearanceDetails);
        
        // Prepare song spread data
        await prepareSongSpreadData(matrixData, categoryMap);
        
        setLoadingProgress(100);
        
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
  }, [shows]);
  
  // Effect to sort songs when songMatrix or sort mode changes
  useEffect(() => {
    if (!songMatrix.songs.length) return;
    
    let sorted = [...songMatrix.songs];
    
    switch (sortMode) {
      case 'alphabetical':
        break;
      case 'chronological':
        sorted = sorted.sort((a, b) => {
          const firstA = songFirstAppearance[a];
          const firstB = songFirstAppearance[b];
          
          if (!firstA || !firstB) return 0;
          
          // First sort by show date
          const dateComparison = new Date(firstA.showDate).getTime() - new Date(firstB.showDate).getTime();
          if (dateComparison !== 0) {
            return dateComparison;
          }
          
          // If same date, sort by set (Set 1, Set 2, etc.)
          const setComparison = firstA.entrySet.localeCompare(firstB.entrySet);
          if (setComparison !== 0) {
            return setComparison;
          }
          
          // If same set, sort by setnum (position within the set)
          return firstA.entrySetnum - firstB.entrySetnum;
        });
        break;
      case 'playcount':
        sorted = sorted.sort((a, b) => {
          const aCount = songMatrix.data[a]?.length || 0;
          const bCount = songMatrix.data[b]?.length || 0;
          
          // Primary sort: Descending order of unique shows
          if (aCount !== bCount) {
            return bCount - aCount;
          }
          
          // Secondary sort: Ascending order of show date when final count was reached
          const lastA = songLastAppearance[a];
          const lastB = songLastAppearance[b];
          
          if (!lastA || !lastB) return 0;
          
          const dateA = new Date(lastA.showDate).getTime();
          const dateB = new Date(lastB.showDate).getTime();
          
          if (dateA !== dateB) {
            return dateA - dateB; // Earlier date first
          }
          
          // Tertiary sort: Ascending order of entry_set
          const setComparison = (lastA.entrySet || "").localeCompare(lastB.entrySet || "");
          if (setComparison !== 0) {
            return setComparison;
          }
          
          // Quaternary sort: Ascending order of entry_setnum
          return (lastA.entrySetnum || 0) - (lastB.entrySetnum || 0);
        });
        break;
    }
    
    setSortedSongs(sorted);
  }, [songMatrix, sortMode, shows, songFirstAppearance, songLastAppearance]);
  
  // Function to prepare song spread data
  const prepareSongSpreadData = async (
    matrixData: Record<string, Array<any>>,
    categoryMap: Record<string, { category: string, canonid: number, artist?: string }>
  ) => {
    const categorySongs: Record<string, Array<{song: string, playCount: number, artist?: string}>> = {};
    const categoryTotalPerformances: Record<string, number> = {};
    
    Object.entries(matrixData).forEach(([song, performances]) => {
      const songInfo = categoryMap[song] || { category: 'Uncategorized', canonid: 9999 };
      const category = songInfo.category;
      const playCount = performances.length;
      
      if (!categorySongs[category]) {
        categorySongs[category] = [];
        categoryTotalPerformances[category] = 0;
      }
      
      categorySongs[category].push({
        song,
        playCount,
        artist: songInfo.artist
      });
      
      categoryTotalPerformances[category] += playCount;
    });
    
    const categoryCanonIds: Record<string, number> = {};
    Object.values(categoryMap).forEach(info => {
      if (!categoryCanonIds[info.category]) {
        categoryCanonIds[info.category] = info.canonid;
      }
    });
    
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
    
    const spreadData = Object.keys(categoryTotalPerformances).map(category => ({
      category,
      count: categoryTotalPerformances[category],
      canonid: categoryCanonIds[category] || 9999,
      artwork: categoryArtwork[category] || null,
      songs: categorySongs[category].sort((a, b) => b.playCount - a.playCount)
    })).sort((a, b) => a.canonid - b.canonid);
    
    setSongSpreadData(spreadData);
  };

  return {
    songMatrix,
    sortedSongs,
    isLoading,
    loadingProgress,
    errorMessage,
    songSpreadData,
    songCategoryMap
  };
};
