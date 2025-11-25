import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { SongSelectionModal } from './SongSelectionModal';
import { useSetlistGameShowData, GameShow, SubmissionDetails } from '../hooks/useSetlistGameShowData';
import { useTopSongsData, useTopOpenersData, useTopClosersData } from '../hooks/useTopSongsData';
import { ShowHeader } from './setlistgame/ShowHeader';
import { StandingsTable } from './setlistgame/StandingsTable';
import { PicksSection } from './setlistgame/PicksSection';
import { TopPicksSection } from './setlistgame/TopPicksSection';
import { SetlistGameLoading } from './SetlistGameLoading';

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

export function SetlistGameShowPage() {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const [activeSongSelectionShow, setActiveSongSelectionShow] = useState<GameShow | null>(null);
  const [userPicks, setUserPicks] = useState<UserPick[]>([]);
  const [viewMode, setViewMode] = useState(true);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: []
  });
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activePill, setActivePill] = useState<'songs' | 'openers' | 'closers'>('songs');

  // Use custom hooks for data fetching
  const { loading, show, standings, totalPlayers, userSubmission } = useSetlistGameShowData(showId, user);
  const topSongs = useTopSongsData(showId);
  const topOpeners = useTopOpenersData(showId);
  const topClosers = useTopClosersData(showId);

  // Load picks for viewing (either for the current user or another user)
  const fetchUserPicks = async (submissionId?: string) => {
    const targetSubmissionId = submissionId || userSubmission;

    if (!targetSubmissionId) return [];

    try {
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
    }
  };

  // Handle making new picks
  const handleMakePicks = async () => {
    if (!user || !showId || !show) {
      return;
    }

    setViewMode(false);

    if (userSubmission) {
      await fetchUserPicks();
      setActiveSongSelectionShow({
        ...show,
        submission_id: userSubmission
      });
    } else {
      setUserPicks([]);
      setActiveSongSelectionShow(show);
    }
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setActiveSongSelectionShow(null);
    setUserPicks([]);
    setViewMode(false);
    setViewingUserId(null);
  };

  // Handle viewing current user's submission
  const handleViewSubmission = async () => {
    if (!user || !userSubmission || !show) {
      return;
    }

    try {
      setViewingUserId(null);
      await fetchUserPicks();

      const { data: submissionData, error: submissionError } = await supabase
        .from('setlist_game_submissions')
        .select('score, total_songs_picked, total_songs_played')
        .eq('submission_id', userSubmission)
        .single();

      if (submissionError) {
        console.error('Error fetching submission:', submissionError);
      }

      setSubmissionDetails({
        totalScore: submissionData?.score || 0,
        songsPicked: submissionData?.total_songs_picked || 0,
        songsPlayed: submissionData?.total_songs_played || 0,
        setlist: []
      });

      setViewMode(true);
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

    if (!user) {
      alert("Please log in to view user submissions");
      return;
    }

    try {
      setViewingUserId(userId);

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

      await fetchUserPicks(submissionData.submission_id);

      setSubmissionDetails({
        totalScore: submissionData.score || 0,
        songsPicked: submissionData.total_songs_picked || 0,
        songsPlayed: submissionData.total_songs_played || 0,
        setlist: [],
        username: username
      });

      setViewMode(true);
      setActiveSongSelectionShow(show);

    } catch (error) {
      console.error('Error in view other user submission:', error);
    }
  };

  return (
    <div className="max-w-[1024px]">
      {loading ? (
        <SetlistGameLoading />
      ) : show ? (
        <div className="space-y-4">
          <ShowHeader 
            show={show}
            totalPlayers={totalPlayers}
            userSubmission={userSubmission}
            user={user}
            onViewSubmission={handleViewSubmission}
            tours={show.tours}
          />

          {show.show_scored ? (
            <StandingsTable 
              standings={standings}
              user={user}
              onViewOtherUserSubmission={handleViewOtherUserSubmission}
            />
          ) : (
            <PicksSection 
              show={show}
              user={user}
              userSubmission={userSubmission}
              onMakePicks={handleMakePicks}
            />
          )}

          <TopPicksSection 
            topSongs={topSongs}
            topOpeners={topOpeners}
            topClosers={topClosers}
            activePill={activePill}
            onPillChange={setActivePill}
          />
        </div>
      ) : (
        <div className="bg-primary border border-fourth rounded-lg p-3 text-center">
          <p className="text-fifth text-[0.625rem]">Show not found.</p>
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