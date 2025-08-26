import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useParams } from 'react-router-dom';
import { SongSelectionModal } from './SongSelectionModal';
import { ChevronRight, Award, List, MusicIcon, Users, ArrowLeft } from 'lucide-react';

interface ShowPageProps { }

interface GameShow {
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
  tours?: { tour_id: string }; // Add this line
}

interface PlayerStats {
  username: string;
  userId: string;
  totalPoints: number;
  showsPlayed: number;
  songsPicked: number;
  setsPicked: number;
  showOpenerPicked: boolean;
  showCloserPicked: boolean;
}

interface SongStat {
  song: string;
  count: number;
  percentage: number;
  categoryId?: number;
  song_id?: string;
  category_artwork?: string;
}

interface UserPick {
  song: string;
  set: string;
  setnum: number;
  placement?: string;
  score?: number;
  result?: string;
  showcloser_correct?: boolean;
  showopener_correct?: boolean;
}

interface SubmissionDetails {
  totalScore: number;
  songsPicked: number;
  songsPlayed: number;
  setlist: Array<{
    entry_song: string;
    entry_set: string;
    entry_setnum: number;
    entry_placement: string;
  }>;
  username?: string; // Added username for viewing other users' submissions
}

interface SongCategory {
  category: string;
  category_canonid: number;
  category_artwork?: string;
}

