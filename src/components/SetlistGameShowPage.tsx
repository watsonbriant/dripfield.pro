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
  show_subvenue_venue: string;
  show_scored?: boolean;
  timeRemaining?: string;
  isSelectionClosed?: boolean;
  submission_id?: string;
  show_detail?: string | null;
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
}

interface UserPick {
  song: string;
  set: string;
  setnum: number;
  placement?: string;
  score?: number;
  result?: string;
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
}

export function SetlistGameShowPage() {
  const { showId } = useParams<{ showId: string }>();
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<GameShow | null>(null);
  const [standings, setStandings] = useState<PlayerStats[]>([]);
  const [topSongs, setTopSongs] = useState<SongStat[]>([]);
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

  // Fetch show details
  useEffect(() => {
    async function fetchShowDetails() {
      if (!showId) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_subvenue_venue, show_scored, show_detail')
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
          console.error('Error fetching player count:', error);
          return;
        }

        // Update player count (using count if available, otherwise fallback to data length calculation)
        setTotalPlayers(count !== null ? count : 0);
      } catch (error) {
        console.error('Error in player count fetch:', error);
      }
    }

    fetchPlayerCount();
  }, [showId]);

  // Fetch standings for this show when it's scored
  useEffect(() => {
    async function fetchStandings() {
      if (!showId || !show?.show_scored) return;

      try {
        // Get all submissions for this show
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id, user_id, score, total_songs_picked')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
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
          console.error('Error fetching profiles:', profilesError);
        }

        // Create mapping of user_id to username
        const usernameMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile.username;
          return acc;
        }, {} as Record<string, string>) || {};

        // Get the submission IDs
        const submissionIds = submissionsData.map(sub => sub.submission_id);

        // Fetch all picks data to determine opener/closer and set picks
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('submission_id, result, set, placement')
          .in('submission_id', submissionIds);

        if (picksError) {
          console.error('Error fetching picks:', picksError);
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
            pick.result === 'correct_song_set_num' ||
            pick.result === 'correct_song_set_openercloser'
          ).length;

          // Check if show opener was picked
          const showOpenerPicked = userPicks.some(pick =>
            (pick.result === 'correct_song_set_openercloser' ||
              pick.result === 'correct_song_openercloser') &&
            pick.placement?.includes('Set 1 Opener')
          );

          // Check if show closer was picked
          const showCloserPicked = userPicks.some(pick =>
            pick.result === 'correct_song_showcloser'
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
            song_category,
            categories:song_category(
              category,
              category_canonid
            )
          `);

        if (songError) {
          console.error('Error fetching song categories:', songError);
          return;
        }

        // Create a map of song to category_canonid
        const songCategoryMap: Record<string, number> = {};
        songData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object' && 'category_canonid' in song.categories) {
            songCategoryMap[song.song] = (song.categories as SongCategory).category_canonid || 0;
          }
        });

        // Convert to array with category information
        const songStatsArray: SongStat[] = Object.entries(songCounts).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0 // Default to 0 if category not found
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
        const top10Songs = sortedSongs.slice(0, 10);
        setTopSongs(top10Songs);
      } catch (error) {
        console.error('Error fetching top songs:', error);
      }
    }

    fetchTopSongs();
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
        .select('song, set, setnum, placement, score, result')
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

    // If user has already submitted, load their picks
    if (userSubmission) {
      await fetchUserPicks();
    } else {
      // Reset picks if this is a new submission
      setUserPicks([]);
    }

    // Set the active show for the modal
    setActiveSongSelectionShow(show);
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
    if (!showId || !show || !user) {
      // Redirect to login if user is not logged in
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
        console.error('Error fetching other user submission:', submissionError);
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
      <div className="flex items-center mb-6 font-semibold text-sm text-[#fce7ca]/70">
        <Link to="/setlistgame" className="hover:text-tertiary transition-colors">
          <div className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Echo of a Show
          </div>
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-[#fce7ca]">
          {show ? `${formatDate(show.show_date)} – ${show.show_venue_location}` : 'Loading...'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-[#fce7ca]/70 mt-4">Loading show details...</p>
        </div>
      ) : show ? (
        <div className="space-y-6">
          {/* Show Info Header */}
          <div className="bg-[#172330] border border-white/10 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-lg md:text-lg font-bold text-white mb-1">
                  {formatDate(show.show_date)}
                </h1>
                <h2 className="text-sm text-[#fce7ca]/90">
                  {show.show_subvenue}
                </h2>
                <p className="text-[#fce7ca]/70 text-xs mb-1">
                  {show.show_venue_location}<br />
                </p>
                <p className="text-tertiary text-xs font-semibold">
                  {show.show_detail && show.show_detail}
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                {show.show_scored ? (
                  <div className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-md text-sm inline-block">
                    Game Completed
                  </div>
                ) : show.isSelectionClosed ? (
                  <div className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-md text-sm inline-block">
                    Picks Closed
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-md text-sm inline-block">
                    {show.timeRemaining} left to submit
                  </div>
                )}

                {/* My Picks Button */}
                {user && userSubmission && (
                  <button
                    onClick={handleViewSubmission}
                    className="ml-3 px-3 py-1.5 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors text-sm"
                  >
                    {show.show_scored ? 'View My Results' : 'View My Picks'}
                  </button>
                )}
              </div>
            </div>

            {/* Players Stats */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-white/60" />
                <span className="text-sm text-[#fce7ca]/90">
                  <span className="font-semibold text-white">{totalPlayers}</span> {totalPlayers === 1 ? 'user' : 'users'} playing
                </span>
              </div>

              {show.show_tour && (
                <div className="px-3 py-1 bg-[#ffe6c7] text-[#0c1d27] font-semibold rounded-md text-sm">
                  {show.show_tour}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Different sections based on show status */}
          {show.show_scored ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Standings - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span>Standings</span>
                  </h2>

                  {standings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#fce7ca]/70">No standings available yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
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
                          <tr className="bg-[#0e151b] border-y border-white/10">
                            <th className="px-1 py-2 text-left text-xs font-semibold text-white/90 whitespace-nowrap text-center">
                              Rank
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 whitespace-nowrap">
                              User
                            </th>
                            <th className="px-0.5 py-2 text-center text-xs font-semibold text-white/90">
                              Total Points
                            </th>
                            <th className="px-0.5 py-2 text-center text-xs font-semibold text-white/90">
                              Songs Picked
                            </th>
                            <th className="px-0.5 py-2 text-center text-xs font-semibold text-white/90">
                              Sets Picked
                            </th>
                            <th className="px-0.5 py-2 text-center text-xs font-semibold text-white/90">
                              Show Opener
                            </th>
                            <th className="px-0.5 py-2 text-center text-xs font-semibold text-white/90">
                              Show Closer
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {standings.map((player, index) => (
                            <tr
                              key={player.userId}
                              className={`
          ${player.userId === user?.id
                                  ? 'bg-tertiary/80 text-white'
                                  : index % 2 === 0
                                    ? 'bg-primary/30'
                                    : 'bg-[#0c151c]'
                                } 
          hover:bg-white/10 transition-colors
        `}
                            >
                              <td className="px-1 py-1 text-xs text-center font-semibold"
                                style={{ color: player.userId === user?.id ? 'white' : 'white' }}>
                                {index + 1}
                              </td>
                              <td className="px-3 py-1 whitespace-normal font-medium text-xs"
                                style={{ color: player.userId === user?.id ? 'white' : 'white' }}>
                                <button 
                                  onClick={() => handleViewOtherUserSubmission(player.userId, player.username)}
                                  className="hover:underline hover:text-tertiary transition-colors focus:outline-none"
                                >
                                  {player.username}
                                </button>
                              </td>
                              <td className="px-0.5 py-1 whitespace-nowrap text-xs text-center font-semibold"
                                style={{ color: player.userId === user?.id ? 'white' : 'white' }}>
                                {player.totalPoints}
                              </td>
                              <td className="px-0.5 py-1 whitespace-nowrap text-xs text-center"
                                style={{ color: player.userId === user?.id ? 'white' : 'white' }}>
                                {player.songsPicked}
                              </td>
                              <td className="px-0.5 py-1 whitespace-nowrap text-xs text-center"
                                style={{ color: player.userId === user?.id ? 'white' : 'white' }}>
                                {player.setsPicked}
                              </td>
                              <td className="px-0.5 py-1 whitespace-nowrap text-xs text-center">
                                {player.showOpenerPicked ? (
                                  <div className="w-4 h-4 rounded-full bg-green-500 mx-auto" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gray-600/50 mx-auto" />
                                )}
                              </td>
                              <td className="px-0.5 py-1 whitespace-nowrap text-xs text-center">
                                {player.showCloserPicked ? (
                                  <div className="w-4 h-4 rounded-full bg-green-500 mx-auto" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gray-600/50 mx-auto" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Picked Songs - Takes 1 column */}
              <div className="lg:col-span-1">
                <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
                    <MusicIcon className="w-5 h-5 text-tertiary" />
                    <span>Top Picked Songs</span>
                  </h2>

                  {topSongs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#fce7ca]/70">No song data available yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {topSongs.map((song, index) => (
                        <div
                          key={song.song}
                          className="flex items-center justify-between px-2 py-2 rounded-md bg-[#0e151b] border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white/90 bg-white/10 px-2 py-0.5 rounded font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-[#fce7ca] font-semibold text-xs">
                              {song.song}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white/90 bg-[#172330] px-2 py-0.5 rounded font-semibold">
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
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Pre-game content: Show status and participation info */}
              <div className="bg-[#172330] border border-white/10 rounded-lg p-6 text-center">
                <div className="flex items-center justify-center mb-6">
                  <List className="w-10 h-10 text-tertiary" />
                </div>

                {show.isSelectionClosed ? (
                  <>
                    <h2 className="text-xl font-semibold text-white/90 mb-2">
                      Picks are closed for this show.
                    </h2>
                    <p className="text-[#fce7ca]/70 max-w-lg mx-auto">
                      Check back later to see results after the setlist has been scored.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white/90 mb-2">
                      Show is open for picks.
                    </h2>
                    {user ? (
                      <button
                        onClick={handleMakePicks}
                        className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors"
                      >
                        {userSubmission ? 'Edit Picks' : 'Make Picks'}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="px-4 py-2 bg-tertiary/50 hover:bg-tertiary/60 text-white font-medium rounded-md transition-colors inline-block"
                      >
                        Login to Play
                      </Link>
                    )}
                  </>
                )}

              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#172330] border border-white/10 rounded-lg p-6 text-center">
          <p className="text-[#fce7ca]/70">Show not found.</p>
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