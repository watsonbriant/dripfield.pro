import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { Modal } from './Modal';

interface VenueSongMatrixProps {
  shows: Array<any>;
  songIdMap?: { [songName: string]: string };
  yearIdMap?: { [year: string]: string };
  hideTitle?: boolean;
  className?: string;
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

const VenueSongMatrix: React.FC<VenueSongMatrixProps> = ({ 
  shows, 
  songIdMap = {}, 
  yearIdMap = {},
  hideTitle = false,
  className = ""
}) => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadItem[]>([]);
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
        prepareSongSpreadData(matrixData, categoryMap);
        
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
  
  // Function to prepare song spread data similar to SongsPlayed component
  const prepareSongSpreadData = (
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
    
    // Convert to sorted array for the spread chart
    const spreadData = Object.keys(categoryTotalPerformances).map(category => ({
      category,
      count: categoryTotalPerformances[category],
      canonid: categoryCanonIds[category] || 9999,
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
      return '#1a212e'; // Dark navy color
    }
    
    return colorMap[placement] || '#1C4482'; // Default to navy if no specific color
  };

  if (isLoading) {
    return (
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Songs Played</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-[#fce7ca]/70">Loading songs played...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Songs Played</h2>
        <div className="text-center py-6 text-red-400">{errorMessage}</div>
      </div>
    );
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Songs Played</h2>
        <div className="text-center py-6 text-[#fce7ca]/70">No song data available for this venue</div>
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
    <div className={`${!hideTitle ? "bg-[#172330] border border-white/10 rounded-lg p-4" : ""} ${className}`}>
      {!hideTitle && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-white/90">
            {songMatrix.songs.length} Songs Played
          </h2>
          <button 
            onClick={() => setIsSpreadModalOpen(true)} 
            className="text-[#fce7ca] hover:text-white transition-colors"
            aria-label="Show song spread"
          >
            <ChartBarDecreasing size={20} />
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
        <table className="w-full border-collapse min-w-max">
          <thead>
            {/* Year headers row */}
            <tr className="bg-[#0e151b]" style={{ borderBottom: '1px solid #272d31' }}>
              {/* Song cell that spans both rows */}
              <th 
                className="px-2 py-1 text-left text-xs font-semibold text-white/90"
                rowSpan={2}
                style={{ 
                  verticalAlign: 'bottom',
                  borderRight: '1px solid #272d31',
                  borderTop: '1px solid #272d31',
                  borderLeft: '1px solid #272d31'
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
                    className="px-1 py-1 text-center text-xs font-semibold bg-[#0e151b]"
                    style={{
                      borderRight: '1px solid #272d31',
                      borderTop: '1px solid #272d31'
                    }}
                  >
                    <button 
                      onClick={() => {
                        const yearId = yearIdMap[group.year];
                        if (yearId) {
                          navigate(`/years/${yearId}`);
                        }
                      }}
                      className="hover:text-white hover:underline text-[#fce7ca]/90 transition-colors"
                    >
                      {group.year}
                    </button>
                  </th>
                );
              })}
            </tr>
            
            {/* Date headers row */}
            <tr className="bg-[#0e151b]" style={{ borderTop: '1px solid #272d31', borderBottom: '1px solid #272d31' }}>
              {songMatrix.showDates.map((date, index) => {
                // Find the corresponding show from the shows array
                const showId = shows[index]?.show_id || "";
                
                return (
                  <th 
                    key={index} 
                    className="px-1 py-1 text-center text-xs font-semibold text-white/90 whitespace-nowrap" 
                    style={{ 
                      width: 'min-content',
                      borderRight: '1px solid #272d31'
                    }}
                  >
                    <button 
                      onClick={() => navigate(`/setlist/${showId}`)}
                      className="hover:text-white hover:underline text-[#fce7ca]/90 transition-colors"
                    >
                      {date}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: '#272d31' }}>
            {songMatrix.songs.map((song) => {
              const performances = songMatrix.data[song] || [];
              
              return (
                <tr 
                  key={song} 
                  className="bg-[#0e151b]"
                  style={{ borderBottom: '1px solid #272d31' }}
                >
                  <td 
                    className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap font-semibold text-xs"
                    style={{
                      borderRight: '1px solid #272d31',
                      borderLeft: '1px solid #272d31'
                    }}
                  >
                    <button 
                      onClick={() => {
                        const songId = songIdMap[song];
                        if (songId) {
                          navigate(`/song/${songId}`);
                        }
                      }}
                      className="hover:text-white hover:underline transition-colors cursor-pointer"
                    >
                      {song}
                    </button>
                  </td>
                  
                  {shows.map((show) => {
                    const performance = performances.find(p => p.showId === show.show_id);
                    const bgColor = performance ? getColumnBackgroundColor(performance.placement) : '';
                    
                    return (
                      <td 
                        key={`${song}-${show.show_id}`} 
                        className="text-center border"
                        style={{ backgroundColor: bgColor, borderColor: '#272d31' }}
                      >
                        {performance && (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
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
        title="Song Category Spread"
      >
        <div className="space-y-1.5 max-h-[80vh] overflow-y-auto p-1">
          {songSpreadData.map(({ category, count, songs }) => (
            <div key={category}>
              <div className="text-[#ffffff]/90 text-sm font-semibold">
                {category}
              </div>
              <div className="h-5 rounded overflow-hidden">
                <div 
                  className="h-full bg-[#594e5f] rounded relative"
                  style={{ 
                    width: `${(count / maxCount) * 100}%`,
                    minWidth: count < 10 ? '24px' : count < 100 ? '32px' : count < 1000 ? '40px' : '48px'
                  }}
                >
                  <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                    <span className="text-[#fce7ca] text-sm font-semibold">{count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default VenueSongMatrix;