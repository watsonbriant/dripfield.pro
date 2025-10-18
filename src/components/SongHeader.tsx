import React from 'react';
import { SongSearch } from './SongSearch';
import { cleanSongName } from '../utils/songUtils';

interface SongHeaderProps {
  songName: string;
}

export function SongHeader({ songName }: SongHeaderProps) {
  return (
    <div className="flex justify-between">
      <h2 className="text-2xl font-trad bg-tertiary text-fifth inline-block mr-4 px-4 pt-0.5 pb-1.5 rounded-lg border border-secondary mb-6">
        {cleanSongName(songName)}
      </h2>
      <SongSearch />
    </div>
  );
}
