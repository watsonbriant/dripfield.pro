import React from 'react';
import { SongsPlayed } from './SongsPlayed';
import { CircularProgress } from './ui/CircularProgress';

interface GuestSongsSectionProps {
  PersonnelID: string | undefined;
  isLoading: boolean;
  selectedSong: string | null;
  onSongClick: (song: string) => void;
  songs: any[];
  songSpreadData: any[];
  loadingProgress: number;
}

export const GuestSongsSection: React.FC<GuestSongsSectionProps> = ({
  PersonnelID,
  isLoading,
  selectedSong,
  onSongClick,
  songs,
  songSpreadData,
  loadingProgress
}) => {
  return (
    <div className="h-full">
      <div className="bg-primary border border-fourth w-full h-full shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h3 className="text-sm font-semibold">Songs Played</h3>
        </div>
        <div className="px-2 py-1 max-h-[350px] overflow-y-auto">
          <SongsPlayed 
            PersonnelID={PersonnelID} 
            isLoading={isLoading} 
            selectedSong={selectedSong}
            onSongClick={onSongClick}
            CircularProgress={CircularProgress}
            songs={songs}
            songSpreadData={songSpreadData}
            loadingProgress={loadingProgress}
          />
        </div>
      </div>
    </div>
  );
};
