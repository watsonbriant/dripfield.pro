import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CircularProgress from './CircularProgress';
import StatBox from './StatBox';
import { useUserStats } from '../hooks/useUserStats';
import { StatData, UserStatsProps } from '../types/userStats';
import { getLoadingMessage } from '../utils/userStatsUtils';

const UserStats: React.FC<UserStatsProps> = ({ userId, showCopyButton = true }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Use the custom hook for data fetching
  const {
    loading,
    loadingProgress,
    topSongs,
    longestPerformances,
    showOpeners,
    setOpeners,
    setClosers,
    encoreSongs,
    notSeenSongs,
    loadingTop,
    loadingLongest,
    loadingShowOpeners,
    loadingSetOpeners,
    loadingSetClosers,
    loadingEncores,
    loadingNotSeen
  } = useUserStats(effectiveUserId);

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

  // Mobile order mapping (for 1 column layout)
  const mobileOrderMap: { [key: string]: number } = {
    'topSongs': 1,
    'longestPerformances': 2,
    'showOpeners': 3,
    'setOpeners': 4,
    'setClosers': 5,
    'encoreSongs': 6,
    'notSeenSongs': 7
  };

  // Create stats data array in the desired desktop order
  const statData: StatData[] = [
    {
      type: 'topSongs',
      title: 'Most Seen Songs',
      data: topSongs,
      loading: loadingTop
    },
    {
      type: 'showOpeners',
      title: 'Most Seen Show Openers',
      data: showOpeners,
      loading: loadingShowOpeners,
      countKey: 'times_played',
      songNameKey: 'song_name'
    },
    {
      type: 'setOpeners',
      title: 'Most Seen Set Openers',
      data: setOpeners,
      loading: loadingSetOpeners,
      countKey: 'times_played',
      songNameKey: 'song_name'
    },
    {
      type: 'longestPerformances',
      title: 'Longest Song Performances',
      data: longestPerformances,
      loading: loadingLongest,
      countKey: 'length_seconds',
      showDate: true,
      showLength: true
    },
    {
      type: 'setClosers',
      title: 'Most Seen Set Closers',
      data: setClosers,
      loading: loadingSetClosers,
      countKey: 'times_played',
      songNameKey: 'song_name'
    },
    {
      type: 'encoreSongs',
      title: 'Most Seen in the Encore',
      data: encoreSongs,
      loading: loadingEncores,
      countKey: 'times_played',
      songNameKey: 'song_name'
    },
    {
      type: 'notSeenSongs',
      title: 'Most Common Not Seen',
      data: notSeenSongs,
      loading: loadingNotSeen
    }
  ];

  if (loading) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">{getLoadingMessage(!!isOwnProfile, username || null)}</p>
        </div>
      </div>
    );
  }
  
  // If no user ID found, show an appropriate message
  if (!effectiveUserId) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="text-center py-6">
          <p className="text-fifth">No user data available.</p>
        </div>
      </div>
    );
  }
  
  // Check if we have any data to display
  const hasNoData = topSongs.length === 0 && 
    longestPerformances.length === 0 &&
    showOpeners.length === 0 &&
    setOpeners.length === 0 &&
    setClosers.length === 0 &&
    encoreSongs.length === 0 &&
    notSeenSongs.length === 0;
  
  if (hasNoData) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="text-center py-6">
          <p className="text-fifth">
            {isOwnProfile 
              ? "No stats available. Start adding shows you've attended!" 
              : `${username ? username : "This user"} hasn't added any attended shows yet.`}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <style>{`
        @media (min-width: 1024px) {
          .stat-box-item {
            order: unset !important;
          }
        }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto grid-flow-row">
        {statData.map((stat, index) => (
          <div 
            key={`stat-${index}`} 
            className="w-full h-auto stat-box-item"
            style={{
              order: mobileOrderMap[stat.type] || index + 1
            }}
          >
            <StatBox
              title={stat.title}
              data={stat.data}
              loading={stat.loading}
              countKey={stat.countKey}
              showDate={stat.showDate}
              showLength={stat.showLength}
              songNameKey={stat.songNameKey}
              songIdKey={stat.songIdKey}
              type={stat.type}
              showCopyButton={showCopyButton}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;