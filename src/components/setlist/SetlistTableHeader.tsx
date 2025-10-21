import React from 'react';
import { User } from 'lucide-react';
import { Show } from '../../types/setlist';
import { getGridClass } from '../../utils/setlistUtils';

interface SetlistTableHeaderProps {
  show: Show | undefined;
}

export const SetlistTableHeader: React.FC<SetlistTableHeaderProps> = ({ show }) => {
  // Early return if show is undefined
  if (!show) {
    return (
      <div className="grid grid-cols-[32px_minmax(200px,1fr)_50px_30px] gap-4 text-fifth text-sm pr-2 py-1 bg-fourth/40 font-medium">
        <div className="w-8 text-center">#</div>
        <div>Song</div>
        <div className="text-center">Time</div>
        <div className="flex justify-end">
          <User strokeWidth={2} className="text-fifth w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${getGridClass(show.show_canonid)} text-fifth text-sm pr-2 py-1 bg-fourth/40 font-medium`}>
      <div className="w-8 text-center">#</div>
      <div>Song</div>
      <div className="text-center">Time</div>
      {show.show_canonid !== null && (
        <>
          <div className="text-center">Last</div>
          <div className="text-center">Tour</div>
          <div className="text-center">Rarity</div>
        </>
      )}
      <div className="flex justify-end">
        <User strokeWidth={2} className="text-fifth w-5 h-5" />
      </div>
    </div>
  );
};
