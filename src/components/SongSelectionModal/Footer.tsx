import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { SongPick, SongSelectionModalProps } from './types';

interface FooterProps {
  viewMode: boolean;
  show_scored?: boolean;
  submissionDetails?: SongSelectionModalProps['submissionDetails'];
  rawPointsTotal: number;
  songPicks: SongPick[];
  totalSongsSelected: number;
  submitting: boolean;
  success: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onClearSelections: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  viewMode,
  show_scored,
  submissionDetails,
  rawPointsTotal,
  songPicks,
  totalSongsSelected,
  submitting,
  success,
  isEditing,
  onClose,
  onSubmit,
  onClearSelections
}) => {
  if (viewMode) {
    return (
      <div className="w-full flex flex-col items-center">
        {/* Show raw points and penalties for scored shows */}
        {viewMode && show_scored && (
          <div className="w-full text-center mb-3">
            {/* Raw score display */}
            <div className="text-sm text-fifth font-semibold">
              Selection score: <span className="font-medium text-primary bg-green-600 rounded-lg py-1 px-1.5 ml-1.5">{rawPointsTotal} points</span>
            </div>
            
            {/* Penalty information - now positioned below raw score */}
            {submissionDetails && submissionDetails.songsPicked > submissionDetails.songsPlayed && (
              <div className="text-xs text-fifth font-semibold mt-2">
                {` ${submissionDetails.songsPicked - submissionDetails.songsPlayed === 1 
                  ? "1 extra song picked" 
                  : `${submissionDetails.songsPicked - submissionDetails.songsPlayed} extra songs picked`}:`}
                <span className="font-medium text-primary bg-red-600 rounded-lg py-1 px-1.5 ml-1.5">
                  {`-${(submissionDetails.songsPicked - submissionDetails.songsPlayed) * 3} points`}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* View Mode Footer Buttons */}
        <div className="flex space-x-3">
          {/* Close button */}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-600/80 text-primary flex items-center gap-2 font-medium rounded-md transition-colors border border-secondary"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile view: stacked layout */}
      <div className="block md:hidden w-full">
        <div className="flex justify-center mb-3">
          <div className="text-fifth font-semibold text-sm">
            {totalSongsSelected} song{totalSongsSelected !== 1 ? 's' : ''} selected
          </div>
        </div>
        <div className="flex justify-center items-center space-x-2">
          {songPicks.length > 0 && (
            <button
              onClick={onClearSelections}
              className="px-3 py-2 bg-red-600 border border-secondary hover:bg-red-700 text-primary font-medium rounded-md transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
          
          <button
            onClick={onSubmit}
            disabled={songPicks.length === 0 || submitting || success}
            className="px-3 py-2 bg-green-600 border border-secondary hover:bg-green-600/80 text-primary font-medium rounded-md transition-colors disabled:bg-black/50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>...</span>
              </>
            ) : success ? (
              <span>Done!</span>
            ) : (
              <>
                <span>{isEditing ? 'Update' : 'Submit'}</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Desktop view: remains the same */}
      <div className="hidden md:flex md:justify-between md:items-center">
        <div className="flex items-center gap-3">
          <div className="text-fifth font-semibold text-sm">
            {totalSongsSelected} song{totalSongsSelected !== 1 ? 's' : ''} selected
          </div>
          {songPicks.length > 0 && (
            <button
              onClick={onClearSelections}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-primary border border-secondary font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Selections</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSubmit}
            disabled={songPicks.length === 0 || submitting || success}
            className="px-4 py-2 bg-green-600 hover:bg-green-600/80 border border-secondary text-primary font-medium rounded-md transition-colors disabled:bg-green-600/50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : success ? (
              <span>Submitted!</span>
            ) : (
              <>
                <span>{isEditing ? 'Update Picks' : 'Submit Picks'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
