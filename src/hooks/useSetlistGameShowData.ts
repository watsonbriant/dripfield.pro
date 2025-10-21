import { useState, useEffect } from 'react';
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
  show_detail?: string | null;
  show_scored?: boolean;
  timeRemaining?: string;
  isSelectionClosed?: boolean;
  submission_id?: string;
  score?: number;
  playerCount?: number;
  tours?: { tour_id: string };
}

export interface PlayerStats {
  username: string;
  userId: string;
  totalPoints: number;
  showsPlayed: number;
  songsPicked: number;
  setsPicked: number;
  showOpenerPicked: boolean;
  showCloserPicked: boolean;
}

export interface SongStat {
  song: string;
  count: number;
  percentage: number;
  categoryId?: number;
  song_id?: string;
  category_artwork?: string;
}

export interface SubmissionDetails {
  totalScore: number;
  songsPicked: number;
  songsPlayed: number;
  setlist: Array<{
    entry_song: string;
    entry_set: string;
    entry_setnum: number;
    entry_placement: string;
  }>;
  username?: string;
}

export function useSetlistGameShowData(showId: string | undefined, user: any) {
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<GameShow | null>(null);
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [topSongs, setTopSongs] = useState<SongStat[]>([]);
  const [topOpeners, setTopOpeners] = useState<SongStat[]>([]);
  const [topClosers, setTopClosers] = useState<SongStat[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [userSubmission, setUserSubmission] = useState<string | null>(null);

  // Fetch show details
  useEffect(() => {
    async function fetchShowDetails() {
      if (!showId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_id, 
            show_date, 
            show_subvenue, 
            show_venue_location, 
            show_time, 
            show_tour, 
            show_subvenue_venue, 
            show_scored, 
            show_detail,
            tours!shows_show_tour_fkey(tour_id)
          `)
          .eq('show_id', showId)
          .single();

        if (error) {
          console.error('Error fetching show details:', error);
          return;
        }

        if (data) {
          // Calculate time remaining and closed status
          const now = new Date();
          const showDateTime = new Date(data.show_time);
          const oneHourBefore = new Date(showDateTime);
          oneHourBefore.setHours(oneHourBefore.getHours() - 1);

          const isSelectionClosed = now >= oneHourBefore;

          // Calculate time remaining
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

          // If user is logged in, check for existing submission
          if (user) {
            const { data: submissionData, error: submissionError } = await supabase
              .from('setlist_game_submissions')
              .select('submission_id')
              .eq('user_id', user.id)
              .eq('show_id', showId)
              .single();

            if (!submissionError && submissionData) {
              setUserSubmission(submissionData.submission_id);
            }
          }

          setShow({
            ...data,
            timeRemaining,
            isSelectionClosed
          });
        }
      } catch (error) {
        console.error('Error in show fetch:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShowDetails();
  }, [showId, user]);

  // Fetch player count
  useEffect(() => {
    async function fetchPlayerCount() {
      if (!showId) return;

      try {
        const { data, error, count } = await supabase
          .from('setlist_game_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('show_id', showId);

        if (error) {
          console.error('Error fetching player count:', error.message, error.details);
          const { count: fallbackCount, error: fallbackError } = await supabase
            .from('setlist_game_submissions')
            .select('submission_id', { count: 'exact', head: true })
            .eq('show_id', showId);

          if (fallbackError) {
            console.error('Fallback player count query failed:', fallbackError);
            setTotalPlayers(0);
          } else {
            setTotalPlayers(fallbackCount || 0);
          }
          return;
        }

        setTotalPlayers(count !== null ? count : 0);
      } catch (error) {
        console.error('Error in player count fetch:', error);
        setTotalPlayers(0);
      }
    }

    fetchPlayerCount();
  }, [showId]);

  // Fetch standings
  useEffect(() => {
    async function fetchStandings() {
      if (!showId || !show?.show_scored) return;

      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id, user_id, score, total_songs_picked')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError.message, submissionsError.details);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setStandings([]);
          return;
        }

        const userIds = [...new Set(submissionsData.map(sub => sub.user_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message, profilesError.details);
        }

        const usernameMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string>) || {};

        const submissionIds = submissionsData.map(sub => sub.submission_id);

        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('submission_id, result, set, placement, showcloser_correct, showopener_correct')
          .in('submission_id', submissionIds);

        if (picksError) {
          console.error('Error fetching picks:', picksError.message, picksError.details);
        }

        const picksBySubmission = picksData?.reduce((acc, pick) => {
          if (!acc[pick.submission_id]) {
            acc[pick.submission_id] = [];
          }
          acc[pick.submission_id].push(pick);
          return acc;
        }, {} as Record<string, any[]>) || {};

        const playerStatsArray: PlayerStats[] = submissionsData.map(submission => {
          const username = usernameMap[submission.user_id] || submission.user_id.substring(0, 8);
          const userPicks = picksBySubmission[submission.submission_id] || [];

          const songsPicked = userPicks.filter(pick =>
            pick.result && pick.result !== 'not_played'
          ).length;

          const setsPicked = userPicks.filter(pick =>
            pick.result === 'correct_song_set' ||
            pick.result === 'correct_song_set_setnum' ||
            pick.result === 'correct_song_set_openercloserencore' ||
            pick.result === 'correct_song_set_setnum_openercloserencore'
          ).length;

          const showCloserPicked = userPicks.some(pick =>
            pick.showcloser_correct === true
          );

          const showOpenerPicked = userPicks.some(pick =>
            pick.showopener_correct === true
          );

          return {
            username: username.split('@')[0],
            userId: submission.user_id,
            totalPoints: submission.score || 0,
            showsPlayed: 1,
            songsPicked,
            setsPicked,
            showOpenerPicked,
            showCloserPicked
          };
        });

        const sortedStandings = [...playerStatsArray].sort((a, b) => b.totalPoints - a.totalPoints);
        setStandings(sortedStandings);
      } catch (error) {
        console.error('Error fetching standings:', error);
      }
    }

    fetchStandings();
  }, [showId, show?.show_scored]);

  return {
    loading,
    show,
    standings,
    topSongs,
    topOpeners,
    topClosers,
    totalPlayers,
    userSubmission,
    setTopSongs,
    setTopOpeners,
    setTopClosers
  };
}
