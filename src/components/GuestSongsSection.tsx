import React from 'react';
import { SongsPlayed } from './SongsPlayed';
import { CircularProgress } from './ui/CircularProgress';

interface GuestSongsSectionProps {
  PersonnelID: string | undefined;
  isLoading: boolean;
  selectedSong: string | null;
  onSongClick: (song: string) => void;
  cleanSongName: (songName: string) => string;
  songs: any[];
  songSpreadData: any[];
  loadingProgress: number;
}

export const GuestSongsSection: React.FC<GuestSongsSectionProps> = ({
  PersonnelID,
  isLoading,
  selectedSong,
  onSongClick,
  cleanSongName,
  songs,
  songSpreadData,
  loadingProgress
}) => {
  return (
    <div className="h-full">
      <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full">
        <div className="text-fifth text-base font-medium">Songs Played</div>
        <div className="max-h-[350px] overflow-y-auto">
          <SongsPlayed 
            PersonnelID={PersonnelID} 
            isLoading={isLoading} 
            selectedSong={selectedSong}
            onSongClick={onSongClick}
            CircularProgress={CircularProgress}
            cleanSongName={cleanSongName}
            songs={songs}
            songSpreadData={songSpreadData}
            loadingProgress={loadingProgress}
          />
        </div>
      </div>
    </div>
  );
};
