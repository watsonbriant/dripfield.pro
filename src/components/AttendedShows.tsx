import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TicketPlus, Plus } from 'lucide-react';
import AttendShowManager from './AttendShowManager';

interface AttendedShow {
  id: string;
  user_id: string;
  show_id: string;
  created_at: string;
  show?: {
    show_id: string;
    show_date: string;
    show_group: string;
    show_subvenue: string;
    show_venue_location: string;
    show_subvenue_venue: string;
    show_tour: string | null;
    show_canonid: string | null;
    tours: {
      tour_id: string;
    } | null;
    show_detail: string | null;
    show_alert: string | null;
    show_length?: string | null;
    show_rarity?: string | null;
    show_gap?: string | null;
  };
}

const getRarityColor = (percentage: string | null): string => {
  if (!percentage || percentage === '-') return 'transparent';
  
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },
    { percent: 12, color: { r: 230, g: 81, b: 0 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 46, g: 125, b: 50 } },
    { percent: 100, color: { r: 13, g: 71, b: 161 } }
  ];
  
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

const getGapColor = (value: string | null): string => {
  if (!value || value === '-') return 'transparent';

  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return 'transparent';

  const cappedValue = Math.min(numericValue, 100);

  const colorStops = [
    { percent: 0, color: { r: 13, g: 71, b: 161 } },
    { percent: 12, color: { r: 46, g: 125, b: 50 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 230, g: 81, b: 0 } },
    { percent: 100, color: { r: 156, g: 12, b: 12 } }
  ];

  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (cappedValue >= colorStops[i].percent && cappedValue <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (cappedValue - lowerStop.percent) / range : 0;

  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

  return `rgb(${r}, ${g}, ${b})`;
};

// Helper function to format show length without leading zeros in hours
const formatShowLength = (length: string | null): string => {
  if (!length) return '';
  const parts = length.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    return `${hours}:${parts[1]}:${parts[2]}`;
  }
  return length;
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
          stroke="#8e6c7a" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-fifth">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface AttendedShowsProps {
  userId?: string;
  readOnly?: boolean;
  onManagingToggle?: (isManaging: boolean) => void;
}

