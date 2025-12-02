import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { TicketPlus } from 'lucide-react';
import AttendShowManager from './AttendShowManager';
import { CircularProgress } from './ui/CircularProgress';
import { getRarityColor, getGapColor, formatShowLength } from './lists/shared/ColorUtils';
import { fetchAttendedShows, type AttendedShow } from '../utils/showUtils';

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
    const loadAttendedShows = async () => {
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        const shows = await fetchAttendedShows(effectiveUserId, setLoadingProgress);
        setAttendedShows(shows);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };

    loadAttendedShows();
  }, [effectiveUserId, isManageMode]);

  if (!effectiveUserId) {
    return (
      <div className="bg-primary border border-fourth shadow-xl">
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
      <div className="bg-primary border border-fourth shadow-xl">
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
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="relative bg-tertiary px-2 py-0.5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-fifth">Shows Attended</h3>
          
          {/* Only show manage button for user's own profile and if not readOnly */}
          {isOwnProfile && !readOnly && (
            <button
              onClick={() => {
                setIsManageMode(true);
                if (onManagingToggle) {
                  onManagingToggle(true);
                }
              }}
              className="relative z-10 flex items-center gap-2 bg-fourth hover:bg-fourth/70 rounded text-white px-2 py-0.5 text-[0.625rem] font-semibold transition-colors border border-fourth"
            >
              <span className="hidden md:inline font-semibold">Manage Shows</span>
              <TicketPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {attendedShows.length === 0 ? (
        <p className="text-fifth">{getEmptyMessage()}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                <th className="px-2 text-center text-sm font-medium text-fifth">#</th>
                <th className="px-2 text-center text-sm font-medium text-fifth">Date</th>
                <th className="px-2 text-left text-sm font-medium text-fifth">Group</th>
                <th className="px-2 text-left text-sm font-medium text-fifth">Tour</th>
                <th className="px-2 text-center text-sm font-medium text-fifth">Length</th>
                <th className="px-2 text-center text-sm font-medium text-fifth">Rarity</th>
                <th className="px-2 text-center text-sm font-medium text-fifth">Gap</th>
                <th className="px-2 text-left text-sm font-medium text-fifth">Venue</th>
                <th className="px-2 text-left text-sm font-medium text-fifth">Location</th>
                <th className="px-2 text-left text-sm font-medium text-fifth">Detail</th>
              </tr>
            </thead>
            <tbody>
              {attendedShows.map((attendedShow, index) => (
                <tr
                  key={attendedShow.id}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                  } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                >
                  <td className="px-2 text-white font-medium text-center whitespace-nowrap" style={{ 
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
                  <td className="px-2 text-center whitespace-nowrap">
                    <Link
                      to={`/setlist/${attendedShow.show_id}`}
                      className="font-medium hover:underline transition-colors table-link text-fifth"
                    >
                      {attendedShow.show?.show_date && formatInTimeZone(
                        new Date(attendedShow.show.show_date),
                        'UTC',
                        'MM.dd.yy'
                      )}
                    </Link>
                  </td>
                  <td className="px-2 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_group}
                  </td>
                  <td className="px-2 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_tour && (
                      attendedShow.show?.tours?.tour_id ? (
                        <Link
                          to={`/tours/${attendedShow.show.tours.tour_id}`}
                          className="hover:underline transition-colors"
                        >
                          {attendedShow.show.show_tour}
                        </Link>
                      ) : (
                        <span>{attendedShow.show.show_tour}</span>
                      )
                    )}
                  </td>
                  <td className="px-2 font-light text-center whitespace-nowrap">
                    <span className="text-fifth">
                      {formatShowLength(attendedShow.show?.show_length ?? null)}
                    </span>
                  </td>
                  <td className="px-2 text-center whitespace-nowrap">
                    {attendedShow.show?.show_rarity ? (
                      <span 
                        className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
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
                  <td className="px-2 text-center whitespace-nowrap">
                    {attendedShow.show?.show_gap ? (
                      <span 
                        className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
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
                  <td className="px-2 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_subvenue_venue ? (
                      <Link
                        to={`/venue/${encodeURIComponent(attendedShow.show.show_subvenue_venue)}`}
                        className="hover:underline transition-colors"
                      >
                        {attendedShow.show?.show_subvenue}
                      </Link>
                    ) : (
                      <span>{attendedShow.show?.show_subvenue}</span>
                    )}
                  </td>
                  <td className="px-2 font-light text-fifth whitespace-nowrap">
                    {attendedShow.show?.show_venue_location}
                  </td>
                  <td className="px-2 font-light text-fifth whitespace-nowrap">
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