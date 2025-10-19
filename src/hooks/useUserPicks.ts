import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPick {
  song: string;
  set: string;
  setnum: number;
  placement?: string;
}

export function useUserPicks() {
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);

  const fetchUserPicks = async (showId: string, user: any) => {
    if (!user) return [];

    try {
      setLoadingPicks(true);

      // First get the submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('setlist_game_submissions')
        .select('submission_id')
        .eq('user_id', user.id)
        .eq('show_id', showId)
        .single();

      if (submissionError) {
        if (submissionError.code !== 'PGRST116') { // No rows returned is ok
          console.error('Error fetching submission:', submissionError);
        }
        return [];
      }

      if (!submissionData) return [];

      // Now get the picks for this submission
      const { data: picksData, error: picksError } = await supabase
        .from('setlist_game_picks')
        .select('song, set, setnum, placement')
        .eq('submission_id', submissionData.submission_id)
        .order('setnum', { ascending: true });

      if (picksError) {
        console.error('Error fetching picks:', picksError);
        return [];
      }

      if (picksData) {
        setUserPicks(picksData);
        return picksData;
      }

      return [];
    } catch (error) {
      console.error('Error in fetch user picks:', error);
      return [];
    } finally {
      setLoadingPicks(false);
    }
  };

  const resetPicks = () => {
    setUserPicks([]);
  };

  return {
    userPicks,
    loadingPicks,
    fetchUserPicks,
    resetPicks,
    setUserPicks
  };
}
