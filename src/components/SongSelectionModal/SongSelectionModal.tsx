import React from 'react';
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
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 inset-y-4 md:inset-x-auto md:inset-y-auto md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col md:h-auto md:max-h-[90vh] md:w-[min(1000px,calc(100vw-32px))]">
        
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
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-[#fce7ca]/70 mt-4 text-sm">Loading songs...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="bg-green-500/20 text-fifth px-4 py-3 rounded-lg">
                Your song selections have been {isEditing ? 'updated' : 'submitted'} successfully!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
        <div className="p-3 border-t bg-canvas border-secondary rounded-b-lg">
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
    </>
  );
}
