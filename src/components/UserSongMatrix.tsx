import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { useAuth } from '../context/AuthContext';
import { SortControls } from './SortControls';
import { SongSpreadModal } from './SongSpreadModal';
import { useUserShows } from '../hooks/useUserShows';
import { useUserSongMatrix } from '../hooks/useUserSongMatrix';
import { 
  formatShowDate, 
  groupShowsByYear, 
  getMatrixColumnBackgroundColor,
  getLoadingMessage,
  getTitle,
  getNoShowsMessage,
  getNoSongDataMessage,
  getErrorMessage
} from '../utils/userSongMatrixUtils';

// Define matrix sort mode type (same as in TourSongsCombined)
export type MatrixSortMode = 'alphabetical' | 'chronological' | 'playcount';

interface UserSongMatrixProps {
  userId?: string;
  songIdMap?: { [songName: string]: string };
  yearIdMap?: { [year: string]: string };
  hideTitle?: boolean;
  className?: string;
}

const UserSongMatrix: React.FC<UserSongMatrixProps> = ({ 
  userId,
  songIdMap = {}, 
  yearIdMap = {},
  hideTitle = false,
  className = ""
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>('alphabetical');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Use custom hooks for data fetching
  const { shows, isLoading: showsLoading, errorMessage: showsError } = useUserShows(effectiveUserId);
  const { 
    songMatrix, 
    sortedSongs, 
    isLoading: matrixLoading, 
    errorMessage: matrixError,
    songSpreadData 
  } = useUserSongMatrix(shows, matrixSortMode);

  const isLoading = showsLoading || matrixLoading;
  const errorMessage = showsError || matrixError;

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

  // Group shows by year
  const yearGroups = groupShowsByYear(shows);

  if (isLoading) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-fourth">Song Matrix</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">{getLoadingMessage(!!isOwnProfile, username)}</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-fourth">{getTitle(songMatrix.songs.length, !!isOwnProfile, username)}</h2>
        <div className="text-center py-6 text-red-500">{getErrorMessage(errorMessage, !!isOwnProfile, username)}</div>
      </div>
    );
  }

  // We'll only check these conditions once loading is fully complete
  // This prevents the flash of "no data" messages during loading
  const noShows = !isLoading && shows.length === 0;
  const noSongData = !isLoading && shows.length > 0 && songMatrix.songs.length === 0;

  if (noShows) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-fourth">{isOwnProfile ? "Your Song Matrix" : `${username ? username + "'s" : "Their"} Song Matrix`}</h2>
        <div className="text-center py-6 text-fifth">
          {getNoShowsMessage(!!isOwnProfile, username)}
        </div>
      </div>
    );
  }

  if (noSongData) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-fourth">{isOwnProfile ? "Your Song Matrix" : `${username ? username + "'s" : "Their"} Song Matrix`}</h2>
        <div className="text-center py-6 text-fifth">{getNoSongDataMessage(!!isOwnProfile, username)}</div>
      </div>
    );
  }
  
  return (
    <div className={`${!hideTitle ? "bg-primary border border-fourth rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-fourth">
            {getTitle(songMatrix.songs.length, !!isOwnProfile, username)}
          </h2>
          <div className="flex items-center gap-3">
            <SortControls
              matrixSortMode={matrixSortMode}
              setMatrixSortMode={setMatrixSortMode}
              isSortModalOpen={isSortModalOpen}
              setIsSortModalOpen={setIsSortModalOpen}
            />
            
            {/* Chart button */}
            <button 
              onClick={() => setIsSpreadModalOpen(true)} 
              className="text-fourth hover:text-tertiary transition-colors"
              aria-label="Show song spread"
            >
              <ChartBarDecreasing size={20} />
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
        <table className="w-full border-collapse min-w-max">
          <thead>
            {/* Year headers row */}
            <tr className="bg-canvas border-y border-[#b4b2b2]">
              {/* Song cell that spans both rows */}
              <th 
                className="px-2 py-1 text-left text-xs font-medium text-fifth border-l border-r border-fourth"
                rowSpan={2}
                style={{ 
                  verticalAlign: 'bottom'
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
                    className="px-1 py-1 text-center text-xs font-semibold bg-canvas"
                    style={{
                      borderRight: '1px solid #b4b2b2',
                      borderTop: '1px solid #b4b2b2'
                    }}
                  >
                    <button 
                      onClick={() => {
                        const yearId = yearIdMap[group.year];
                        if (yearId) {
                          navigate(`/years/${yearId}`);
                        }
                      }}
                      className="hover:underline transition-colors"
                    >
                      {group.year}
                    </button>
                  </th>
                );
              })}
            </tr>
            
            {/* Date headers row */}
            <tr className="bg-canvas border-y border-[#b4b2b2]">
              {shows.map((show, index) => {
                const showId = show.show_id;
                
                return (
                  <th 
                    key={index} 
                    className="px-1 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border-l border-r border-fourth" 
                    style={{ 
                      width: 'min-content'
                    }}
                  >
                    <button 
                      onClick={() => navigate(`/setlist/${showId}`)}
                      className="hover:text-[#a9682e] hover:underline transition-colors"
                    >
                      {formatShowDate(show.show_date)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b4b2b2]">
          {sortedSongs.map((song) => {
            const performances = songMatrix.data[song] || [];
            const songIndex = sortedSongs.indexOf(song);
            
            return (
              <tr 
                key={song} 
                className={songIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'}
              >
                <td className="font-medium text-fifth text-xs pl-2 whitespace-nowrap border"
                    style={{ borderColor: 'rgb(180, 178, 178)' }}>
                  <button 
                    onClick={() => {
                      const songId = songIdMap[song];
                      if (songId) {
                        navigate(`/song/${songId}`);
                      }
                    }}
                    className="hover:underline transition-colors cursor-pointer"
                  >
                    {song}
                  </button>
                </td>
                
                {shows.map((show) => {
                  const performance = performances.find(p => p.showId === show.show_id);
                  const bgColor = performance ? getMatrixColumnBackgroundColor(performance.placement) : '';
                  
                  return (
                    <td 
                      key={`${song}-${show.show_id}`} 
                      className="text-center border"
                      style={{ backgroundColor: bgColor, borderColor: 'rgb(180, 178, 178)' }}
                    >
                      {performance && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
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
      <SongSpreadModal
        isOpen={isSpreadModalOpen}
        onClose={() => setIsSpreadModalOpen(false)}
        songSpreadData={songSpreadData}
        maxWidth="1050px"
      />
    </div>
  );
};

export default UserSongMatrix;