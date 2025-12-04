import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SongSelectionModal } from './SongSelectionModal';
import { SetlistGameRulesModal } from './SetlistGameRulesModal';
import { SetlistGameStandings } from './SetlistGameStandings';
import { PastTours } from './PastTours';
import { SetlistGameShows } from './SetlistGameShows';
import { ScoringModal } from './ScoringModal';
import { SetlistGameHeader } from './SetlistGameHeader';
import { LoginPrompt } from './LoginPrompt';
import { ActiveLeagueSection } from './ActiveLeagueSection';
import { SetlistGameLoading } from './SetlistGameLoading';
import { useGameShows } from '../hooks/useGameShows';
import { useShowStatistics } from '../hooks/useShowStatistics';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { useUserPicks } from '../hooks/useUserPicks';
import { GameShow } from '../hooks/useGameShows';

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
  const [activeLeague] = useState("2025 Holiday Run");
  const { user } = useAuth();
  const [activeSongSelectionShow, setActiveSongSelectionShow] = useState<GameShow | null>(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails>({
    totalScore: 0,
    songsPicked: 0,
    songsPlayed: 0,
    setlist: []
  });

  // Use custom hooks
  const { loading, gameShows, fetchGameShows } = useGameShows(activeLeague, user);
  const { showStatsLoading, showsWithStats } = useShowStatistics(activeLeague);
  const isAdminUser = useAdminStatus(user);
  const { userPicks, fetchUserPicks, resetPicks, setUserPicks } = useUserPicks();

  // Handle opening the song selection modal
  const handleSelectSongs = async (show: GameShow) => {
    setViewMode(false);

    if (show.submission_id && user) {
      await fetchUserPicks(show.show_id, user);
    } else {
      resetPicks();
    }

    setActiveSongSelectionShow(show);
  };

  // Handle closing the song selection modal
  const handleCloseModal = () => {
    setActiveSongSelectionShow(null);
    resetPicks();
    setViewMode(false);
  };

  const handleViewSubmission = async (show: GameShow) => {
    if (!user || !show.submission_id) {
      return;
    }

    try {
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
    }
  };

  const handleScoringComplete = () => {
    fetchGameShows();
  };

  return (
    <>
      <Helmet>
        <title>Echo of a Show — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px]">
      <SetlistGameHeader 
        isAdminUser={isAdminUser}
        onShowRules={() => setShowRulesModal(true)}
        onShowScoring={() => setShowScoringModal(true)}
      />

      {loading ? (
        <SetlistGameLoading />
      ) : (
        <div className="space-y-4">
          {!user && <LoginPrompt />}
          
          <ActiveLeagueSection 
            activeLeague={activeLeague}
            gameShows={gameShows}
            user={user}
            onSelectSongs={handleSelectSongs}
            onViewSubmission={handleViewSubmission}
          />
          
          <SetlistGameStandings activeLeague={activeLeague} user={user} />
          <SetlistGameShows gameShows={showsWithStats} loading={showStatsLoading} />
          <PastTours currentLeague={activeLeague} />
        </div>
      )}

      {/* Song Selection Modal */}
      {activeSongSelectionShow && (
        <SongSelectionModal
          isOpen={!!activeSongSelectionShow}
          onClose={handleCloseModal}
          show={activeSongSelectionShow as any}
          existingPicks={userPicks}
          isEditing={!!activeSongSelectionShow.submission_id && !viewMode}
          viewMode={viewMode}
          submissionDetails={viewMode ? submissionDetails : undefined}
        />
      )}

      {/* Scoring Modal */}
      <ScoringModal
        isOpen={showScoringModal}
        onClose={() => setShowScoringModal(false)}
        gameShows={gameShows}
        onScoringComplete={handleScoringComplete}
      />

      {/* Rules Modal */}
      <SetlistGameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
    </>
  );
}