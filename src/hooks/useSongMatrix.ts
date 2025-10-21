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

export const useSongMatrix = (shows: Array<any>) => {
  const [songMatrix, setSongMatrix] = useState<SongMatrixData>({ songs: [], showDates: [], data: {} });
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

        // Extract unique songs and sort alphabetically
        const uniqueSongs = Array.from(new Set(entriesData.map(entry => entry.entry_song))).sort();
        
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
        
        // Keep track of sequential appearances for each song across the venue
        const songVenueAppearances = new Map();
        uniqueSongs.forEach(song => {
          songVenueAppearances.set(song, 0);
        });
        
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
        
        // Process entries to build the matrix data
        sortedEntries.forEach(entry => {
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
        
        setSongMatrix({
          songs: uniqueSongs,
          showDates: showDates.map(s => s.displayDate),
          data: matrixData
        });
        
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
  }, [shows]);

  return {
    songMatrix,
    isLoading,
    errorMessage,
    songSpreadData,
    songCategoryMap
  };
};