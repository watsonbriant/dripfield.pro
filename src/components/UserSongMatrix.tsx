import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { ArrowDownUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CompactModal } from './CompactModal';
import { SongSpreadModal } from './SongSpreadModal';
import { useUserShows } from '../hooks/useUserShows';
import { useUserSongMatrix } from '../hooks/useUserSongMatrix';
import { 
  formatShowDate, 
  groupShowsByYear, 
  getLoadingMessage,
  getTitle,
  getNoShowsMessage,
  getNoSongDataMessage,
  getErrorMessage
} from '../utils/userSongMatrixUtils';
import { getColumnBackgroundColor } from '../utils/songMatrixUtils';

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
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">{getLoadingMessage(!!isOwnProfile, username)}</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
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
        <div className="text-center py-6 text-fifth">
          {getNoShowsMessage(!!isOwnProfile, username)}
        </div>
      </div>
    );
  }

  if (noSongData) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="text-center py-6 text-fifth">{getNoSongDataMessage(!!isOwnProfile, username)}</div>
      </div>
    );
  }
  
  return (
    <div className={`${!hideTitle ? "bg-primary border border-fourth shadow-xl" : ""} ${className}`}>
      {!hideTitle && (
        <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
          <h2 className="text-sm font-semibold">
            {getTitle(songMatrix.songs.length, !!isOwnProfile, username)}
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Matrix Sort Toggle */}
            <>
              {/* Desktop version - hidden on mobile */}
              <div className="hidden md:flex items-center bg-canvas rounded-md border border-fourth py-0.5 px-1">
                <span className="text-fifth text-[0.625rem] ml-1 mr-2 font-medium">Sort:</span>
                <div className="flex gap-1 font-light">
                  <button 
                    onClick={() => setMatrixSortMode('alphabetical')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'alphabetical' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    A-Z
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('chronological')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'chronological' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    Chronological
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('playcount')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'playcount' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    Most Played
                  </button>
                </div>
              </div>
              
              {/* Mobile version - only visible on mobile */}
              <button 
                onClick={() => setIsSortModalOpen(true)}
                className="md:hidden flex items-center justify-center bg-fourth rounded border border-fourth p-0.5"
                aria-label="Sort options"
              >
                <ArrowDownUp className="w-4 h-4 text-white" />
              </button>
            </>
            
            {/* Chart button */}
            <button 
              onClick={() => setIsSpreadModalOpen(true)} 
              className="text-fourth hover:text-white transition-colors"
              aria-label="Show song spread"
            >
              <ChartBarDecreasing size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
        <table className="w-full border-collapse min-w-max">
          <thead>
            {/* Year headers row */}
            <tr className="bg-canvas">
              {/* Song cell that spans both rows */}
              <th 
                className="px-2 py-1 text-left text-xs font-medium text-fifth border"
                rowSpan={2}
                style={{ 
                  verticalAlign: 'bottom',
                  borderColor: 'rgb(180, 178, 178)'
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
                    className="px-1 py-1 text-center text-xs font-semibold bg-canvas border"
                    style={{
                      borderColor: 'rgb(180, 178, 178)'
                    }}
                  >
                    {yearIdMap[group.year] ? (
                      <Link 
                        to={`/years/${yearIdMap[group.year]}`}
                        className="hover:underline transition-colors"
                      >
                        {group.year}
                      </Link>
                    ) : (
                      <span>{group.year}</span>
                    )}
                  </th>
                );
              })}
            </tr>
            
            {/* Date headers row */}
            <tr className="bg-canvas">
              {shows.map((show, index) => {
                const showId = show.show_id;
                
                return (
                  <th 
                    key={index} 
                    className="px-1 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border" 
                    style={{ 
                      width: 'min-content',
                      borderColor: 'rgb(180, 178, 178)'
                    }}
                  >
                    <Link 
                      to={`/setlist/${showId}`}
                      className="hover:underline transition-colors"
                    >
                      {formatShowDate(show.show_date)}
                    </Link>
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
                className={`${songIndex % 2 === 0 ? 'bg-primary' : 'bg-primary'} hover:bg-tertiary/40`}
              >
                <td className="font-medium text-fifth text-[0.625rem] px-2 whitespace-nowrap border"
                    style={{ borderColor: 'rgb(180, 178, 178)' }}>
                  {songIdMap[song] ? (
                    <Link 
                      to={`/song/${songIdMap[song]}`}
                      className="hover:underline transition-colors cursor-pointer"
                    >
                      {song}
                    </Link>
                  ) : (
                    <span>{song}</span>
                  )}
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
      
      {/* Sort Modal for Mobile */}
      <CompactModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Songs By"
      >
        <div className="flex flex-col w-full">
          <button 
            onClick={() => {
              setMatrixSortMode('alphabetical');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'alphabetical' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            A-Z
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('chronological');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'chronological' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            Chronological
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('playcount');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'playcount' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            Most Played
          </button>
        </div>
      </CompactModal>
      
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