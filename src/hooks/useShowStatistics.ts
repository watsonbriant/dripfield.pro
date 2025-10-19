import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GameShow } from './useGameShows';

export function useShowStatistics(activeLeague: string) {
  const [showStatsLoading, setShowStatsLoading] = useState(false);
  const [showsWithStats, setShowsWithStats] = useState<GameShow[]>([]);

  const fetchShowStatistics = useCallback(async () => {
    if (!activeLeague) return;

    try {
      setShowStatsLoading(true);

      // Get all shows for this tour
      const { data, error } = await supabase
        .from('shows')
        .select('show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_scored, show_detail, show_canonid, show_subvenue_venue')
        .eq('show_tour', activeLeague)
        .eq('show_issetlistgame', true)
        .order('show_canonid', { ascending: true });

      if (error) {
        console.error('Error fetching tour shows:', error);
        return;
      }

      // Process shows with statistics
      const processedShows = [...data];

      for (const show of processedShows) {
        try {
          // Get player count
          const { count, error } = await supabase
            .from('setlist_game_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('show_id', show.show_id);

          if (error) {
            console.error(`Error fetching player count for show ${show.show_id}:`, error);
            show.playerCount = 0;
          } else {
            show.playerCount = count || 0;
          }

          // Get submissions data for this show
          const { data: submissions, error: subError } = await supabase
            .from('setlist_game_submissions')
            .select('submission_id, score, total_songs_picked, total_songs_played')
            .eq('show_id', show.show_id);

          if (subError) {
            console.error(`Error fetching submissions for show ${show.show_id}:`, subError);
          } else if (submissions && submissions.length > 0) {
            // Calculate high score
            show.highScore = Math.max(...submissions.map(s => s.score || 0));
            
            // Calculate average score
            const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
            show.averageScore = Number((totalScore / submissions.length).toFixed(2));
            
            // Calculate average over/under picks
            const overUnders = submissions.map(s => {
              const songsPlayed = s.total_songs_played || 0;
              const songsPicked = s.total_songs_picked || 0;
              return songsPicked - songsPlayed;
            });
            const totalOverUnder = overUnders.reduce((sum, val) => sum + val, 0);
            show.averageOverUnder = Number((totalOverUnder / submissions.length).toFixed(2));
            
            // Get picks data for this show
            const submissionIds = submissions.map(s => s.submission_id);
            const { data: picks, error: picksError } = await supabase
              .from('setlist_game_picks')
              .select('submission_id, result, showopener_correct, showcloser_correct')
              .in('submission_id', submissionIds);
              
            if (picksError) {
              console.error(`Error fetching picks for show ${show.show_id}:`, picksError);
            } else if (picks && picks.length > 0) {
              // Count total correct songs
              const correctSongs = picks.filter(p => p.result !== 'not_played').length;
              show.totalCorrectSongs = correctSongs;
              
              // Calculate average correct songs per user
              const submissionPicks = {};
              picks.forEach(pick => {
                if (!submissionPicks[pick.submission_id]) {
                  submissionPicks[pick.submission_id] = {
                    correctSongs: 0,
                    correctSets: 0,
                    pickedOpener: false,
                    pickedCloser: false
                  };
                }
                
                if (pick.result !== 'not_played') {
                  submissionPicks[pick.submission_id].correctSongs++;
                }
                
                if (['correct_song_set', 'correct_song_set_setnum', 'correct_song_set_openercloserencore', 'correct_song_set_setnum_openercloserencore'].includes(pick.result)) {
                  submissionPicks[pick.submission_id].correctSets++;
                }
                
                if (pick.showopener_correct) {
                  submissionPicks[pick.submission_id].pickedOpener = true;
                }
                
                if (pick.showcloser_correct) {
                  submissionPicks[pick.submission_id].pickedCloser = true;
                }
              });
              
              // Calculate total correct sets
              const correctSets = picks.filter(p => 
                ['correct_song_set', 'correct_song_set_setnum', 'correct_song_set_openercloserencore', 'correct_song_set_setnum_openercloserencore'].includes(p.result)
              ).length;
              show.totalCorrectSets = correctSets;
              
              // Count users who picked opener and closer correctly
              show.usersPickedOpener = Object.values(submissionPicks).filter(p => p.pickedOpener).length;
              show.usersPickedCloser = Object.values(submissionPicks).filter(p => p.pickedCloser).length;
              
              // Calculate averages per user
              const submissionValues = Object.values(submissionPicks);
              if (submissionValues.length > 0) {
                const totalCorrectSongs = submissionValues.reduce((sum, val) => sum + val.correctSongs, 0);
                const totalCorrectSets = submissionValues.reduce((sum, val) => sum + val.correctSets, 0);
                
                show.averageCorrectSongs = Number((totalCorrectSongs / submissionValues.length).toFixed(2));
                show.averageCorrectSets = Number((totalCorrectSets / submissionValues.length).toFixed(2));
              }
            }
          }
        } catch (error) {
          console.error(`Exception processing data for show ${show.show_id}:`, error);
        }
      }

      setShowsWithStats(processedShows);
    } catch (error) {
      console.error('Error in tour shows fetch:', error);
    } finally {
      setShowStatsLoading(false);
    }
  }, [activeLeague]);

  useEffect(() => {
    fetchShowStatistics();
  }, [fetchShowStatistics]);

  return {
    showStatsLoading,
    showsWithStats,
    fetchShowStatistics
  };
}