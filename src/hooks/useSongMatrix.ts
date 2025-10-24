import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { prepareSongSpreadData } from '../utils/songSpreadUtils';

export interface SongMatrixData {
  songs: string[];
  showDates: string[];
  data: Record<string, Array<{ 
    showId: string, 
    placement: string | null,
    count: number,
    venueAppearanceCount: number
  }>>;
}

export const useSongMatrix = (shows: Array<any>, sortMode: 'alphabetical' | 'chronological' | 'playcount' = "alphabetical") => {
  const [songMatrix, setSongMatrix] = useState<SongMatrixData>({ songs: [], showDates: [], data: {} });
  const [sortedSongs, setSortedSongs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [songSpreadData, setSongSpreadData] = useState<any[]>([]);
  const [songCategoryMap, setSongCategoryMap] = useState<Record<string, { category: string, canonid: number, artist?: string }>>({});

  useEffect(() => {
    async function buildSongMatrix() {
      if (!shows || shows.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Extract all show IDs for query
        const showIds = shows.map(show => show.show_id);
        
        // Get all setlist entries for these shows
        const { data: entriesData, error } = await supabase
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
          .in('entry_show', showIds)
          .order('entry_song', { ascending: true });

        if (error) throw error;

        // Create song category mapping for song spread
        const categoryMap: Record<string, { category: string, canonid: number, artist?: string }> = {};
        entriesData.forEach(entry => {
          if (entry.songs && !categoryMap[entry.entry_song]) {
            categoryMap[entry.entry_song] = {
              category: entry.songs.song_category || 'Uncategorized',
              canonid: entry.songs.categories?.category_canonid || 9999,
              artist: entry.songs.song_originalartist
            };
          }
        });
        setSongCategoryMap(categoryMap);
        
        // Map of show IDs to their dates and create an ordered list of show dates
        const showDateMap = new Map();
        shows.forEach(show => {
          showDateMap.set(show.show_id, show.show_date);
        });
        
        // Ensure shows are in chronological order and create the ordered dates array
        const sortedShows = [...shows].sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());
        
        const showDates = sortedShows.map(show => ({
          id: show.show_id,
          date: show.show_date,
          // Format as MM.DD using formatInTimeZone like in the main Venues component
          displayDate: formatInTimeZone(
            new Date(show.show_date),
            'UTC',
            'MM.dd'
          )
        }));

        // First, sort entries by show date, then set and setnum to process chronologically
        const sortedEntries = [...entriesData].sort((a, b) => {
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
        
        const skipShorts = ["fake", "tease", "reprise", "aborted"];

        // Group entries by show to identify valid songs (same logic as TourSongStats)
        const showEntriesMap = new Map<string, any[]>();
        sortedEntries.forEach(entry => {
          const showId = entry.entry_show;
          if (!showEntriesMap.has(showId)) {
            showEntriesMap.set(showId, []);
          }
          showEntriesMap.get(showId)?.push(entry);
        });

        // Filter out short entries directly (simpler approach for matrix)
        const validEntries = sortedEntries.filter(entry => {
          return !entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase());
        });

        // Extract unique songs from valid entries only (after filtering)
        const uniqueSongs = Array.from(new Set(validEntries.map(entry => entry.entry_song))).sort();

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
        
        // Keep track of sequential appearances for each song across the venue
        const songVenueAppearances = new Map();
        uniqueSongs.forEach(song => {
          songVenueAppearances.set(song, 0);
        });

        // Process valid entries to build the matrix data
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
        
        setSongMatrix({
          songs: uniqueSongs,
          showDates: showDates.map(s => s.displayDate),
          data: matrixData
        });
        
        // Sort songs based on sortMode
        let sortedSongsArray: string[];
        switch (sortMode) {
          case "alphabetical":
            sortedSongsArray = [...uniqueSongs].sort();
            break;
          case "playcount":
            sortedSongsArray = [...uniqueSongs].sort((a, b) => {
              // Count unique shows where the song was played, not total play count
              const uniqueShowsA = matrixData[a]?.length || 0;
              const uniqueShowsB = matrixData[b]?.length || 0;
              
              // Primary sort: Descending order of unique shows
              if (uniqueShowsA !== uniqueShowsB) {
                return uniqueShowsB - uniqueShowsA;
              }
              
              // Secondary sort: Ascending order of show date when final count was reached
              const lastA = songLastAppearanceDetails[a];
              const lastB = songLastAppearanceDetails[b];
              
              if (!lastA || !lastB) return 0; // Should not happen if songs are in matrixData
              
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
          case "chronological":
            sortedSongsArray = [...uniqueSongs].sort((a, b) => {
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
          default:
            sortedSongsArray = [...uniqueSongs].sort();
        }
        
        setSortedSongs(sortedSongsArray);
        
        // Prepare song spread data
        const spreadData = await prepareSongSpreadData(matrixData, categoryMap);
        setSongSpreadData(spreadData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching song matrix data:', error);
        setErrorMessage('Failed to load song matrix data');
        setIsLoading(false);
      }
    }

    if (shows && shows.length > 0) {
      buildSongMatrix();
    } else {
      setIsLoading(false);
    }
  }, [shows, sortMode]);

  return {
    songMatrix,
    sortedSongs,
    isLoading,
    errorMessage,
    songSpreadData,
    songCategoryMap
  };
};