import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MatrixSortMode } from './TourSongsCombined';
import SongTourPerformancesModal from './SongTourPerformancesModal';

interface SongSpreadProps {
  shows: Array<any>;
  songIdMap?: { [songName: string]: string };
  hideTitle?: boolean;
  className?: string;
  sortMode?: MatrixSortMode;
  tourId?: string; // Add tourId prop
}

interface SongData {
  song: string;
  performances: Array<{ 
    showId: string; 
    placement: string | null;
    count: number;
    tourAppearanceCount: number;
    showIndex: number; // Track which show (chronologically) this performance is in
  }>;
  totalCount: number;
  firstPlayedShowIndex: number;
  lastMaxPlayedShowIndex: number;
  categoryCanonId: number;
}

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

const TourSongMatrix: React.FC<SongSpreadProps> = ({ 
  shows, 
  songIdMap = {}, 
  hideTitle = false,
  className = "",
  sortMode = "alphabetical",
  tourId = ""
}) => {
  const navigate = useNavigate();
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });
  const [songMatrix, setSongMatrix] = useState<{
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
  }>({ songs: [], showDates: [], data: {}, songMetadata: {} });
  
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

  // Function to sort songs based on the selected mode
  const getSortedSongs = (
    songs: string[],
    data: Record<string, any[]>,
    metadata: Record<string, any>,
    mode: MatrixSortMode,
    chronologicalOrder?: string[]
  ): string[] => {
    switch (mode) {
      case 'alphabetical':
        // Sort alphabetically (already done when songs were extracted)
        return [...songs].sort((a, b) => a.localeCompare(b));
      
      case 'chronological':
        // If we have a chronological order from initial processing, use it
        if (chronologicalOrder && chronologicalOrder.length > 0) {
          return chronologicalOrder;
        }
        // Otherwise fallback to sorting by first appearance in the tour
        return [...songs].sort((a, b) => {
          return metadata[a].firstPlayedShowIndex - metadata[b].firstPlayedShowIndex;
        });
      
      case 'playcount':
        // Sort by total count (descending)
        return [...songs].sort((a, b) => {
          // First by total plays (descending)
          const countDiff = metadata[b].totalCount - metadata[a].totalCount;
          if (countDiff !== 0) return countDiff;
          
          // If same count, sort by which song reached max count earlier
          const maxPlayDiff = metadata[a].lastMaxPlayedShowIndex - metadata[b].lastMaxPlayedShowIndex;
          if (maxPlayDiff !== 0) return maxPlayDiff;
          
          // If same max play show, sort by category canonid
          const categoryDiff = metadata[a].categoryCanonId - metadata[b].categoryCanonId;
          if (categoryDiff !== 0) return categoryDiff;
          
          // Finally, alphabetically
          return a.localeCompare(b);
        });
      
      default:
        return songs;
    }
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
      return '#000000'; // Dark navy color from the attachment
    }
    
    return colorMap[placement] || '#1C4482'; // Default to navy if no specific color
  };

  if (isLoading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">Loading song matrix...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="text-center py-6 text-red-500">{errorMessage}</div>
      </div>
    );
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="text-center py-6 text-fifth">No song data available for this tour</div>
      </div>
    );
  }

  return (
    <div className={`${!hideTitle ? "bg-primary border border-secondary rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-full border border-secondary mb-4">
          {songMatrix.songs.length} Songs Played
        </h2>
      )}
      
      <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-canvas border-y border-secondary">
              <th className="px-2 py-1 text-left text-xs font-medium text-fifth border-l border-r border-secondary">
                Song
              </th>
              {songMatrix.showDates.map((date, index) => {
                // Find the corresponding show from the shows array
                const showId = shows[index]?.show_id || "";
                
                return (
                  <th 
                    key={index} 
                    className="px-1 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border-l border-r border-secondary" 
                    style={{ width: 'min-content' }}
                  >
                    <button 
                      onClick={() => navigate(`/setlist/${showId}`)}
                      className="hover:text-[#a9682e] transition-colors"
                    >
                      {date}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d9c3a5]">
            {sortedSongs.map((song, songIndex) => {
              const performances = songMatrix.data[song] || [];
              
              return (
                <tr 
                  key={song} 
                  className={`${songIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-tertiary/40`}
                >
                  <td className="font-trad text-fifth text-[.875rem] leading-[1rem] pb-1 px-2 whitespace-nowrap font-trad border"
                    style={{ borderColor: 'rgb(180, 178, 178)' }}>
                    <button 
                      onClick={() => {
                        setModalSongData({
                          isOpen: true,
                          songName: song
                        });
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
                            {performance.tourAppearanceCount}
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
      
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={tourId}
        currentShowId=""
      />
    </div>
  );
};

export default TourSongMatrix;