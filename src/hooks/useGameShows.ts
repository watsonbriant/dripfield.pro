import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface GameShow {
  show_id: string;
  show_date: string;
  show_subvenue: string;
  show_venue_location: string;
  show_time: string;
  show_tour: string;
  show_canonid: string;
  show_subvenue_venue: string;
  show_detail: string;
  show_scored?: boolean;
  timeRemaining?: string;
  isSelectionClosed?: boolean;
  submission_id?: string;
  score?: number;
  playerCount?: number;
}

export function useGameShows(activeLeague: string, user: any) {
  const [loading, setLoading] = useState(true);
  const [gameShows, setGameShows] = useState<GameShow[]>([]);

  // Function to calculate time remaining that can be called repeatedly
  const calculateTimeRemaining = useCallback((showTime: string): {
    timeRemaining: string;
    isSelectionClosed: boolean;
    isLessThan24Hours: boolean;
  } => {
    const now = new Date();
    const showDateTime = new Date(showTime);
    const oneHourBefore = new Date(showDateTime.getTime() - (60 * 60 * 1000));

    const isSelectionClosed = now >= oneHourBefore;
    const isLessThan24Hours = oneHourBefore.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

    let timeRemaining = '';
    if (!isSelectionClosed) {
      const timeDiff = oneHourBefore.getTime() - now.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        timeRemaining = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = `${minutes}m`;
      }
    }

    return { timeRemaining, isSelectionClosed, isLessThan24Hours };
  }, []);

  const fetchGameShows = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('shows')
        .select('show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_subvenue_venue, show_scored, show_detail, show_canonid')
        .eq('show_tour', activeLeague)
        .eq('show_issetlistgame', true)
        .order('show_canonid', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching game shows:', error.message, error.details);
        return;
      }

      if (data) {
        // Process data to add time remaining calculations
        const processedShows = data.map(show => {
          const { timeRemaining, isSelectionClosed, isLessThan24Hours } = calculateTimeRemaining(show.show_time);

          return {
            ...show,
            show_detail: show.show_detail || '',
            timeRemaining,
            isSelectionClosed,
            isLessThan24Hours,
            playerCount: 0
          };
        });

        // If user is logged in, check for existing submissions
        if (user) {
          const showIds = processedShows.map(show => show.show_id);

          const { data: submissionsData, error: submissionsError } = await supabase
            .from('setlist_game_submissions')
            .select('show_id, submission_id, score')
            .eq('user_id', user.id)
            .in('show_id', showIds);

          if (submissionsError) {
            console.error('Error fetching user submissions:', submissionsError.message, submissionsError.details);
          } else if (submissionsData) {
            const submissionMap = submissionsData.reduce((acc, sub) => {
              acc[sub.show_id] = {
                submission_id: sub.submission_id,
                score: sub.score
              };
              return acc;
            }, {} as Record<string, { submission_id: string; score: number | null }>);

            processedShows.forEach(show => {
              if (submissionMap[show.show_id]) {
                show.submission_id = submissionMap[show.show_id].submission_id;
                show.score = submissionMap[show.show_id].score;
              }
            });
          }
        }

        // Improved player count fetching with better error handling
        for (const show of processedShows) {
          try {
            const { count, error } = await supabase
              .from('setlist_game_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('show_id', show.show_id);

            if (error) {
              console.error(`Error fetching player count for show ${show.show_id}:`, error.message, error.details);

              const { count: fallbackCount, error: fallbackError } = await supabase
                .from('setlist_game_submissions')
                .select('submission_id', { count: 'exact', head: true })
                .eq('show_id', show.show_id);

              if (fallbackError) {
                console.error(`Fallback player count query failed for show ${show.show_id}:`, fallbackError);
              } else {
                show.playerCount = fallbackCount || 0;
              }
            } else {
              show.playerCount = count || 0;
            }
          } catch (countError) {
            console.error(`Exception fetching player count for show ${show.show_id}:`, countError);
          }
        }

        setGameShows(processedShows);
      }
    } catch (error) {
      console.error('Error in game shows fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [activeLeague, calculateTimeRemaining, user]);

  // Initial data fetching
  useEffect(() => {
    fetchGameShows();
  }, [fetchGameShows]);

  // Set up timer to update countdown every minute
  useEffect(() => {
    if (gameShows.length === 0) return;

    const updateTimers = () => {
      setGameShows(prevShows =>
        prevShows.map(show => {
          const { timeRemaining, isSelectionClosed } = calculateTimeRemaining(show.show_time);

          return {
            ...show,
            timeRemaining,
            isSelectionClosed
          };
        })
      );
    };

    updateTimers();
    const timerId = setInterval(updateTimers, 60000);

    return () => clearInterval(timerId);
  }, [gameShows.length, calculateTimeRemaining]);

  return {
    loading,
    gameShows,
    fetchGameShows
  };
}
