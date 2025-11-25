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
    <div className="flex items-center justify-between px-0.5 py-0.5 bg-tertiary text-fifth">
      <h2 className="text-sm font-semibold ml-1.5 mr-4">
        {viewMode 
          ? (show_scored ? 'Setlist Game Results' : 'Your Setlist Picks')
          : (isEditing ? 'Edit Setlist Picks' : 'Select Setlist')}
      </h2>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-fifth" />
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
    <div className="px-2 py-1 border-b border-fourth bg-primary">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="text-center md:text-left">
          <h3 className="text-fifth font-medium text-xs">
            {formatDate(show.show_date)} — {show.show_subvenue}
          </h3>
          <p className="text-fifth font-light text-[0.625rem]">
            {show.show_venue_location}
          </p>
        </div>
        {viewMode && show_scored && submissionDetails ? (
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
            <h2 className="text-xs font-semibold bg-green-600 text-white inline-block px-2 py-0.5 rounded border border-fourth">
              {submissionDetails.totalScore} points
            </h2>
          </div>
        ) : viewMode && isSelectionClosed ? (
          <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">
              Awaiting results
            </span>
          </div>
        ) : (
          <div className="mt-0.5 md:mt-0 flex justify-center md:justify-end">
            {isSelectionClosed ? (
              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs border border-fourth/30">
                Picks closed
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs border border-fourth/30">
                {timeRemaining} left to submit
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
