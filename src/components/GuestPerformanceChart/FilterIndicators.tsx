import React from 'react';

interface FilterIndicatorsProps {
  selectedGroup: string | null;
  selectedSong: string | null;
}

export default function FilterIndicators({ selectedGroup, selectedSong }: FilterIndicatorsProps) {
  if (!selectedGroup && !selectedSong) return null;

  return (
    <div className="flex items-center gap-2">
      {selectedSong && (
        <span className="font-medium text-white border border-fourth bg-fourth px-1 rounded text-[0.625rem]">
          {selectedSong}
        </span>
      )}
      {selectedGroup && (
        <span className="font-medium text-white border border-fourth bg-fourth px-1 rounded text-[0.625rem]">
          {selectedGroup}
        </span>
      )}
    </div>
  );
}
