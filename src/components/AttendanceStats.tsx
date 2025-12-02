import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Building2, Music } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CircularProgress from './CircularProgress';
import { useAttendanceStats } from '../hooks/useAttendanceStats';
import { getAttendanceTexts } from '../utils/attendanceTexts';

interface AttendanceStatsProps {
  userId?: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Use the custom hook for data fetching
  const { data, loading, loadingProgress } = useAttendanceStats(effectiveUserId);
  
  // Get text helpers
  const texts = getAttendanceTexts(!!isOwnProfile, username);

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

  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <h3 className="text-sm font-semibold bg-tertiary text-fifth px-2 py-0.5">{texts.getTitle()}</h3>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">{texts.getLoadingMessage()}</p>
        </div>
      ) : (
        <div>
          {/* Desktop view - cards */}
          <div className="hidden md:grid grid-cols-3">
            <div className="bg-canvas px-2 py-1 border-r border-fourth">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-fourth" />
                <div className="text-fifth text-xs font-medium">{texts.getShowsLabel()}</div>
                <div className="text-sm font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.showsCount}</div>
              </div>
            </div>
            <div className="bg-canvas px-2 py-1 border-r border-fourth">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-fourth" />
                <div className="text-fifth text-xs font-medium">{texts.getVenuesLabel()}</div>
                <div className="text-sm font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.venuesCount}</div>
              </div>
            </div>
            <div className="bg-canvas px-2 py-1">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-fourth" />
                <div className="text-fifth text-xs font-medium">{texts.getSongsLabel()}</div>
                <div className="text-sm font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.songsCount}</div>
              </div>
            </div>
          </div>
          
          {/* Mobile view - list */}
          <div className="md:hidden">
            <ul className="space-y-1 text-sm my-1 mx-2">
              <li className="flex items-center">
                <Calendar className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth text-xs font-medium mr-2">{texts.getShowsLabel()}</span>
                <span className="text-fifth font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.showsCount}</span>
              </li>
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth text-xs font-medium mr-2">{texts.getVenuesLabel()}</span>
                <span className="text-fifth font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.venuesCount}</span>
              </li>
              <li className="flex items-center">
                <Music className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth text-xs font-medium mr-2">{texts.getSongsLabel()}</span>
                <span className="text-fifth font-medium text-white bg-fourth px-1.5 py-[1px] rounded-md">{data.songsCount}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold bg-tertiary text-fifth px-2 py-0.5">{texts.getToursLabel()}</h3>
            <div className="space-y-1">
              {data.tourCounts.length === 0 ? (
                <p className="text-fifth/60 italic">{texts.getNoToursMessage()}</p>
              ) : (
                <ul className="space-y-0.5 text-xs mx-2 my-1">
                  {data.tourCounts.map((tour) => (
                    <li 
                      key={tour.tour}
                      className="text-left"
                    >
                      <Link 
                        to={`/tours/${tour.tour_id}`}
                        className="text-fifth hover:text-fourth hover:underline font-medium"
                      >
                        {tour.tour}
                      </Link>
                      <span className="text-fifth/90 ml-2 text-[0.625rem] font-light">({tour.count})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStats;