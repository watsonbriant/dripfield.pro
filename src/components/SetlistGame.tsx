import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { SongSelectionModal } from './SongSelectionModal';
import { SetlistGameRulesModal } from './SetlistGameRulesModal'; // Import the new component
import { SetlistGameStandings } from './SetlistGameStandings';
import { ChevronDown, X, HelpCircle, Trophy, ListMusic } from 'lucide-react'; // Add Trophy icon
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBluesky } from '@fortawesome/free-brands-svg-icons';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

interface GameShow {
  show_id: string;
  show_date: string;
  show_subvenue: string;
  show_venue_location: string;
  show_time: string;
  show_tour: string;
  show_canonid: string;
  show_subvenue_venue: string;
  show_detail?: string | null; // Add detail field
  show_scored?: boolean; // Add this field
  timeRemaining?: string;
  isSelectionClosed?: boolean;
  submission_id?: string;
  score?: number; // Add score field
  playerCount?: number;
}

interface UserPick {
  song: string;
  set: string;
  setnum: number;
  placement?: string;
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
}

export function SetlistGame() {
  const [loading, setLoading] = useState(true);
  const [gameShows, setGameShows] = useState<GameShow[]>([]);
  const [activeLeague, setActiveLeague] = useState("2025 Viva El Gonzo");
  const { user } = useAuth();
  const [activeSongSelectionShow, setActiveSongSelectionShow] = useState<GameShow | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);

  const [showScoringModal, setShowScoringModal] = useState(false);
  const [selectedShowToScore, setSelectedShowToScore] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [showRulesModal, setShowRulesModal] = useState(false);

  const [viewMode, setViewMode] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: []
  });

  // Function to calculate time remaining that can be called repeatedly
  const calculateTimeRemaining = useCallback((showTime: string): {
    timeRemaining: string;
    isSelectionClosed: boolean;
    isLessThan24Hours: boolean;  // Add this new property
  } => {
    const now = new Date();
    const showDateTime = new Date(showTime);
    const oneHourBefore = new Date(showDateTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  
    const isSelectionClosed = now >= oneHourBefore;
    
    // Calculate if less than 24 hours remaining
    const isLessThan24Hours = oneHourBefore.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
  
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
  
    return { timeRemaining, isSelectionClosed, isLessThan24Hours };
  }, []);

  const fetchGameShows = useCallback(async () => {
    try {
      setLoading(true);
  
      // Query to get shows data remains the same
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
            timeRemaining,
            isSelectionClosed,
            isLessThan24Hours,
            playerCount: 0 // Initialize player count
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
            // Create a map of show_id to submission data
            const submissionMap = submissionsData.reduce((acc, sub) => {
              acc[sub.show_id] = {
                submission_id: sub.submission_id,
                score: sub.score
              };
              return acc;
            }, {} as Record<string, { submission_id: string; score: number | null }>);
  
            // Add submission_id and score to each show if it exists
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
            // More robust query with explicit error handling
            const { count, error } = await supabase
              .from('setlist_game_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('show_id', show.show_id);
            
            if (error) {
              console.error(`Error fetching player count for show ${show.show_id}:`, error.message, error.details);
              
              // Fallback to a simpler query if the first one fails
              const { count: fallbackCount, error: fallbackError } = await supabase
                .from('setlist_game_submissions')
                .select('submission_id', { count: 'exact', head: true })
                .eq('show_id', show.show_id);
                
              if (fallbackError) {
                console.error(`Fallback player count query failed for show ${show.show_id}:`, fallbackError);
                // Keep default 0 if both queries fail
              } else {
                show.playerCount = fallbackCount || 0;
              }
            } else {
              show.playerCount = count || 0;
            }
          } catch (countError) {
            console.error(`Exception fetching player count for show ${show.show_id}:`, countError);
            // Keep default player count of 0 if query fails
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
    // Only set up the timer if there are game shows
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

    // Update immediately then set interval
    updateTimers();
    const timerId = setInterval(updateTimers, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, [gameShows.length, calculateTimeRemaining]);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdminUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
          return;
        }

        setIsAdminUser(data?.is_admin || false);
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdminUser(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Load user's picks for a show
  const fetchUserPicks = async (showId: string) => {
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

  // Handle opening the song selection modal
  const handleSelectSongs = async (show: GameShow) => {
    // Reset view mode first - important to do this before loading picks
    setViewMode(false);

    // If user has already submitted, load their picks
    if (show.submission_id && user) {
      await fetchUserPicks(show.show_id);
    } else {
      // Reset picks if this is a new submission
      setUserPicks([]);
    }

    setActiveSongSelectionShow(show);
  };

  // Handle closing the song selection modal
  const handleCloseModal = () => {
    setActiveSongSelectionShow(null);
    setUserPicks([]);
    setViewMode(false); // Reset view mode when closing
  };

  // Updated scoring function with fixes for multi-instance songs and show closer
  const handleScoreSubmissions = async () => {
    if (!selectedShowToScore) {
      return;
    }
  
    try {
      setIsScoring(true);
      console.log("Beginning scoring process for show ID:", selectedShowToScore);
  
      // Step 1: Count total songs played at this show
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlist_entries')
        .select('entry_id')
        .eq('entry_show', selectedShowToScore);
  
      if (setlistError) {
        console.error('Error fetching setlist:', setlistError);
        throw setlistError;
      }
  
      const totalSongsPlayed = setlistData.length;
      console.log(`Total songs played at this show: ${totalSongsPlayed}`);
  
      // Step 2: Get actual setlist data (for more detailed processing)
      const { data: actualSetlistData, error: actualSetlistError } = await supabase
        .from('setlist_entries')
        .select('entry_id, entry_song, entry_set, entry_setnum, entry_placement')
        .eq('entry_show', selectedShowToScore)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true });
  
      if (actualSetlistError) {
        console.error('Error fetching actual setlist data:', actualSetlistError);
        throw actualSetlistError;
      }
  
      console.log("Fetched actual setlist data:", actualSetlistData);
  
      // Step 3: Find the last song of the show
      const actualLastSong = actualSetlistData && actualSetlistData.length > 0 
        ? actualSetlistData[actualSetlistData.length - 1] 
        : null;
  
      if (actualLastSong) {
        console.log(`Actual last song: ${actualLastSong.entry_song}, Set ${actualLastSong.entry_set}, Position ${actualLastSong.entry_setnum}`);
      } else {
        console.log("No last song found");
      }
  
      // Step 4: Get all submissions for this show
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('setlist_game_submissions')
        .select('submission_id, user_id, total_songs_picked')
        .eq('show_id', selectedShowToScore);
  
      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw submissionsError;
      }
  
      console.log(`Found ${submissionsData.length} submissions to score`);
  
      // Step 5: For each submission, update total_songs_played and score picks
      for (const submission of submissionsData) {
        console.log(`\nScoring submission ${submission.submission_id} for user ${submission.user_id}`);
        let totalScore = 0;
  
        // Update total_songs_played
        await supabase
          .from('setlist_game_submissions')
          .update({ total_songs_played: totalSongsPlayed })
          .eq('submission_id', submission.submission_id);
  
        // Get all picks for this submission
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('pick_id, song, set, setnum, placement')
          .eq('submission_id', submission.submission_id);
  
        if (picksError) {
          console.error('Error fetching picks:', picksError);
          continue; // Skip to next submission if there's an error
        }
  
        console.log(`Found ${picksData.length} picks to score`);
  
        // Create a dictionary of songs in setlist for quick lookup
        const setlistSongs = {};
        actualSetlistData.forEach(entry => {
          if (!setlistSongs[entry.entry_song]) {
            setlistSongs[entry.entry_song] = [];
          }
          setlistSongs[entry.entry_song].push({
            set: entry.entry_set,
            setnum: entry.entry_setnum,
            placement: entry.entry_placement
          });
        });
        
        // Score each pick
        for (const pick of picksData) {
          let pickScore = 0;
          let resultString = 'not_played';
          console.log(`\nScoring pick: ${pick.song} in Set ${pick.set}, Position ${pick.setnum}, Placement ${pick.placement || 'None'}`);
  
          // Check if song was played (using our dictionary for faster lookup)
          const songInstances = setlistSongs[pick.song] || [];
          
          if (songInstances.length > 0) {
            console.log(`Song was played ${songInstances.length} times in the setlist`);
            
            // Start with basic song match (2 points)
            pickScore = 2;
            resultString = 'correct_song';
            
            // Check for correct set match
            const correctSetMatch = songInstances.some(instance => pick.set === instance.set);
            
            if (correctSetMatch) {
              console.log(`User picked correct set: ${pick.set}`);
              pickScore += 2;
              resultString = 'correct_song_set';
              
              // Check for correct setnum within that set
              const correctSetAndPosition = songInstances.some(instance => 
                pick.set === instance.set && pick.setnum === instance.setnum
              );
              
              if (correctSetAndPosition) {
                console.log(`User picked correct setnum within set: ${pick.setnum}`);
                pickScore += 3;
                resultString = 'correct_song_set_num';
              }
            }
            
            // Check for opener/closer matches
            const userPickedOpener = pick.placement?.includes('Opener');
            const userPickedCloser = pick.placement?.includes('Closer');
            
            console.log(`User picked opener: ${userPickedOpener}, User picked closer: ${userPickedCloser}`);
            
            // Check if song was an opener/closer in any instance
            const wasAnyOpener = songInstances.some(instance => instance.placement?.includes('Opener'));
            const wasAnyCloser = songInstances.some(instance => instance.placement?.includes('Closer'));
            
            console.log(`Song was any opener: ${wasAnyOpener}, Song was any closer: ${wasAnyCloser}`);
            
            // Check for specific placement match
            const wasSpecificPlacement = songInstances.some(instance => instance.placement === pick.placement);
            
            console.log(`Song had specific placement match: ${wasSpecificPlacement}`);
            
            // Handle opener/closer scoring
            if ((userPickedOpener && wasAnyOpener) || (userPickedCloser && wasAnyCloser)) {
              if (wasSpecificPlacement) {
                console.log(`User picked the exact placement: ${pick.placement}`);
                pickScore += 5; // 5 points for specific set opener/closer
                resultString = 'correct_song_set_openercloser';
              } else if (resultString === 'correct_song') {
                // Only apply general opener/closer bonus if they didn't already get set points
                console.log(`User picked general opener/closer`);
                pickScore += 2;
                resultString = 'correct_song_openercloser';
              }
            }
          } else {
            console.log(`Song was not played in the setlist`);
          }
          
          // Add to total score
          totalScore += pickScore;
          console.log(`Score for this pick: ${pickScore}, result: ${resultString}`);
          
          // Update the pick's score and result
          await supabase
            .from('setlist_game_picks')
            .update({ score: pickScore, result: resultString })
            .eq('pick_id', pick.pick_id);
        }
  
        // Step 6: Handle show closer bonus
        // Get the user's last pick
        const { data: lastPickData, error: lastPickError } = await supabase
          .from('setlist_game_picks')
          .select('pick_id, song, set, setnum, placement, score, result')
          .eq('submission_id', submission.submission_id)
          .order('set', { ascending: false })
          .order('setnum', { ascending: false })
          .limit(1);
  
        if (lastPickError) {
          console.error('Error getting last pick:', lastPickError);
        } else if (lastPickData && lastPickData.length > 0 && actualLastSong) {
          console.log(`User's last pick: ${lastPickData[0].song}, last song of show: ${actualLastSong.entry_song}`);
          
          // Check if last pick matches actual last song
          if (lastPickData[0].song === actualLastSong.entry_song) {
            console.log(`User correctly picked the show closer`);
            
            // Add show closer bonus to both pick and total score
            const currentPickScore = lastPickData[0].score || 0;
            const showcloserBonus = 3;
            const newPickScore = currentPickScore + showcloserBonus;
            
            console.log(`Adding +${showcloserBonus} points to ${lastPickData[0].song} (from ${currentPickScore} to ${newPickScore})`);
            
            totalScore += showcloserBonus;
            
            // Update the pick with new result and score
            await supabase
              .from('setlist_game_picks')
              .update({ 
                score: newPickScore,
                result: 'correct_song_showcloser'
              })
              .eq('pick_id', lastPickData[0].pick_id);
          }
        }
  
        // Step 7: Apply penalty for excess picks
        if (submission.total_songs_picked > totalSongsPlayed) {
          const excessSongs = submission.total_songs_picked - totalSongsPlayed;
          const penalty = excessSongs * 3;
          
          console.log(`Applying penalty of -${penalty} points for ${excessSongs} excess songs`);
          
          totalScore -= penalty;
        }
  
        // Step 8: Update submission's total score
        console.log(`Final score for submission: ${totalScore} points`);
        
        await supabase
          .from('setlist_game_submissions')
          .update({ score: totalScore })
          .eq('submission_id', submission.submission_id);
      }
  
      // Step 9: Mark the show as scored
      const { error: updateError } = await supabase
        .from('shows')
        .update({ show_scored: true })
        .eq('show_id', selectedShowToScore);
  
      if (updateError) {
        console.error('Error updating show_scored:', updateError);
        throw updateError;
      }
  
      console.log("Scoring completed successfully!");
      setScoringComplete(true);
  
      // Step 10: Refresh the list of shows to update UI
      setTimeout(() => {
        fetchGameShows();
        setShowScoringModal(false);
        setScoringComplete(false);
        setSelectedShowToScore(null);
      }, 2000);
  
    } catch (error) {
      console.error('Error scoring submissions:', error);
      alert('Failed to score submissions. Please try again.');
    } finally {
      setIsScoring(false);
    }
  };

  const handleViewSubmission = async (show: GameShow) => {
    if (!user || !show.submission_id) {
      return;
    }

    try {
      setLoadingPicks(true);

      // Fetch the user's picks for this show with all columns we need
      const { data: picksData, error: picksError } = await supabase
        .from('setlist_game_picks')
        .select('song, set, setnum, placement, score, result')
        .eq('submission_id', show.submission_id);

      if (picksError) {
        console.error('Error fetching picks:', picksError);
        return;
      }

      // Important: Set the userPicks state with this data
      setUserPicks(picksData || []);

      // Fetch the submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('setlist_game_submissions')
        .select('score, total_songs_picked, total_songs_played')
        .eq('submission_id', show.submission_id)
        .single();

      if (submissionError) {
        console.error('Error fetching submission:', submissionError);
      }

      // Set view mode before opening the modal
      setViewMode(true);

      // Set submission details
      setSubmissionDetails({
        totalScore: submissionData?.score || 0,
        songsPicked: submissionData?.total_songs_picked || picksData?.length || 0,
        songsPlayed: submissionData?.total_songs_played || 0,
        setlist: []
      });

      // Open the modal AFTER setting all the data and view mode
      setActiveSongSelectionShow(show);

    } catch (error) {
      console.error('Error in view submission:', error);
    } finally {
      setLoadingPicks(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-white mb-1">Echo of a Show</h1>
          <h2 className="text-sm font-semibold text-tertiary">A Setlist Game for Goose the Band</h2>
        </div>
        
        <div className="flex gap-3 justify-center md:justify-start">
          <a 
            href="https://bsky.app/profile/echoofashow.bsky.social" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon 
              icon={faBluesky} 
              size="2x" 
              style={{ color: '#ffffff' }} 
            />
          </a>

          <a 
            href="https://x.com/echoofashow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mr-4"
          >
            <FontAwesomeIcon 
              icon={faXTwitter} 
              size="2x" 
              style={{ color: '#ffffff' }} 
            />
          </a>

          {/* How to Play Button - visible to everyone */}
          <button
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-1.5 bg-tertiary hover:bg-tertiary/80 text-white font-semibold rounded-md transition-colors flex items-center gap-1 text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How to Play</span>
          </button>

          {/* Admin Score Button */}
          {isAdminUser && (
            <button
              onClick={() => setShowScoringModal(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors text-sm"
            >
              Score Show
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-[#fce7ca]/70 mt-4">Loading setlist games...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!user && (
            <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white/90 mb-4">How To Play</h2>
              <div className="mt-4 p-3 bg-tertiary/20 rounded border border-tertiary/40">
                <p className="text-white font-medium text-sm">
                  You need to be logged in to participate in the Setlist Game.{' '}
                  <Link to="/login" className="text-tertiary hover:underline">
                    Log in
                  </Link>
                  {' '}or{' '}
                  <Link to="/signup" className="text-tertiary hover:underline">
                    Sign up
                  </Link>
                  {' '}to start playing!
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#172330] border border-white/10 rounded-lg p-4 mt-6">
            <h2 className="text-xl font-semibold text-white/90 mb-4 flex justify-between">
              <div className="flex items-center gap-4">
                <ListMusic className="w-5 h-5 text-yellow-400" />
                <span>Active League</span>
                <span className="px-2 py-0.5 text-sm font-medium rounded bg-[#ffe6c7] text-[#0c1d27]">
                  {activeLeague}
                </span>
              </div>
            </h2>

            {gameShows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#fce7ca]/70">No active games found in this league.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-[#0e151b] border-y border-white/10">
                    <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Date</th>
                    <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Venue</th>
                    <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Location</th>
                    <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Detail</th>
                    <th className="px-4 py-2 text-center text-s font-semibold text-white/90 whitespace-nowrap">Status</th>
                    <th className="px-4 py-2 text-center text-s font-semibold text-white/90 whitespace-nowrap">Players</th>
                    {/* Conditionally render Score column */}
                    {user && (
                      <th className="px-4 py-2 text-center text-s font-semibold text-white/90 whitespace-nowrap">Score</th>
                    )}
                    <th className="px-4 py-2 text-center text-s font-semibold text-white/90 whitespace-nowrap">Picks</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-white/5">
                    {gameShows.map((show) => {
                      // Sort shows to determine the next upcoming show
                      const sortedShows = [...gameShows].sort((a, b) => {
                        const dateA = new Date(a.show_date);
                        const dateB = new Date(b.show_date);
                        if (dateA < dateB) return -1;
                        if (dateA > dateB) return 1;

                        const timeA = new Date(a.show_time);
                        const timeB = new Date(b.show_time);
                        return timeA - timeB;
                      });

                      // Find the next upcoming show that hasn't been closed yet
                      const nextUpcomingShow = sortedShows.find(s => !s.isSelectionClosed && !s.show_scored);

                      // Determine background color based on show status
                      let bgColor;
                      if (show.show_scored) {
                        bgColor = 'bg-[#0a1016]'; // Darkest shade for closed and scored shows
                      } else if (nextUpcomingShow && show.show_id === nextUpcomingShow.show_id) {
                        bgColor = 'bg-[#172330]'; // Lightest shade for next upcoming show
                      } else {
                        bgColor = 'bg-[#0c151c]'; // Middle shade for other shows
                      }

                      return (
                        <tr
                          key={show.show_id}
                          className={`${bgColor} hover:bg-white/10 transition-colors text-xs`}
                        >
                          <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                            <span className="font-semibold">
                              {user ? (
                                <Link
                                  to={`/setlistgame/${show.show_id}`}
                                  className="hover:text-white transition-colors table-link"
                                >
                                  {show.show_date
                                    .split('-')
                                    .slice(1)
                                    .concat(show.show_date.substring(2, 4))
                                    .join('.')}
                                </Link>
                              ) : (
                                <span className="cursor-default">
                                  {show.show_date
                                    .split('-')
                                    .slice(1)
                                    .concat(show.show_date.substring(2, 4))
                                    .join('.')}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                            {show.show_subvenue}
                          </td>
                          <td className="px-4 py-1 text-[#fce7ca]/70 whitespace-nowrap">
                            {show.show_venue_location}
                          </td>
                          <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                            {show.show_detail || ''}
                          </td>
                          <td className="px-4 py-1 whitespace-nowrap text-center">
                            {show.show_scored ? (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs">
                                Scored
                              </span>
                            ) : show.isSelectionClosed ? (
                              <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-md text-xs">
                                Closed
                              </span>
                            ) : show.isLessThan24Hours ? (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-md text-xs">
                                {show.timeRemaining} left
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-xs">
                                {show.timeRemaining} left
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-1 text-center">
                            <span className="text-[#fce7ca]/70 text-xs">
                              {show.playerCount !== undefined ? show.playerCount : '-'}
                            </span>
                          </td>
                          {/* Conditionally render Score cell */}
                          {user && (
                            <td className="px-4 py-1 text-center">
                              {user && show.score !== undefined && show.show_scored ? (
                                <span className="text-yellow-400 font-bold">
                                  {show.score}
                                </span>
                              ) : (
                                <span className="text-gray-500"></span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-1 text-center">
                            {show.show_scored ? (
                              user && show.submission_id ? (
                                <button
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-block"
                                  onClick={() => handleViewSubmission(show)}
                                >
                                  View Results
                                </button>
                              ) : (
                                <span className="px-3 py-1 bg-gray-500/50 text-white/50 text-xs font-medium rounded inline-block">
                                  Scored
                                </span>
                              )
                            ) : show.isSelectionClosed ? (
                              user && show.submission_id ? (
                                <button
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors inline-block"
                                  onClick={() => handleViewSubmission(show)}
                                >
                                  View Picks
                                </button>
                              ) : (
                                <button
                                  className="px-3 py-1 bg-gray-500/50 text-white/50 text-xs font-medium rounded cursor-not-allowed inline-block"
                                  disabled
                                >
                                  Closed
                                </button>
                              )
                            ) : (
                              user ? (
                                <button
                                  className="px-3 py-1 bg-tertiary hover:bg-tertiary/80 text-white text-xs font-medium rounded transition-colors inline-block"
                                  onClick={() => handleSelectSongs(show)}
                                >
                                  {show.submission_id ? 'Edit Picks' : 'Make Picks'}
                                </button>
                              ) : (
                                <Link
                                  to="/login"
                                  className="px-3 py-1 bg-tertiary/50 hover:bg-tertiary/60 text-white text-xs font-medium rounded transition-colors inline-block"
                                >
                                  Login to Play
                                </Link>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <SetlistGameStandings activeLeague={activeLeague} user={user} />
        </div>
      )}

      {/* Song Selection Modal */}
      {activeSongSelectionShow && (
        <SongSelectionModal
          isOpen={!!activeSongSelectionShow}
          onClose={handleCloseModal}
          show={activeSongSelectionShow}
          existingPicks={userPicks}
          isEditing={!!activeSongSelectionShow.submission_id && !viewMode}
          viewMode={viewMode}
          submissionDetails={viewMode ? submissionDetails : undefined}
        />
      )}

      {/* Scoring Modal */}
      {showScoringModal && isAdminUser && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowScoringModal(false)}
          />
          <div className="fixed inset-x-4 inset-y-auto top-1/4 md:inset-x-auto md:left-1/2 md:top-1/3 md:transform md:-translate-x-1/2 z-50 bg-primary rounded-lg border border-white/10 shadow-xl md:w-[500px] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white/90">Score Setlist Game</h3>
              <button
                onClick={() => setShowScoringModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {scoringComplete ? (
              <div className="bg-green-500/20 text-green-300 px-4 py-3 rounded-lg mb-4">
                Scoring completed successfully!
              </div>
            ) : (
              <>
                <p className="text-[#fce7ca]/90 mb-4">
                  Select a show to score all submissions for:
                </p>

                <div className="relative mb-4">
                  <select
                    value={selectedShowToScore || ''}
                    onChange={(e) => setSelectedShowToScore(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none"
                  >
                    <option value="">Select a show...</option>
                    {gameShows.map((show) => (
                      <option key={show.show_id} value={show.show_id}>
                        {show.show_date.split('-').slice(1).concat(show.show_date.substring(2, 4)).join('.')} - [{show.show_canonid}] - {show.show_subvenue}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowScoringModal(false)}
                    className="px-4 py-2 bg-[#0e151b] hover:bg-tertiary/20 text-white font-medium rounded-md transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScoreSubmissions}
                    disabled={!selectedShowToScore || isScoring}
                    className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors disabled:bg-tertiary/50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isScoring ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Scoring...</span>
                      </>
                    ) : (
                      <span>Score Submissions</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Rules Modal - Add this new modal */}
      <SetlistGameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}