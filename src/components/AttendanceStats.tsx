import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Building2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="bg-primary p-3 rounded-lg border border-fourth">
      <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2">{texts.getTitle()}</h3>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">{texts.getLoadingMessage()}</p>
        </div>
      ) : (
        <div className="md:space-y-2">
          {/* Desktop view - cards */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            <div className="bg-canvas p-3 rounded-md relative border border-fourth">
              <div className="text-fifth text-sm font-medium">{texts.getShowsLabel()}</div>
              <div className="text-2xl font-semibold text-fifth mt-1">{data.showsCount}</div>
              <Calendar className="h-5 w-5 text-fourth absolute bottom-2 right-2" />
            </div>
            <div className="bg-canvas p-3 rounded-md relative border border-fourth">
              <div className="text-fifth text-sm font-medium">{texts.getVenuesLabel()}</div>
              <div className="text-2xl font-semibold text-fifth mt-1">{data.venuesCount}</div>
              <Building2 className="h-5 w-5 text-fourth absolute bottom-2 right-2" />
            </div>
            <div className="bg-canvas p-3 rounded-md relative border border-fourth">
              <div className="text-fifth text-sm font-medium">{texts.getSongsLabel()}</div>
              <div className="text-2xl font-semibold text-fifth mt-1">{data.songsCount}</div>
              <Music className="h-5 w-5 text-fourth absolute bottom-2 right-2" />
            </div>
          </div>
          
          {/* Mobile view - list */}
          <div className="md:hidden">
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center">
                <Calendar className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth font-semibold">{data.showsCount}</span>
                <span className="text-fifth font-light ml-2">{texts.getShowsLabel()}</span>
              </li>
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth font-semibold">{data.venuesCount}</span>
                <span className="text-fifth font-light ml-2">{texts.getVenuesLabel()}</span>
              </li>
              <li className="flex items-center">
                <Music className="h-4 w-4 text-fourth mr-2" />
                <span className="text-fifth font-semibold">{data.songsCount}</span>
                <span className="text-fifth font-light ml-2">{texts.getSongsLabel()}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2 mt-2">{texts.getToursLabel()}</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {data.tourCounts.length === 0 ? (
                <p className="text-fifth/60 italic">{texts.getNoToursMessage()}</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {data.tourCounts.map((tour) => (
                    <li 
                      key={tour.tour}
                      className="text-left"
                    >
                      <button 
                        onClick={() => navigate(`/tours/${tour.tour_id}`)}
                        className="text-fifth hover:text-fourth hover:underline font-medium"
                      >
                        {tour.tour}
                      </button>
                      <span className="text-fifth/90 ml-2 font-light">({tour.count})</span>
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