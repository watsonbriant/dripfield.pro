import React from 'react';
import { SongSearch } from './SongSearch';

interface SongHeaderProps {
  songName: string;
}

export function SongHeader({ songName }: SongHeaderProps) {
  return (
    <div className="mb-4">
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="bg-fourth text-white py-0.5 pr-1 flex justify-between items-center">
          <h2 className="text-sm font-semibold pl-2">
            {songName}
          </h2>
          <SongSearch />
        </div>
      </div>
    </div>
  );
}
