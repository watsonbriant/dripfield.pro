import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MatrixSortMode } from '../components/TourSongsCombined';
import { getSortedSongs } from '../utils/songMatrixUtils';

interface SongMatrixData {
  songs: string[];
  showDates: string[];
  data: Record<string, Array<{ 
    showId: string, 
    placement: string | null,
    count: number,
    tourAppearanceCount: number
  }>>;
  songMetadata: Record<string, {
    totalCount: number,
    firstPlayedShowIndex: number,
    lastMaxPlayedShowIndex: number,
    categoryCanonId: number
  }>;
}

export const useSongMatrix = (shows: Array<any>, sortMode: MatrixSortMode) => {
  const [songMatrix, setSongMatrix] = useState<SongMatrixData>({ 
    songs: [], 
    showDates: [], 
    data: {}, 
    songMetadata: {} 
  });
  const [sortedSongs, setSortedSongs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [songCategoryMap, setSongCategoryMap] = useState<Record<string, number>>({});

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
            songs(
              song_id,
              song_category,
              categories(
                category_canonid
              )
            ),
            shows(show_date)
          `)
          .in('entry_show', showIds)
          .order('entry_song', { ascending: true });

        if (error) throw error;

        // Extract unique songs and sort alphabetically
        const uniqueSongs = Array.from(new Set(entriesData.map(entry => entry.entry_song))).sort();
        
        // Map of show IDs to their dates and create an ordered list of show dates
        const showDateMap = new Map();
        shows.forEach(show => {
          showDateMap.set(show.show_id, show.show_date);
        });
        
        // Create a map of songs to their categories
        const songCategories: Record<string, number> = {};
        entriesData.forEach(entry => {
          if (entry.songs && !songCategories[entry.entry_song]) {
            songCategories[entry.entry_song] = entry.songs.categories?.category_canonid || 0;
          }
        });
        setSongCategoryMap(songCategories);
        
        // Ensure shows are in chronological order and create the ordered dates array
        const sortedShows = [...shows].sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());
        
        const showDates = sortedShows.map(show => ({
          id: show.show_id,
          date: show.show_date,
          // Format as MM.DD
          displayDate: show.show_date.split('-').slice(1).join('.')
        }));

        // Get a mapping of show IDs to their chronological index in the tour
        const showIndexMap = new Map();
        sortedShows.forEach((show, index) => {
          showIndexMap.set(show.show_id, index);
        });

        // Build data structure for matrix
        const matrixData: Record<string, Array<{ 
          showId: string, 
          placement: string | null,
          count: number,
          tourAppearanceCount: number
        }>> = {};
        
        // Initialize all songs with empty arrays
        uniqueSongs.forEach(song => {
          matrixData[song] = [];
        });
        
        // Group entries by show and song to count occurrences
        const songShowCountMap = new Map();
        
        // Keep track of sequential appearances for each song across the tour
        const songTourAppearances = new Map();
        uniqueSongs.forEach(song => {
          songTourAppearances.set(song, 0);
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
        
        // Track when each song was first played and last reached its max play count
        const songMetadata: Record<string, {
          totalCount: number,
          firstPlayedShowIndex: number,
          lastMaxPlayedShowIndex: number,
          categoryCanonId: number
        }> = {};
        
        uniqueSongs.forEach(song => {
          songMetadata[song] = {
            totalCount: 0,
            firstPlayedShowIndex: Infinity,
            lastMaxPlayedShowIndex: 0,
            categoryCanonId: songCategories[song] || 0
          };
        });
        
        // Process entries to build the matrix data
        const chronologicalSongOrder: string[] = [];
        const processedShows = new Set();
        const skipShorts = ["fake", "tease", "reprise", "aborted"];

        // First, determine which songs have valid performances in each show
        const validSongsByShow = new Map<string, Set<string>>();
        shows.forEach(show => {
          validSongsByShow.set(show.show_id, new Set<string>());
        });

        sortedEntries.forEach(entry => {
          const showId = entry.entry_show;
          const song = entry.entry_song;
          
          if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
            validSongsByShow.get(showId)?.add(song);
          }
        });

        sortedEntries.forEach(entry => {
          const song = entry.entry_song;
          const showId = entry.entry_show;
          const placement = entry.entry_placement;
          const showIndex = showIndexMap.get(showId);
          
          // Skip this entry if the song doesn't have any valid performances in this show
          if (!validSongsByShow.get(showId)?.has(song)) {
            return;
          }
          
          // Update the chronological order of songs as they first appear
          if (!chronologicalSongOrder.includes(song)) {
            chronologicalSongOrder.push(song);
          }
          
          // Update metadata for first appearance
          if (showIndex < songMetadata[song].firstPlayedShowIndex) {
            songMetadata[song].firstPlayedShowIndex = showIndex;
          }
          
          // Create a key for this song+show combination
          const songShowKey = `${song}|${showId}`;
          
          // Get or initialize the count for this song in this show
          const currentCount = songShowCountMap.get(songShowKey) || 0;
          
          // Only count the first occurrence of the song in each show for tour-wide sequential numbering
          let tourAppearanceCount = songTourAppearances.get(song) || 0;
          if (currentCount === 0) {
            // This is the first time this song appears in this show
            tourAppearanceCount += 1;
            songTourAppearances.set(song, tourAppearanceCount);
            
            // Update the total count for the song across all shows
            songMetadata[song].totalCount += 1;
            
            // Update the last show where the song reached its max play count
            songMetadata[song].lastMaxPlayedShowIndex = showIndex;
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
              tourAppearanceCount
            });
          } else if (currentCount > 0) {
            // For subsequent appearances, keep the first one's placement but update count
            existingEntry.count = currentCount + 1;
          }
        });
        
        setSongMatrix({
          songs: uniqueSongs,
          showDates: showDates.map(s => s.displayDate),
          data: matrixData,
          songMetadata
        });
        
        // Initial sort for songs
        const initialSortedSongs = getSortedSongs(uniqueSongs, matrixData, songMetadata, sortMode, chronologicalSongOrder);
        setSortedSongs(initialSortedSongs);
        
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

  // Update sorted songs whenever sort mode changes
  useEffect(() => {
    if (songMatrix.songs.length > 0) {
      const newSortedSongs = getSortedSongs(
        songMatrix.songs, 
        songMatrix.data, 
        songMatrix.songMetadata, 
        sortMode
      );
      setSortedSongs(newSortedSongs);
    }
  }, [sortMode, songMatrix]);

  return {
    songMatrix,
    sortedSongs,
    isLoading,
    errorMessage,
    songCategoryMap
  };
};