const AttendedShows: React.FC<AttendedShowsProps> = ({ 
  userId, 
  readOnly = false,
  onManagingToggle 
}) => {
  const { user } = useAuth();
  const [attendedShows, setAttendedShows] = useState<AttendedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isManageMode, setIsManageMode] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  
  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);
  
  // Notify parent component when manage mode changes
  useEffect(() => {
    if (onManagingToggle) {
      onManagingToggle(isManageMode);
    }
  }, [isManageMode, onManagingToggle]);
  
  const navigate = useNavigate();
  
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
  }, [userId, isOwnProfile]);

  useEffect(() => {
    const fetchAttendedShows = async () => {
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // Get the basic attended show records with pagination
        let allAttendanceData = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('*')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendanceData = [...allAttendanceData, ...data];
            page++;
            
            // Update progress based on pagination (5-25%)
            setLoadingProgress(Math.min(25, 5 + (page * 5)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        // If the user hasn't attended any shows, return early
        if (allAttendanceData.length === 0) {
          setAttendedShows([]);
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        // Extract the show IDs
        const showIds = allAttendanceData.map(show => show.show_id);
        
        setLoadingProgress(30);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        // Fetch the show details for each attended show with pagination and chunking
        let allShowData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('shows')
              .select(`
                show_id,
                show_date,
                show_group,
                show_subvenue,
                show_venue_location,
                show_subvenue_venue,
                show_tour,
                show_canonid,
                show_length,
                show_rarity,
                show_gap,
                tours!show_tour(
                  tour_id
                ),
                show_detail,
                show_alert
              `)
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allShowData = [...allShowData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (30-75%)
              const progressPerChunk = 45 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 45;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(75, 30 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        setLoadingProgress(80);
        
        // Combine the attendance records with the show details and format the values
        const combinedData = allAttendanceData.map(attendedShow => {
          const showDetails = allShowData?.find(show => show.show_id === attendedShow.show_id);
          
          let showWithFormattedValues = { ...showDetails };
          
          if (showDetails) {
            // Format rarity with % symbol if it exists
            const show_rarity = showDetails.show_rarity !== null && showDetails.show_rarity !== undefined
              ? `${showDetails.show_rarity.toFixed(2)}%`
              : null;
            
            // Format gap as string with 2 decimal places if it exists
            const show_gap = showDetails.show_gap !== null && showDetails.show_gap !== undefined
              ? showDetails.show_gap.toFixed(2)
              : null;
            
            showWithFormattedValues = {
              ...showDetails,
              show_rarity,
              show_gap
            };
          }
          
          return {
            ...attendedShow,
            show: showWithFormattedValues
          };
        });
        
        setLoadingProgress(90);
        
        // Sort by date, oldest first
        const sortedShows = combinedData.sort((a, b) => {
          if (!a.show?.show_date || !b.show?.show_date) return 0;
          return new Date(a.show.show_date).getTime() - new Date(b.show.show_date).getTime();
        });
        
        setAttendedShows(sortedShows);
        setLoadingProgress(100);

        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);

      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchAttendedShows();
  }, [effectiveUserId, isManageMode]);

  if (!effectiveUserId) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <p className="text-fifth">Please log in to see attended shows.</p>
      </div>
    );
  }

  if (isManageMode) {
    return <AttendShowManager onClose={() => {
      setIsManageMode(false);
      if (onManagingToggle) {
        onManagingToggle(false);
      }
    }} />;
  }

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">
            {isOwnProfile 
              ? "Loading your attended shows..." 
              : `Loading ${username ? username + "'s" : "their"} attended shows...`}
          </p>
        </div>
      </div>
    );
  }

  // Get the appropriate title based on whose profile we're viewing
  const getTitle = () => {
    if (isOwnProfile) {
      return "Shows You've Attended";
    } else if (username) {
      return `Shows Attended`;
    } else {
      return "Shows Attended";
    }
  };

  // Get the empty state message based on whose profile we're viewing
  const getEmptyMessage = () => {
    if (isOwnProfile) {
      return "You haven't marked any shows as attended yet.";
    } else if (username) {
      return `${username} hasn't marked any shows as attended yet.`;
    } else {
      return "This user hasn't marked any shows as attended yet.";
    }
  };

  return (
    <div className="bg-primary p-3 rounded-lg border border-secondary">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Shows Attended</h3>
        
        {/* Only show manage button for user's own profile and if not readOnly */}
        {isOwnProfile && !readOnly && (
          <button
            onClick={() => {
              setIsManageMode(true);
              if (onManagingToggle) {
                onManagingToggle(true);
              }
            }}
            className="flex items-center gap-2 bg-tertiary hover:bg-tertiary/70 text-fifth px-3 py-1 rounded-lg text-sm font-semibold transition-colors border border-secondary"
          >
            <span className="hidden md:inline font-semibold">Manage Shows</span>
            <TicketPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {attendedShows.length === 0 ? (
        <p className="text-fifth">{getEmptyMessage()}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                <th className="px-2 py-2 text-center text-s font-semibold text-fifth">#</th>
                <th className="px-4 py-2 text-center text-s font-semibold text-fifth">Date</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Group</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Tour</th>
                <th className="px-4 py-2 text-center text-s font-semibold text-fifth">Length</th>
                <th className="px-4 py-2 text-center text-s font-semibold text-fifth">Rarity</th>
                <th className="px-4 py-2 text-center text-s font-semibold text-fifth">Gap</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Venue</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Location</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendedShows.map((attendedShow, index) => (
                <tr
                  key={attendedShow.id}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-2 py-0.5 text-primary font-medium text-center whitespace-nowrap" style={{ 
                    backgroundColor: attendedShow.show?.show_group === 'Goose' && attendedShow.show?.show_canonid ? '#006400' : 'transparent' 
                  }}>
                    {attendedShow.show?.show_group === 'Goose' && attendedShow.show?.show_canonid ? (
                      (() => {
                        // Calculate the number based on shows that meet the criteria
                        const gooseShowsWithCanonid = attendedShows
                          .slice(0, index + 1)
                          .filter(show => show.show?.show_group === 'Goose' && show.show?.show_canonid);
                        return gooseShowsWithCanonid.length;
                      })()
                    ) : ''}
                  </td>
                  <td className="px-4 py-0.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/setlist/${attendedShow.show_id}`)}
                      className="font-medium hover:underline transition-colors table-link text-fifth"
                    >
                      {attendedShow.show?.show_date && formatInTimeZone(
                        new Date(attendedShow.show.show_date),
                        'UTC',
                        'MM.dd.yy'
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_group}
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_tour && (
                      <button
                        onClick={() => {
                          if (attendedShow.show?.tours?.tour_id) {
                            navigate(`/tours/${attendedShow.show.tours.tour_id}`);
                          }
                        }}
                        className="hover:underline transition-colors"
                      >
                        {attendedShow.show.show_tour}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-0.5 font-light text-center whitespace-nowrap">
                    <span className="text-fifth">
                      {formatShowLength(attendedShow.show?.show_length)}
                    </span>
                  </td>
                  <td className="px-4 text-center whitespace-nowrap">
                    {attendedShow.show?.show_rarity ? (
                      <span 
                        className="text-primary font-normal px-2 py-0.5 rounded-md inline-block"
                        style={{ 
                          backgroundColor: getRarityColor(attendedShow.show.show_rarity) 
                        }}
                      >
                        {attendedShow.show.show_rarity}
                      </span>
                    ) : (
                      <span className="text-fifth"></span>
                    )}
                  </td>
                  <td className="px-4 text-center whitespace-nowrap">
                    {attendedShow.show?.show_gap ? (
                      <span 
                        className="text-white font-normal px-2 py-0.5 rounded-md inline-block"
                        style={{ 
                          backgroundColor: getGapColor(attendedShow.show.show_gap) 
                        }}
                      >
                        {attendedShow.show.show_gap}
                      </span>
                    ) : (
                      <span className="text-fifth"></span>
                    )}
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (attendedShow.show?.show_subvenue_venue) {
                          navigate(`/venue/${encodeURIComponent(attendedShow.show.show_subvenue_venue)}`);
                        }
                      }}
                      className="hover:underline transition-colors"
                    >
                      {attendedShow.show?.show_subvenue}
                    </button>
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_venue_location}
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_detail && attendedShow.show.show_detail}
                    {attendedShow.show?.show_detail && attendedShow.show?.show_alert && <>&nbsp;&nbsp;</>}
                    {attendedShow.show?.show_alert && 
                      <span className="text-[#CE1126] font-medium">
                        [{attendedShow.show.show_alert}]
                      </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendedShows;