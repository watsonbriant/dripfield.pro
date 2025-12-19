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
    <div className="mb-2 flex px-2 items-center justify-between">
      <div>
        <h4 className="text-sm text-fifth font-medium">
          {formatDate(selectedShow.show_date)}
          &nbsp;[{selectedShow.show_group}]
        </h4>
        <div className="text-xs text-fifth font-light">
          {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
        </div>
      </div>
      
      <button
        onClick={onCreateNewEntry}
        className="flex items-center gap-2 bg-fourth text-fifth px-1 py-1 rounded border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium text-white"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