export function SetlistGameShowPage() {
  const { showId } = useParams<{ showId: string }>();
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<GameShow | null>(null);
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [topSongs, setTopSongs] = useState<SongStat[]>([]);
  const [topOpeners, setTopOpeners] = useState<SongStat[]>([]); // State for top openers
  const [topClosers, setTopClosers] = useState<SongStat[]>([]); // State for top show closers
  const [totalPlayers, setTotalPlayers] = useState(0);
  const { user } = useAuth();
  const [userSubmission, setUserSubmission] = useState<string | null>(null);
  const [activeSongSelectionShow, setActiveSongSelectionShow] = useState<GameShow | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [viewMode, setViewMode] = useState(true);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: []
  });
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activePill, setActivePill] = useState<'songs' | 'openers' | 'closers'>('songs');

  // Add the cleanSongName function from Tours component
  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

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

  // Fetch player count whenever the page loads or showId changes (removed show_scored dependency)
  useEffect(() => {
    async function fetchPlayerCount() {
      if (!showId) return;

      try {
        // Get count of all submissions for this show
        const { data, error, count } = await supabase
          .from('setlist_game_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('show_id', showId);

        if (error) {
          console.error('Error fetching player count:', error.message, error.details);

          // Try a fallback approach with simpler query
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

        // Update player count (using count if available, otherwise fallback to data length calculation)
        setTotalPlayers(count !== null ? count : 0);
      } catch (error) {
        console.error('Error in player count fetch:', error);
        setTotalPlayers(0);
      }
    }

    fetchPlayerCount();
  }, [showId]);

  // Fetch standings for this show when it's scored
  useEffect(() => {
    // Modify the fetchStandings function to check for showcloser_correct
    async function fetchStandings() {
      if (!showId || !show?.show_scored) return;

      try {
        // Get all submissions for this show
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

        // Get unique user IDs
        const userIds = [...new Set(submissionsData.map(sub => sub.user_id))];

        // Fetch profiles for username display
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message, profilesError.details);
          // Continue without usernames
        }

        // Create mapping of user_id to username
        const usernameMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string>) || {};

        // Get the submission IDs
        const submissionIds = submissionsData.map(sub => sub.submission_id);

        // Fetch all picks data to determine opener/closer and set picks
        // Update this query to include showcloser_correct field
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('submission_id, result, set, placement, showcloser_correct, showopener_correct')
          .in('submission_id', submissionIds);

        if (picksError) {
          console.error('Error fetching picks:', picksError.message, picksError.details);
          // Continue with partial data
        }

        // Group picks by submission
        const picksBySubmission = picksData?.reduce((acc, pick) => {
          if (!acc[pick.submission_id]) {
            acc[pick.submission_id] = [];
          }
          acc[pick.submission_id].push(pick);
          return acc;
        }, {} as Record<string, any[]>) || {};

        // Calculate standings
        const playerStatsArray: PlayerStats[] = submissionsData.map(submission => {
          const username = usernameMap[submission.user_id] || submission.user_id.substring(0, 8);
          const userPicks = picksBySubmission[submission.submission_id] || [];

          // Count correctly picked songs
          const songsPicked = userPicks.filter(pick =>
            pick.result && pick.result !== 'not_played'
          ).length;

          // Count correctly picked sets
          const setsPicked = userPicks.filter(pick =>
            pick.result === 'correct_song_set' ||
            pick.result === 'correct_song_set_setnum' ||
            pick.result === 'correct_song_set_openercloserencore' ||
            pick.result === 'correct_song_set_setnum_openercloserencore'
          ).length;

          // Check if show closer was picked - UPDATED to use showcloser_correct field
          const showCloserPicked = userPicks.some(pick =>
            pick.showcloser_correct === true
          );

          // Check if show opener was picked - UPDATED to use showopener_correct field
          const showOpenerPicked = userPicks.some(pick =>
            pick.showopener_correct === true
          );

          return {
            username: username.split('@')[0], // Only use characters before @ symbol
            userId: submission.user_id,
            totalPoints: submission.score || 0,
            showsPlayed: 1, // Always 1 for single show
            songsPicked,
            setsPicked,
            showOpenerPicked,
            showCloserPicked
          };
        });

        // Sort by total points descending
        const sortedStandings = [...playerStatsArray].sort((a, b) => b.totalPoints - a.totalPoints);
        setStandings(sortedStandings);
      } catch (error) {
        console.error('Error fetching standings:', error);
      }
    }

    fetchStandings();
  }, [showId, show?.show_scored]);

  // Fetch top picked songs
  useEffect(() => {
    // Updated fetchTopSongs function with multiple sorting criteria
    async function fetchTopSongs() {
      if (!showId) return;

      try {
        // Get all submissions for this show
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopSongs([]);
          return;
        }

        // Get the submission IDs
        const submissionIds = submissionsData.map(sub => sub.submission_id);

        // Get all songs picked for these submissions
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('song')
          .in('submission_id', submissionIds);

        if (picksError) {
          console.error('Error fetching song picks:', picksError);
          return;
        }

        // Count occurrences of each song
        const songCounts: Record<string, number> = {};
        picksData?.forEach(pick => {
          if (!songCounts[pick.song]) {
            songCounts[pick.song] = 0;
          }
          songCounts[pick.song]++;
        });

        // Get unique song names
        const songNames = Object.keys(songCounts);

        // Fetch song categories for all the picked songs
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select(`
            song, 
            song_id,
            song_category,
            categories:song_category(
              category,
              category_canonid,
              category_artwork
            )
          `);

        if (songError) {
          console.error('Error fetching song categories:', songError);
          return;
        }

        // Create a map of song to category_canonid
        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        songData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = (song.categories as SongCategory).category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = (song.categories as SongCategory).category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        // Convert to array with category information
        const songStatsArray: SongStat[] = Object.entries(songCounts).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        // Sort using multiple criteria:
        // 1. By count (descending)
        // 2. By category_canonid (ascending)
        // 3. Alphabetically by song name (ascending)
        const sortedSongs = [...songStatsArray].sort((a, b) => {
          // First sort by count (descending)
          if (b.count !== a.count) {
            return b.count - a.count;
          }

          // Then by category_canonid (ascending)
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }

          // Finally by song name (alphabetically)
          return a.song.localeCompare(b.song);
        });

        // Get top 10 songs
        const top10Songs = sortedSongs.slice(0, 8);
        setTopSongs(top10Songs);
      } catch (error) {
        console.error('Error fetching top songs:', error);
      }
    }

    fetchTopSongs();
  }, [showId]);

  // Fetch top Set 1 Openers
  useEffect(() => {
    async function fetchTopOpeners() {
      if (!showId) return;

      try {
        // Get all submissions for this show
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopOpeners([]);
          return;
        }

        // Get the submission IDs
        const submissionIds = submissionsData.map(sub => sub.submission_id);

        // Get all songs picked as Set 1 Opener for these submissions
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('song')
          .in('submission_id', submissionIds)
          .eq('placement', 'Set 1 Opener');

        if (picksError) {
          console.error('Error fetching opener picks:', picksError);
          return;
        }

        // Count occurrences of each song
        const songCounts: Record<string, number> = {};
        picksData?.forEach(pick => {
          if (!songCounts[pick.song]) {
            songCounts[pick.song] = 0;
          }
          songCounts[pick.song]++;
        });

        // Get unique song names
        const songNames = Object.keys(songCounts);

        // Fetch song categories for all the picked songs
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select(`
          song, 
          song_id,
          song_category,
          categories:song_category(
            category,
            category_canonid,
            category_artwork
          )
        `);

        if (songError) {
          console.error('Error fetching song categories:', songError);
          return;
        }

        // Create a map of song to category_canonid and song_id
        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        songData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = (song.categories as SongCategory).category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = (song.categories as SongCategory).category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        // Convert to array with category information
        const songStatsArray: SongStat[] = Object.entries(songCounts).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        // Sort using multiple criteria:
        // 1. By count (descending)
        // 2. By category_canonid (ascending)
        // 3. Alphabetically by song name (ascending)
        const sortedSongs = [...songStatsArray].sort((a, b) => {
          // First sort by count (descending)
          if (b.count !== a.count) {
            return b.count - a.count;
          }

          // Then by category_canonid (ascending)
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }

          // Finally by song name (alphabetically)
          return a.song.localeCompare(b.song);
        });

        // Get top 10 songs
        const top10Openers = sortedSongs.slice(0, 8);
        setTopOpeners(top10Openers);
      } catch (error) {
        console.error('Error fetching top openers:', error);
      }
    }

    fetchTopOpeners();
  }, [showId]);

  // Fetch top Show Closers
  useEffect(() => {
    async function fetchTopClosers() {
      if (!showId) return;

      try {
        // Get all submissions for this show
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopClosers([]);
          return;
        }

        // Get the submission IDs
        const submissionIds = submissionsData.map(sub => sub.submission_id);

        // For each submission, find the last song picked
        const closerSongs: Record<string, number> = {};

        for (const subId of submissionIds) {
          // Find the last song picked for this submission
          const { data: lastPickData, error: lastPickError } = await supabase
            .from('setlist_game_picks')
            .select('song')
            .eq('submission_id', subId)
            .order('set', { ascending: false })
            .order('setnum', { ascending: false })
            .limit(1);

          if (lastPickError) {
            console.error('Error fetching last pick:', lastPickError);
            continue;
          }

          if (lastPickData && lastPickData.length > 0) {
            const song = lastPickData[0].song;
            if (!closerSongs[song]) {
              closerSongs[song] = 0;
            }
            closerSongs[song]++;
          }
        }

        // Fetch song categories for all the picked songs
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select(`
          song, 
          song_id,
          song_category,
          categories:song_category(
            category,
            category_canonid,
            category_artwork
          )
        `);

        if (songError) {
          console.error('Error fetching song categories:', songError);
          return;
        }

        // Create a map of song to category_canonid and song_id
        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        songData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = (song.categories as SongCategory).category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = (song.categories as SongCategory).category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        // Convert to array with category information
        const songStatsArray: SongStat[] = Object.entries(closerSongs).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        // Sort using multiple criteria:
        // 1. By count (descending)
        // 2. By category_canonid (ascending)
        // 3. Alphabetically by song name (ascending)
        const sortedSongs = [...songStatsArray].sort((a, b) => {
          // First sort by count (descending)
          if (b.count !== a.count) {
            return b.count - a.count;
          }

          // Then by category_canonid (ascending)
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }

          // Finally by song name (alphabetically)
          return a.song.localeCompare(b.song);
        });

        // Get top songs
        const top8Closers = sortedSongs.slice(0, 8);
        setTopClosers(top8Closers);
      } catch (error) {
        console.error('Error fetching top closers:', error);
      }
    }

    fetchTopClosers();
  }, [showId]);

  // Load picks for viewing (either for the current user or another user)
  const fetchUserPicks = async (submissionId?: string) => {
    const targetSubmissionId = submissionId || userSubmission;

    if (!targetSubmissionId) return [];

    try {
      setLoadingPicks(true);

      // Get the picks for this submission
      const { data: picksData, error: picksError } = await supabase
        .from('setlist_game_picks')
        .select('song, set, setnum, placement, score, result, showcloser_correct, showopener_correct')
        .eq('submission_id', targetSubmissionId)
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

  // Handle making new picks
  const handleMakePicks = async () => {
    if (!user || !showId || !show) {
      return;
    }

    // Reset view mode first - important to do this before loading picks
    setViewMode(false);

    // If user has already submitted, load their picks and prepare for editing
    if (userSubmission) {
      await fetchUserPicks();

      // Set the active show for the modal - IMPORTANT: Include submission_id!
      setActiveSongSelectionShow({
        ...show,
        submission_id: userSubmission  // This is the key fix - passing the submission_id
      });
    } else {
      // Reset picks if this is a new submission
      setUserPicks([]);

      // Set the active show for the modal without submission_id
      setActiveSongSelectionShow(show);
    }
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setActiveSongSelectionShow(null);
    setUserPicks([]);
    setViewMode(false); // Reset view mode when closing
    setViewingUserId(null); // Reset viewing user ID
  };

  // Handle viewing current user's submission
  const handleViewSubmission = async () => {
    if (!user || !userSubmission || !show) {
      return;
    }

    try {
      // Reset viewing user ID
      setViewingUserId(null);

      await fetchUserPicks();

      // Fetch the submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('setlist_game_submissions')
        .select('score, total_songs_picked, total_songs_played')
        .eq('submission_id', userSubmission)
        .single();

      if (submissionError) {
        console.error('Error fetching submission:', submissionError);
      }

      // Set submission details
      setSubmissionDetails({
        totalScore: submissionData?.score || 0,
        songsPicked: submissionData?.total_songs_picked || 0,
        songsPlayed: submissionData?.total_songs_played || 0,
        setlist: []
      });

      // Set view mode
      setViewMode(true);

      // Open modal
      setActiveSongSelectionShow(show);

    } catch (error) {
      console.error('Error in view submission:', error);
    }
  };

  // Handle viewing another user's submission
  const handleViewOtherUserSubmission = async (userId: string, username: string) => {
    if (!showId || !show) {
      return;
    }

    // If user is not logged in, prompt them to log in
    if (!user) {
      alert("Please log in to view user submissions");
      return;
    }

    try {
      // Set viewing user ID
      setViewingUserId(userId);

      // Find the submission for this user and show
      const { data: submissionData, error: submissionError } = await supabase
        .from('setlist_game_submissions')
        .select('submission_id, score, total_songs_picked, total_songs_played')
        .eq('user_id', userId)
        .eq('show_id', showId)
        .single();

      if (submissionError) {
        console.error('Error fetching other user submission:', submissionError.message, submissionError.details);
        return;
      }

      if (!submissionData) {
        console.error('No submission found for this user');
        return;
      }

      // Fetch the user's picks
      await fetchUserPicks(submissionData.submission_id);

      // Set submission details
      setSubmissionDetails({
        totalScore: submissionData.score || 0,
        songsPicked: submissionData.total_songs_picked || 0,
        songsPlayed: submissionData.total_songs_played || 0,
        setlist: [],
        username: username
      });

      // Set view mode
      setViewMode(true);

      // Open modal
      setActiveSongSelectionShow(show);

    } catch (error) {
      console.error('Error in view other user submission:', error);
    }
  };

  // Format date for display (MM.DD.YY)
  const formatDate = (dateString: string) => {
    return dateString
      .split('-')
      .slice(1)
      .concat(dateString.substring(2, 4))
      .join('.');
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center mb-6 font-semibold text-sm text-fifth">
        <Link to="/setlistgame" className="hover:underline transition-colors">
          <div className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-secondary text-fifth">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Echo of a Show
          </div>
        </Link>
        {show && show.show_tour && show.tours?.tour_id && (
          <>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/setlistgame/tour/${show.tours.tour_id}`} className="hover:underline transition-colors bg-tertiary rounded-lg py-1 px-2 border border-secondary">
              {show.show_tour}
            </Link>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading show details...</p>
        </div>
      ) : show ? (
        <div className="space-y-6">
          {/* Show Info Header */}
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:items-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
                  {formatDate(show.show_date)}
                </h2>
                <h2 className="text-sm font-medium text-fifth/90">
                  {show.show_subvenue}
                </h2>
                <p className="text-fifth font-light text-xs mb-0.5">
                  {show.show_venue_location}<br />
                </p>
                <p className="text-fourth text-xs font-medium">
                  {show.show_detail && show.show_detail}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end">
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-3 font-light">
                  {show.show_scored ? (
                    <div className="px-3 py-1.5 bg-blue-500/20 text-blue-700 rounded-md text-sm inline-block border border-blue-500/30">
                      Game Completed
                    </div>
                  ) : show.isSelectionClosed ? (
                    <div className="px-3 py-1.5 bg-red-500/20 text-red-700 rounded-md text-sm inline-block border border-red-500/30">
                      Picks Closed
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-green-500/20 text-green-700 rounded-md text-sm inline-block border border-green-500/30">
                      {show.timeRemaining} left to submit
                    </div>
                  )}

                  {/* My Picks Button */}
                  {user && userSubmission && (
                    <button
                      onClick={handleViewSubmission}
                      className="px-3 py-1.5 bg-tertiary hover:bg-tertiary/40 text-fifth font-medium rounded-md transition-colors text-sm border border-secondary"
                    >
                      {show.show_scored ? 'View My Results' : 'View My Picks'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Players Stats */}
            <div className="mt-3 flex flex-col items-center sm:flex-row sm:justify-between gap-3 pt-3 border-t border-secondary">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fifth/60" />
                <span className="text-sm font-light text-fifth/90">
                  <span className="font-medium text-fifth">{totalPlayers}</span> {totalPlayers === 1 ? 'user' : 'users'} playing
                </span>
              </div>

              {show.show_tour && (
                <div className="px-3 py-1 bg-secondary text-fifth font-semibold rounded-md text-sm border border-secondary">
                  {show.show_tour}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Different sections based on show status */}
          {show.show_scored ? (
            <div className="bg-primary border border-secondary rounded-lg p-3">
              <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-3 gap-2">
                <Award className="w-5 h-5 text-fifth" />
                <span>Standings</span>
              </h2>

              {standings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-fifth">No standings available yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max table-fixed"> 
                    <colgroup>
                      <col className="w-12" /> {/* Rank column - narrow */}
                      <col className="w-44" /> {/* User column - flexible but with minimum width */}
                      <col className="w-[65px] min-w-[65px]" /> {/* Total Points */}
                      <col className="w-[65px] min-w-[65px]" /> {/* Songs Correctly Picked */}
                      <col className="w-[65px] min-w-[65px]" /> {/* Sets Correctly Picked */}
                      <col className="w-[65px] min-w-[65px]" /> {/* Show Opener */}
                      <col className="w-[65px] min-w-[65px]" /> {/* Show Closer */}
                    </colgroup>
                    <thead>
                      <tr className="bg-canvas border-y border-secondary/10">
                        <th className="px-1 py-2 text-left text-xs font-semibold text-fifth whitespace-nowrap text-center">
                          Rank
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-fifth whitespace-nowrap">
                          User
                        </th>
                        <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                          Total Points
                        </th>
                        <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                          Songs Picked
                        </th>
                        <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                          Sets Picked
                        </th>
                        <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                          Show Opener
                        </th>
                        <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                          Show Closer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {standings.map((player, index) => (
                        <tr
                          key={player.userId}
                          className={`
                        ${user && player.userId === user.id
                              ? 'bg-tertiary/80 text-fifth'
                              : index % 2 === 0
                                ? 'bg-primary'
                                : 'bg-canvas'
                            } 
                        hover:bg-tertiary/40 transition-colors
                        `}
                        >
                          <td className="px-1 py-0.5 text-xs text-center font-medium"
                            style={{ color: 'black' }}>
                            {index + 1}
                          </td>
                          <td className="px-3 py-0.5 whitespace-normal font-medium text-xs"
                            style={{ color: 'black' }}>
                            <button
                              onClick={() => handleViewOtherUserSubmission(player.userId, player.username)}
                              className="hover:underline transition-colors focus:outline-none"
                            >
                              {player.username}
                            </button>
                          </td>
                          <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-medium"
                            style={{ color: '#8e6c7a' }}>
                            {player.totalPoints}
                          </td>
                          <td className="px-0.5 py-0.5 whitespace-nowrap font-light text-xs text-center"
                            style={{ color: 'black' }}>
                            {player.songsPicked}
                          </td>
                          <td className="px-0.5 py-0.5 whitespace-nowrap font-light text-xs text-center"
                            style={{ color: 'black' }}>
                            {player.setsPicked}
                          </td>
                          <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center">
                            {player.showOpenerPicked ? (
                              <div className="w-4 h-4 rounded-full bg-green-600 mx-auto" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center">
                            {player.showCloserPicked ? (
                              <div className="w-4 h-4 rounded-full bg-green-600 mx-auto" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-primary border border-secondary rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <List className="w-10 h-10 text-[#a9682e]" />
              </div>

              {show.isSelectionClosed ? (
                <>
                  <h2 className="text-xl font-medium text-fifth mb-2">
                    Picks are closed for this show.
                  </h2>
                  <p className="text-fifth max-w-lg mx-auto">
                    Check back later to see results after the setlist has been scored.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-medium text-fifth mb-2">
                    Show is open for picks.
                  </h2>
                  {user ? (
                    <button
                      onClick={handleMakePicks}
                      className="px-4 py-1 bg-tertiary hover:bg-tertiary/40 text-fifth font-medium rounded-md transition-colors border border-secondary"
                    >
                      {userSubmission ? 'Edit Picks' : 'Make Picks'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="px-4 py-2 bg-tertiary/50 hover:bg-tertiary/60 text-fifth font-medium rounded-md transition-colors inline-block border border-secondary/60"
                    >
                      Login to Play
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {/* Top Songs, Top Openers, and Top Closers - Pills for mobile, grid for larger screens */}
          <div>
            {/* Mobile view container */}
            <div className="mb-6 lg:hidden">
              {/* Container for everything including heading, pills, and songs */}
              <div className="bg-primary border border-secondary rounded-lg p-3">
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                {/* Top Picks heading */}
                <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap gap-2">
                  <MusicIcon className="w-5 h-5 text-fifth mb-0.5" />
                  <span>Top Picks</span>
                </h2>

                {/* Pill selector */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActivePill('songs')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'songs'
                        ? 'bg-fourth text-primary border-secondary'
                        : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                      }`}
                  >
                    Songs
                  </button>
                  <button
                    onClick={() => setActivePill('openers')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'openers'
                        ? 'bg-[#006400] text-primary border-secondary'
                        : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                      }`}
                  >
                    Openers
                  </button>
                  <button
                    onClick={() => setActivePill('closers')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'closers'
                        ? 'bg-[#E17401] text-primary border-secondary'
                        : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                      }`}
                  >
                    Closers
                  </button>
                </div>
                </div>

                {/* Content section */}
                <div className="rounded-lg">
                  {activePill === 'songs' && (
                    <div className="space-y-1">
                      {topSongs.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-fifth">No song data available yet.</p>
                        </div>
                      ) : (
                        topSongs.map((song, index) => (
                          <div
                            key={song.song}
                            className="flex items-center justify-between rounded-md bg-canvas"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10 min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              {song.category_artwork && (
                                <img
                                  src={song.category_artwork}
                                  alt={`${song.song} artwork`}
                                  className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                                  onError={(e) => {
                                    // Hide the image if it fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <Link
                                to={`/song/${song.song_id}`}
                                className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                              >
                                {cleanSongName(song.song)}
                              </Link>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10 min-w-[28px] text-center">
                                {song.count}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activePill === 'openers' && (
                    <div className="space-y-1">
                      {topOpeners.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-fifth">No opener data available yet.</p>
                        </div>
                      ) : (
                        topOpeners.map((song, index) => (
                          <div
                            key={song.song}
                            className="flex items-center justify-between rounded-md bg-canvas"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10 min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              {song.category_artwork && (
                                <img
                                  src={song.category_artwork}
                                  alt={`${song.song} artwork`}
                                  className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                                  onError={(e) => {
                                    // Hide the image if it fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <Link
                                to={`/song/${song.song_id}`}
                                className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                              >
                                {cleanSongName(song.song)}
                              </Link>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10 min-w-[28px] text-center">
                                {song.count}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activePill === 'closers' && (
                    <div className="space-y-1">
                      {topClosers.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-fifth">No closer data available yet.</p>
                        </div>
                      ) : (
                        topClosers.map((song, index) => (
                          <div
                            key={song.song}
                            className="flex items-center justify-between rounded-md bg-canvas"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10 min-w-[24px] text-center">
                                {index + 1}
                              </span>
                              {song.category_artwork && (
                                <img
                                  src={song.category_artwork}
                                  alt={`${song.song} artwork`}
                                  className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                                  onError={(e) => {
                                    // Hide the image if it fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <Link
                                to={`/song/${song.song_id}`}
                                className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                              >
                                {cleanSongName(song.song)}
                              </Link>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10 min-w-[28px] text-center">
                                {song.count}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop view - show grid layout with all three sections */}
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Top Songs Picked */}
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <h3 className="text-lg font-semibold bg-fourth text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
                  <MusicIcon className="w-4 h-4 text-primary" />
                  <span>Top Songs Picked</span>
                </h3>

                {topSongs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-fifth text-xs">No song data available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {topSongs.map((song, index) => (
                      <div
                        key={song.song}
                        className="flex items-center justify-between rounded-md bg-canvas"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10">
                            {index + 1}
                          </span>
                          {song.category_artwork && (
                            <img
                              src={song.category_artwork}
                              alt={`${song.song} artwork`}
                              className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                              onError={(e) => {
                                // Hide the image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <Link
                            to={`/song/${song.song_id}`}
                            className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                          >
                            {cleanSongName(song.song)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10">
                            {song.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Show Openers Picked */}
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <h3 className="text-lg font-semibold bg-[#006400] text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
                  <MusicIcon className="w-4 h-4 text-primary" />
                  <span>Top Show Openers</span>
                </h3>

                {topOpeners.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-fifth text-xs">No opener data available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {topOpeners.map((song, index) => (
                      <div
                        key={song.song}
                        className="flex items-center justify-between rounded-md bg-canvas"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10">
                            {index + 1}
                          </span>
                          {song.category_artwork && (
                            <img
                              src={song.category_artwork}
                              alt={`${song.song} artwork`}
                              className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                              onError={(e) => {
                                // Hide the image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <Link
                            to={`/song/${song.song_id}`}
                            className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                          >
                            {cleanSongName(song.song)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10">
                            {song.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Show Closers Picked */}
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <h3 className="text-lg font-semibold bg-[#E17401] text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
                  <MusicIcon className="w-4 h-4 text-primary" />
                  <span>Top Show Closers</span>
                </h3>

                {topClosers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-fifth text-xs">No closer data available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {topClosers.map((song, index) => (
                      <div
                        key={song.song}
                        className="flex items-center justify-between rounded-md bg-canvas"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10">
                            {index + 1}
                          </span>
                          {song.category_artwork && (
                            <img
                              src={song.category_artwork}
                              alt={`${song.song} artwork`}
                              className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                              onError={(e) => {
                                // Hide the image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <Link
                            to={`/song/${song.song_id}`}
                            className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
                          >
                            {cleanSongName(song.song)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10">
                            {song.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary border border-secondary rounded-lg p-3 text-center">
          <p className="text-fifth">Show not found.</p>
        </div>
      )}

      {/* Song Selection Modal for viewing or making user's picks */}
      {activeSongSelectionShow && (
        <SongSelectionModal
          isOpen={!!activeSongSelectionShow}
          onClose={handleCloseModal}
          show={activeSongSelectionShow}
          existingPicks={userPicks}
          isEditing={!!userSubmission && !viewMode && !viewingUserId}
          viewMode={viewMode || !!viewingUserId}
          submissionDetails={viewMode ? submissionDetails : undefined}
        />
      )}
    </div>
  );
}