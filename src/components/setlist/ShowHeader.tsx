import React from 'react';
import { Plus } from 'lucide-react';
import { ShowData } from '../../types/setlist';
import { formatDate } from '../../utils/setlistUtils';

interface ShowHeaderProps {
  selectedShow: ShowData;
  onCreateNewEntry: () => void;
}

export const ShowHeader: React.FC<ShowHeaderProps> = ({
  selectedShow,
  onCreateNewEntry
}) => {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <h4 className="text-lg text-fifth font-medium">
          {formatDate(selectedShow.show_date)}
          &nbsp;[{selectedShow.show_group}]
        </h4>
        <div className="text-sm text-fifth/70 font-light">
          {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
        </div>
      </div>
      
      <button
        onClick={onCreateNewEntry}
        className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-fourth hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-white"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};
