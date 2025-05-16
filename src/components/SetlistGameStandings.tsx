import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronUp, ChevronDown, Trophy } from 'lucide-react';

interface PlayerStats {
  username: string;
  userId: string;
  totalPoints: number;
  showsPlayed: number;
  avgPointsPerShow: number;
  songsPicked: number;
  setsPicked: number;
  showOpenersPicked: number;
  showClosersPicked: number;
}

interface SetlistGameStandingsProps {
  activeLeague: string;
  user?: { id: string } | null; // Make it optional with user?
}

export function SetlistGameStandings({ activeLeague, user }: SetlistGameStandingsProps) {
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof PlayerStats>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchStandings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Step 1: Get all scored submissions for the active league
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select('show_id')
        .eq('show_tour', activeLeague)
        .eq('show_scored', true)
        .eq('show_issetlistgame', true);
        
      if (showError) {
        console.error('Error fetching shows for standings:', showError.message, showError.details);
        setStandings([]);
        setLoading(false);
        return;
      }
      
      if (!showData || showData.length === 0) {
        setStandings([]);
        setLoading(false);
        return;
      }
      
      const showIds = showData.map(show => show.show_id);
      
      // Step 2: Get all submissions for these shows (now visible to all users with our RLS policy)
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('setlist_game_submissions')
        .select('submission_id, user_id, show_id, score, total_songs_picked, total_songs_played')
        .in('show_id', showIds);
        
      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError.message, submissionsError.details);
        setStandings([]);
        setLoading(false);
        return;
      }
      
      if (!submissionsData || submissionsData.length === 0) {
        setStandings([]);
        setLoading(false);
        return;
      }
      
      // Get unique user IDs from submissions
      const userIds = [...new Set(submissionsData.map(sub => sub.user_id))];
      
      // Fetch profiles separately - also visible to all with RLS
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message, profilesError.details);
        // Continue without usernames if profiles fetch fails - we'll use IDs as fallbacks
      }
      
      // Create mapping of user_id to username
      const usernameMap = profilesData?.reduce((acc, profile) => {
        acc[profile.id] = profile.username;
        return acc;
      }, {} as Record<string, string>) || {};
      
      // Step 3: Get detailed pick data - now visible to all with our RLS policy
      const submissionIds = submissionsData.map(sub => sub.submission_id);

      const { data: picksData, error: picksError } = await supabase
        .from('setlist_game_picks')
        .select('submission_id, result, set, placement, showopener_correct, showcloser_correct')
        .in('submission_id', submissionIds)
        .neq('result', 'not_played');
        
      if (picksError) {
        console.error('Error fetching picks:', picksError.message, picksError.details);
        // Continue even if picks fetch fails - we'll have partial stats
      }
      
      // Step 4: Group submissions by user and calculate stats
      const userStats: Record<string, PlayerStats> = {};
      
      submissionsData.forEach(submission => {
        const userId = submission.user_id;
        const username = usernameMap[userId] || userId.substring(0, 8);
        
        if (!userStats[userId]) {
          userStats[userId] = {
            username: username.split('@')[0], // Only use characters before @ symbol
            userId,
            totalPoints: 0,
            showsPlayed: 0,
            avgPointsPerShow: 0,
            songsPicked: 0,
            setsPicked: 0,
            showOpenersPicked: 0,
            showClosersPicked: 0
          };
        }
        
        // Increment basic stats
        userStats[userId].totalPoints += submission.score || 0;
        userStats[userId].showsPlayed += 1;
      });
      
      // Count detailed picks stats if we have picks data
      if (picksData) {
        picksData.forEach(pick => {
          const submission = submissionsData.find(s => s.submission_id === pick.submission_id);
          if (!submission) {
            return;
          }
          
          const userId = submission.user_id;
          
          // Count songs picked (any correct song)
          if (pick.result !== 'not_played') {
            userStats[userId].songsPicked += 1;
          }
          
          // Count sets picked correctly
          if (pick.result === 'correct_song_set' || 
              pick.result === 'correct_song_set_setnum' || 
              pick.result === 'correct_song_set_openercloserencore' || 
              pick.result === 'correct_song_set_setnum_openercloserencore') {
            userStats[userId].setsPicked += 1;
          }
          
          // Count show openers - use showopener_correct flag instead of placement check
          if (pick.showopener_correct === true) {
            userStats[userId].showOpenersPicked += 1;
          }
          
          // Count show closers - use showcloser_correct flag
          if (pick.showcloser_correct === true) {
            userStats[userId].showClosersPicked += 1;
          }
        });
      }
      
      // Calculate average points per show and convert to array
      const standingsArray = Object.values(userStats).map(user => ({
        ...user,
        avgPointsPerShow: Number((user.totalPoints / (user.showsPlayed || 1)).toFixed(2))
      }));
      
      // Sort standings
      const sortedStandings = sortStandings(standingsArray, sortField, sortDirection);
      
      // Set the state
      setStandings(sortedStandings);
      
    } catch (error) {
      console.error('Error fetching standings:', error);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [activeLeague, sortField, sortDirection]);
  
  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);
  
  const handleSort = (field: keyof PlayerStats) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getSortIcon = (field: keyof PlayerStats) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 inline-block ml-1 text-black" /> :
      <ChevronDown className="w-4 h-4 inline-block ml-1 text-black" />;
  };

  const sortStandings = (
    data: PlayerStats[], 
    field: keyof PlayerStats, 
    direction: 'asc' | 'desc'
  ): PlayerStats[] => {
    return [...data].sort((a, b) => {
      // Primary sort by the selected field and direction
      let comparison = 0;
      
      if (a[field] < b[field]) {
        comparison = -1;
      } else if (a[field] > b[field]) {
        comparison = 1;
      }
      
      // Apply the selected sort direction
      comparison = direction === 'asc' ? comparison : -comparison;
      
      // If items are equal on the primary sort field, apply the tiebreaker rules
      if (comparison === 0) {
        // If we're not already sorting by totalPoints, use it as first tiebreaker (descending)
        if (field !== 'totalPoints') {
          if (a.totalPoints > b.totalPoints) return -1;
          if (a.totalPoints < b.totalPoints) return 1;
        }
        
        // If we're not already sorting by avgPointsPerShow, use it as second tiebreaker (descending)
        if (field !== 'avgPointsPerShow') {
          if (a.avgPointsPerShow > b.avgPointsPerShow) return -1;
          if (a.avgPointsPerShow < b.avgPointsPerShow) return 1;
        }
        
        // If we're not already sorting by songsPicked, use it as third tiebreaker (descending)
        if (field !== 'songsPicked') {
          if (a.songsPicked > b.songsPicked) return -1;
          if (a.songsPicked < b.songsPicked) return 1;
        }
        
        // Finally, sort alphabetically by username as the last tiebreaker
        return a.username.localeCompare(b.username);
      }
      
      return comparison;
    });
  };
  
  return (
    <div className="bg-primary border border-black rounded-lg p-3 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-flex items-center px-3 pt-1.5 pb-0.5 rounded-full border border-black">
          <Trophy className="w-5 h-5 mr-2" />
          <span>Standings</span>
        </h2>
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-secondary text-black border border-black">
          {activeLeague}
        </span>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading standings...</p>
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-black">No standings available yet for this league.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full border-collapse min-w-max table-fixed">
            <colgroup>
              <col className="w-12" /> {/* Rank column - narrow */}
              <col className="w-44" /> {/* User column - flexible but with minimum width */}
              <col className="w-[65px] min-w-[65px]" /> {/* Total Points */}
              <col className="w-[65px] min-w-[65px]" /> {/* Shows Played */}
              <col className="w-[65px] min-w-[65px]" /> {/* Points Per Show */}
              <col className="w-[65px] min-w-[65px]" /> {/* Songs Correctly Picked */}
              <col className="w-[65px] min-w-[65px]" /> {/* Sets Correctly Picked */}
              <col className="w-[65px] min-w-[65px]" /> {/* Show Openers Picked */}
              <col className="w-[65px] min-w-[65px]" /> {/* Show Closers Picked */}
            </colgroup>
            <thead>
              <tr className="bg-canvas border-y border-black/10">
                <th className="px-1 py-1 text-left text-xs font-semibold text-black whitespace-nowrap text-center">
                  Rank
                </th>
                <th className="px-3 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">
                  <button 
                    className="flex items-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded"
                    onClick={() => handleSort('username')}
                  >
                    <span>User</span>
                    {getSortIcon('username')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('totalPoints')}
                  >
                    <span>Total Points</span>
                    {getSortIcon('totalPoints')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('showsPlayed')}
                  >
                    <span>Shows Played</span>
                    {getSortIcon('showsPlayed')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('avgPointsPerShow')}
                  >
                    <span>Points Per Show</span>
                    {getSortIcon('avgPointsPerShow')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('songsPicked')}
                  >
                    <span>Songs Picked</span>
                    {getSortIcon('songsPicked')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('setsPicked')}
                  >
                    <span>Sets Picked</span>
                    {getSortIcon('setsPicked')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('showOpenersPicked')}
                  >
                    <span>Openers Picked</span>
                    {getSortIcon('showOpenersPicked')}
                  </button>
                </th>
                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                  <button 
                    className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                    onClick={() => handleSort('showClosersPicked')}
                  >
                    <span>Closers Picked</span>
                    {getSortIcon('showClosersPicked')}
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5">
              {standings.map((player, index) => (
                <tr 
                  key={player.userId} 
                  className={`
                    ${user && player.userId === user.id 
                      ? 'bg-[#f9ae37]/30' 
                      : index % 2 === 0 
                        ? 'bg-primary' 
                        : 'bg-canvas'
                    } 
                    hover:bg-black/10 transition-colors
                  `}
                >
                  <td className="px-1 py-0.5 text-xs text-center font-semibold text-black">
                    {index + 1}
                  </td>
                  <td className="px-3 py-0.5 whitespace-normal font-medium text-xs text-black">
                    {player.username}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-semibold text-[#a9682e]">
                    {player.totalPoints}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.showsPlayed}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.avgPointsPerShow.toFixed(2)}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.songsPicked}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.setsPicked}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.showOpenersPicked}
                  </td>
                  <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                    {player.showClosersPicked}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}