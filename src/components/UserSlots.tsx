import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MoveRight } from 'lucide-react';

interface SongEntryWithId {
  song: string;
  setnum: number;
  song_id?: string;
}

interface SlotData {
  show_id: string;
  Show_Date: string;
  Set_1_Opener: SongEntryWithId[] | null;
  Set_1_Closer: SongEntryWithId[] | null;
  Set_2_Opener: SongEntryWithId[] | null;
  Set_2_Closer: SongEntryWithId[] | null;
  Set_3_Opener: SongEntryWithId[] | null;
  Set_3_Closer: SongEntryWithId[] | null;
  Set_4_Opener: SongEntryWithId[] | null;
  Set_4_Closer: SongEntryWithId[] | null;
  Set_5_Opener: SongEntryWithId[] | null;
  Set_5_Closer: SongEntryWithId[] | null;
  Encore_1: SongEntryWithId[] | null;
  Encore_2: SongEntryWithId[] | null;
  Encore_3: SongEntryWithId[] | null;
  [key: string]: string | SongEntryWithId[] | null;
}

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
          stroke="#3c3545" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#fce7ca" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-[#fce7ca]">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface UserSlotsProps {
  userId?: string;
}

const UserSlots: React.FC<UserSlotsProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [songIdMap, setSongIdMap] = useState<{ [songName: string]: string }>({});
  const [hasSlotEntries, setHasSlotEntries] = useState(false);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
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

  // Fetch attended shows for current user
  useEffect(() => {
    if (!effectiveUserId) {
      setAttendedShowIds([]);
      setIsLoading(false);
      return;
    }

    const fetchAttendedShows = async () => {
      try {
        setLoadingProgress(5);
        
        // Get user's attended shows with pagination
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          console.log(`Fetching page ${page} of user attended shows for slots...`);
          
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
        
        console.log(`Fetched a total of ${allAttendedShows.length} attended shows across ${page} pages for slots`);
        setLoadingProgress(25);
        
        const showIds = allAttendedShows.map(item => item.show_id);
        setAttendedShowIds(showIds);
        
        // If there are attended shows, fetch the slots data
        if (showIds.length > 0) {
          fetchSlotsData(showIds);
        } else {
          setLoadingProgress(100);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setAttendedShowIds([]);
        setLoadingProgress(100);
        setIsLoading(false);
      }
    };
    
    fetchAttendedShows();
  }, [effectiveUserId]);

  // Fetch song IDs
  useEffect(() => {
    const fetchSongIds = async () => {
      try {
        setLoadingProgress(prev => Math.max(prev, 25));
        
        // Fetch song IDs with pagination
        let allSongData = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          console.log(`Fetching page ${page} of song IDs for slots...`);
          
          const { data, error } = await supabase
            .from('songs')
            .select('song, song_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSongData = [...allSongData, ...data];
            page++;
            
            // Update progress based on pagination (25-40%)
            const currentProgress = Math.min(40, 25 + (page * 1));
            setLoadingProgress(prev => Math.max(prev, currentProgress));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Fetched a total of ${allSongData.length} song IDs across ${page} pages`);
        
        const songMap: { [songName: string]: string } = {};
        allSongData?.forEach(songData => {
          songMap[songData.song] = songData.song_id;
        });
        
        setSongIdMap(songMap);
        setLoadingProgress(prev => Math.max(prev, 40));
      } catch (error) {
        console.error('Error fetching song IDs:', error);
        setLoadingProgress(prev => Math.max(prev, 40));
      }
    };
    
    fetchSongIds();
  }, []);

  const fetchSlotsData = async (showIds: string[]) => {
    if (!showIds.length) {
      setLoadingProgress(100);
      setIsLoading(false);
      return;
    }

    try {
      setLoadingProgress(40);
      
      // Fetch placements
      const { data: placementsData, error: placementsError } = await supabase
        .from('placements')
        .select('placements, placement_order')
        .order('placement_order');
        
      if (placementsError) throw placementsError;
      
      setLoadingProgress(50);
      
      // Split showIds into chunks for batch processing
      const showIdChunks = [];
      const chunkSize = 200; // Supabase has limits on IN clause size
      
      for (let i = 0; i < showIds.length; i += chunkSize) {
        showIdChunks.push(showIds.slice(i, i + chunkSize));
      }
      
      console.log(`Split ${showIds.length} show IDs into ${showIdChunks.length} chunks for slots data`);
      
      // Get slots data for all attended shows with pagination and chunking
      let allSlotsData = [];
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        console.log(`Processing chunk ${i+1}/${showIdChunks.length} for slots data...`);
        
        while (hasMore) {
          console.log(`Fetching page ${page} of slots data for chunk ${i+1}/${showIdChunks.length}...`);
          
          const { data, error } = await supabase
            .from('shows')
            .select(`
              show_id,
              show_date,
              show_canonid,
              setlist_entries (
                entry_placement,
                entry_song,
                entry_setnum
              )
            `)
            .in('show_id', currentChunk)
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order('show_date', { ascending: true })
            .order('show_canonid', { ascending: true, nullsFirst: true });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSlotsData = [...allSlotsData, ...data];
            page++;
            
            // Update progress based on pagination and chunks (50-90%)
            const progressPerChunk = 40 / showIdChunks.length;
            const chunkProgress = (i / showIdChunks.length) * 40;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            setLoadingProgress(Math.min(90, 50 + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      console.log(`Fetched a total of ${allSlotsData.length} shows with setlist entries across all chunks`);
      
      // Process slots data
      setLoadingProgress(95);
      
      const transformedData = allSlotsData?.map(show => {
        const slots: any = {
          show_id: show.show_id,
          Show_Date: show.show_date
        };

        // Group entries by placement
        const placementEntries: { [key: string]: Array<SongEntryWithId> } = {};
        
        show.setlist_entries?.forEach(entry => {
          // Skip main set entries
          if (entry.entry_placement.startsWith('Main Set')) {
            return;
          }
          
          const key = entry.entry_placement.replace(/\s+/g, '_');
          if (!placementEntries[key]) {
            placementEntries[key] = [];
          }
          placementEntries[key].push({
            song: entry.entry_song,
            setnum: entry.entry_setnum
          });
        });

        // Add entries to slots
        Object.entries(placementEntries).forEach(([key, entries]) => {
          // Sort entries by setnum
          entries.sort((a, b) => a.setnum - b.setnum);
          slots[key] = entries;
        });

        return slots;
      });

      // Find active columns and order them according to placement_order
      const columnsWithData = new Set<string>();
      transformedData?.forEach(show => {
        Object.entries(show).forEach(([key, value]) => {
          if (value && key !== 'show_id' && key !== 'Show_Date') {
            columnsWithData.add(key);
          }
        });
      });

      // Order the columns based on placement_order
      const orderedColumns = placementsData
        ?.filter(p => Array.from(columnsWithData).includes(p.placements.replace(/\s+/g, '_')))
        .map(p => p.placements.replace(/\s+/g, '_'));

      const hasEntries = (transformedData || []).some(show => 
        Object.keys(show).some(key => 
          key !== 'show_id' && 
          key !== 'Show_Date' && 
          show[key] !== null
        )
      );
      
      // Update state
      setSlots(transformedData || []);
      setHasSlotEntries(hasEntries);
      setActiveColumns(orderedColumns || []);
      setLoadingProgress(100);
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching slots data:', error);
      setLoadingProgress(100);
      setIsLoading(false);
    }
  };

  const getColumnBackgroundColor = (column: string): string => {
    const colorMap: { [key: string]: string } = {
      'Set_1_Opener': '#006400',
      'Set_1_Closer': '#995905',
      'Set_2_Opener': '#019B7A',
      'Set_3_Opener': '#019B7A',
      'Set_4_Opener': '#019B7A',
      'Set_5_Opener': '#019B7A',
      'Set_2_Closer': '#E17401',
      'Set_3_Closer': '#E17401',
      'Set_4_Closer': '#E17401',
      'Set_5_Closer': '#E17401',
      'Encore_1': '#7C2128',
      'Encore_2': '#CE1126',
      'Encore_3': '#AF1E2D'
    };
    return colorMap[column] || '';
  };

  const renderSongList = (songs: SongEntryWithId[] | null) => {
    if (!songs || songs.length === 0) return null;
    
    return (
      <div 
        className="w-full text-left"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
          whiteSpace: 'normal',
          hyphens: 'none'
        }}
      >
        {songs.map((song, index) => (
          <React.Fragment key={`${song.song}-${index}`}>
            {index > 0 && (
              <MoveRight className="text-red-400 inline w-[1rem] h-[1rem] mx-1" />
            )}
            <a 
              onClick={() => {
                const songId = songIdMap[song.song];
                if (songId) {
                  navigate(`/song/${songId}`);
                }
              }}
              className="font-semibold hover:text-white transition-colors text-[#fce7ca]/90 table-link cursor-pointer inline"
            >
              {song.song}
            </a>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Get loading message based on profile ownership
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading slots data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} slots data...`;
    }
  };

  // Get appropriate title based on profile ownership
  const getTitle = () => {
    if (isOwnProfile) {
      return "My Slots";
    } else if (username) {
      return `Slots`;
    } else {
      return "Slots";
    }
  };

  // Get empty state messages based on profile ownership
  const getNoUserMessage = () => {
    if (isOwnProfile) {
      return "Please log in to view your slots.";
    } else {
      return "User data not available.";
    }
  };

  const getNoShowsMessage = () => {
    if (isOwnProfile) {
      return "You haven't marked any shows as attended yet.";
    } else if (username) {
      return `${username} hasn't marked any shows as attended yet.`;
    } else {
      return "This user hasn't marked any shows as attended yet.";
    }
  };

  const getNoSlotsMessage = () => {
    if (isOwnProfile) {
      return "No slots data found for your attended shows.";
    } else if (username) {
      return `No slots data found for ${username}'s attended shows.`;
    } else {
      return "No slots data found for this user's attended shows.";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-[#fce7ca]/70 mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  if (!effectiveUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-[#fce7ca]/70">{getNoUserMessage()}</p>
      </div>
    );
  }

  if (attendedShowIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#fce7ca]/70">{getNoShowsMessage()}</p>
      </div>
    );
  }

  if (!hasSlotEntries) {
    return (
      <div className="text-center py-12">
        <p className="text-[#fce7ca]/70">{getNoSlotsMessage()}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          {getTitle()}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th 
                  className="w-[85px] min-w-[85px] px-4 py-1 text-left text-s font-semibold text-white/90">
                  Date
                </th>
                {activeColumns.map(column => (
                  <th 
                    key={column} 
                    className="px-4 py-1 text-left text-s font-semibold text-white/90"
                    style={{ 
                      width: '190px',
                      minWidth: '190px',
                      backgroundColor: getColumnBackgroundColor(column),
                      borderTop: '1px solid #2b333b',
                      borderBottom: '1px solid #2b333b'
                    }}
                  >
                    {column.split('_').map(word => 
                      word === 'Op' ? 'Opener' :
                      word === 'Cl' ? 'Closer' :
                      word
                    ).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slots.map((slot, index) => (
                <tr
                  key={`slot-${slot.show_id}`}
                  className={`${
                    index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                  } hover:bg-white/10 transition-colors text-xs`}
                >
                  <td className="w-[85px] min-w-[85px] px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                    <span className="font-semibold">
                      <button
                        onClick={() => navigate(`/setlist/${slot.show_id}`)}
                        className="hover:text-white transition-colors table-link"
                      >
                        {slot.Show_Date
                          .split('-')
                          .slice(1)
                          .concat(slot.Show_Date.substring(2, 4))
                          .join('.')}
                      </button>
                    </span>
                  </td>
                  {activeColumns.map(column => (
                    <td 
                      key={`${slot.show_id}-${column}`} 
                      className="px-4 py-1 text-[#fce7ca]/90 text-left align-middle"
                      style={{ 
                        width: '190px',
                        minWidth: '190px',
                        maxWidth: '190px',
                        borderTop: '1px solid #1f2830',
                        borderBottom: index === slots.length - 1 ? 'none' : '1px solid #1f2830',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'left'
                      }}
                    >
                      {renderSongList(slot[column] as SongEntryWithId[] | null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserSlots;