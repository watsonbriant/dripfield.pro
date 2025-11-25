import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SongSelectionModalProps } from './types';
import { useSongSelection } from './hooks';
import { useSetlistOperations } from './hooks';
import { createSongOperations } from './operations';
import { createSubmissionHandler } from './submission';
import { ModalHeader, StatusDisplay } from './Header';
import { SongSelector } from './SongSelector';
import { SetlistDisplay } from './SetlistDisplay';
import { Footer } from './Footer';

export function SongSelectionModal({ 
  isOpen, 
  onClose, 
  show, 
  existingPicks = [], 
  isEditing = false,
  viewMode = false,
  submissionDetails
}: SongSelectionModalProps) {
  const { user } = useAuth();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  const {
    songs,
    loading,
    selectedSong,
    setSelectedSong,
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    submitting,
    setSubmitting,
    error,
    setError,
    success,
    setSuccess,
    rawPointsTotal,
    actualSetlist,
    showActualSetlist,
    setShowActualSetlist,
    showInfo,
    calculateTimeRemainingCallback
  } = useSongSelection({ isOpen, onClose, show, existingPicks, isEditing, viewMode, submissionDetails });

  const {
    canAddSetBreak,
    canAddEncoreBreak,
    updatePlacements,
    renumberSongPicks
  } = useSetlistOperations(songPicks, setSongPicks);

  const {
    handleAddSong,
    handleAddNewOriginalSong,
    handleAddNewCoverSong,
    handleAddSetBreak,
    handleAddEncoreBreak,
    handleRemoveSong,
    handleRemoveSet,
    moveSongUp,
    moveSongDown
  } = createSongOperations(
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    setError,
    canAddSetBreak,
    canAddEncoreBreak,
    renumberSongPicks
  );

  const handleSubmit = createSubmissionHandler(
    user,
    show,
    songPicks,
    isEditing,
    setSubmitting,
    setError,
    setSuccess,
    onClose
  );

  const handleClearSelections = () => {
    setSongPicks([]);
    setCurrentSet('1');
    setNextSetNum(1);
    setError(null);
  };

  const handleAddSongWrapper = () => {
    handleAddSong(selectedSong);
    setSelectedSong('');
  };

  // Total number of songs selected (excluding breaks)
  const totalSongsSelected = songPicks.filter(pick => !pick.isBreak).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Custom Modal - centered in viewport */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        
        {/* Header */}
        <ModalHeader
          show={show}
          viewMode={viewMode}
          isEditing={isEditing}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
          onClose={onClose}
        />
        
        {/* Status display */}
        <StatusDisplay
          show={show}
          viewMode={viewMode}
          show_scored={show.show_scored}
          submissionDetails={submissionDetails}
          isSelectionClosed={showInfo.isSelectionClosed}
          timeRemaining={showInfo.timeRemaining}
        />
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2 pt-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
                <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-fifth mt-4 text-xs">Loading songs...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="bg-green-500/20 text-fifth px-2 py-1 rounded-lg text-xs">
                Your song selections have been {isEditing ? 'updated' : 'submitted'} successfully!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Only show song selection UI if not in view mode */}
              {!viewMode && (
                <SongSelector
                  songs={songs}
                  selectedSong={selectedSong}
                  setSelectedSong={setSelectedSong}
                  onAddSong={handleAddSongWrapper}
                  onAddNewOriginalSong={handleAddNewOriginalSong}
                  onAddNewCoverSong={handleAddNewCoverSong}
                  onAddSetBreak={handleAddSetBreak}
                  onAddEncoreBreak={handleAddEncoreBreak}
                  canAddSetBreak={canAddSetBreak()}
                  canAddEncoreBreak={canAddEncoreBreak()}
                  error={error}
                />
              )}
              
              {/* Selected songs list */}
              <div>
                <SetlistDisplay
                  songPicks={songPicks}
                  actualSetlist={actualSetlist}
                  showActualSetlist={showActualSetlist}
                  setShowActualSetlist={setShowActualSetlist}
                  viewMode={viewMode}
                  show_scored={show.show_scored}
                  isSelectionClosed={showInfo.isSelectionClosed}
                  onRemoveSong={handleRemoveSong}
                  onMoveSongUp={moveSongUp}
                  onMoveSongDown={moveSongDown}
                  onRemoveSet={handleRemoveSet}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer actions */}
        <div className="px-2 py-0.5 border-t bg-tertiary text-fifth border-fourth">
          <Footer
            viewMode={viewMode}
            show_scored={show.show_scored}
            submissionDetails={submissionDetails}
            rawPointsTotal={rawPointsTotal}
            songPicks={songPicks}
            totalSongsSelected={totalSongsSelected}
            submitting={submitting}
            success={success}
            isEditing={isEditing}
            onClose={onClose}
            onSubmit={handleSubmit}
            onClearSelections={handleClearSelections}
          />
        </div>
        </div>
      </div>
    </>
  );
}
