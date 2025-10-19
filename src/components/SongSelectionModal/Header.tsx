import React from 'react';
import { X } from 'lucide-react';
import { SongSelectionModalProps } from './types';
import { formatDate } from './utils';

interface ModalHeaderProps {
  show: SongSelectionModalProps['show'];
  viewMode: boolean;
  isEditing: boolean;
  show_scored?: boolean;
  submissionDetails?: SongSelectionModalProps['submissionDetails'];
  isSelectionClosed?: boolean;
  timeRemaining?: string;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  show,
  viewMode,
  isEditing,
  show_scored,
  submissionDetails,
  isSelectionClosed,
  timeRemaining,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-secondary">
      <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
        {viewMode 
          ? (show_scored ? 'Setlist Game Results' : 'Your Setlist Picks')
          : (isEditing ? 'Edit Setlist Picks' : 'Select Setlist')}
      </h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors"
      >
        <X className="w-5 h-5 text-fifth/70" />
      </button>
    </div>
  );
};

interface StatusDisplayProps {
  show: SongSelectionModalProps['show'];
  viewMode: boolean;
  show_scored?: boolean;
  submissionDetails?: SongSelectionModalProps['submissionDetails'];
  isSelectionClosed?: boolean;
  timeRemaining?: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  show,
  viewMode,
  show_scored,
  submissionDetails,
  isSelectionClosed,
  timeRemaining
}) => {
  return (
    <div className="px-3 py-2 border-b border-secondary bg-canvas">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="text-center md:text-left">
          <h3 className="text-fifth font-medium">
            {formatDate(show.show_date)} — {show.show_subvenue}
          </h3>
          <p className="text-fifth/70 font-light text-sm">
            {show.show_venue_location}
          </p>
        </div>
        {viewMode && show_scored && submissionDetails ? (
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
            <h2 className="text-base font-semibold bg-green-600 text-primary inline-block px-3 py-1 rounded-lg border border-secondary">
              {submissionDetails.totalScore} points
            </h2>
          </div>
        ) : viewMode && isSelectionClosed ? (
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
            <span className="px-3 py-1.5 bg-blue-600 text-primary rounded-md text-sm font-medium">
              Awaiting results
            </span>
          </div>
        ) : (
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
            {isSelectionClosed ? (
              <span className="px-2 py-1 bg-red-500/20 text-red-700 rounded-md text-xs border border-red-500/30">
                Picks closed
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-500/20 text-green-700 rounded-md text-xs border border-green-500/30">
                {timeRemaining} left to submit
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
