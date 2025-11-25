import React from 'react';
import { X, Trash2, Check } from 'lucide-react';
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
          <div className="w-full text-center my-1">
            {/* Raw score display */}
            <div className="text-xs text-fifth font-semibold">
              Selection score: <span className="font-medium text-white bg-green-600 rounded py-0.5 px-1 ml-1">{rawPointsTotal} points</span>
            </div>
            
            {/* Penalty information - now positioned below raw score */}
            {submissionDetails && submissionDetails.songsPicked > submissionDetails.songsPlayed && (
              <div className="text-[0.625rem] text-fifth font-semibold mt-1">
                {` ${submissionDetails.songsPicked - submissionDetails.songsPlayed === 1 
                  ? "1 extra song picked" 
                  : `${submissionDetails.songsPicked - submissionDetails.songsPlayed} extra songs picked`}:`}
                <span className="font-medium text-white bg-red-600 rounded py-0.5 px-1 ml-1">
                  {`-${(submissionDetails.songsPicked - submissionDetails.songsPlayed) * 3} points`}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* View Mode Footer Buttons */}
        <div className="flex gap-2 justify-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-red-600 hover:bg-primary text-white hover:text-fifth flex items-center gap-1 font-medium rounded border border-fourth transition-colors text-xs"
          >
            <X className="w-3 h-3" />
            <span>Close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="text-fifth font-semibold text-xs">
          {totalSongsSelected} song{totalSongsSelected !== 1 ? 's' : ''} selected
        </div>
        {songPicks.length > 0 && (
          <button
            onClick={onClearSelections}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white border border-fourth font-medium rounded transition-colors flex items-center gap-1 text-xs"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden md:inline">Clear Selections</span>
            <span className="md:hidden">Clear</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={songPicks.length === 0 || submitting || success}
          className="px-2 py-1 bg-green-600 hover:bg-green-600/80 border border-fourth text-white font-medium rounded transition-colors disabled:bg-green-600/50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
        >
          {submitting ? (
            <>
              <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              <span>Submitting...</span>
            </>
          ) : success ? (
            <>
              <Check className="w-3 h-3" />
              <span>Submitted!</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3" />
              <span className="hidden md:inline">{isEditing ? 'Update Picks' : 'Submit Picks'}</span>
              <span className="md:hidden">{isEditing ? 'Update' : 'Submit'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
