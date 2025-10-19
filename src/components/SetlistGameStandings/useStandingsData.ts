import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PlayerStats, SortField, SortDirection } from './types';
import { sortStandings } from './utils';

export const useStandingsData = (activeLeague: string, sortField: SortField, sortDirection: SortDirection) => {
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

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

  return { standings, loading };
};
