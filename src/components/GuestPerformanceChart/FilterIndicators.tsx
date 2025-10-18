import React from 'react';
import { cleanSongName } from './utils';

interface FilterIndicatorsProps {
  selectedGroup: string | null;
  selectedSong: string | null;
}

export default function FilterIndicators({ selectedGroup, selectedSong }: FilterIndicatorsProps) {
  if (!selectedGroup && !selectedSong) return null;

  return (
    <div className="flex items-center text-xs text-fifth tooltip-bubble">
      {selectedSong && (
        <span className="font-trad text-sm text-fifth border border-secondary bg-tertiary leading-[1rem] px-1 pb-0.5 rounded mr-2">
          {cleanSongName(selectedSong)}
        </span>
      )}
      {selectedGroup && (
        <span className="font-medium text-fifth border border-secondary bg-tertiary leading-[1rem] px-1 py-0.5 rounded">
          {selectedGroup}
        </span>
      )}
    </div>
  );
}
