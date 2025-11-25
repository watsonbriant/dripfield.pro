import React from 'react';
import { ShowTable } from './ShowTable';
import { GameShow } from '../hooks/useGameShows';

interface ActiveLeagueSectionProps {
  activeLeague: string;
  gameShows: GameShow[];
  user: any;
  onSelectSongs: (show: GameShow) => void;
  onViewSubmission: (show: GameShow) => void;
}

export function ActiveLeagueSection({ 
  activeLeague, 
  gameShows, 
  user, 
  onSelectSongs, 
  onViewSubmission 
}: ActiveLeagueSectionProps) {
  return (
    <div className="bg-primary border border-fourth">
      <div className="bg-tertiary text-fifth px-2 py-0.5 flex gap-2 items-center">
        <h2 className="text-sm font-semibold">
          Active League
        </h2>
        <span className="text-fifth font-medium text-[0.625rem] bg-fourth text-white border border-fourth rounded px-1 whitespace-nowrap">
          {activeLeague}
        </span>
      </div>

      <ShowTable 
        gameShows={gameShows}
        user={user}
        onSelectSongs={onSelectSongs}
        onViewSubmission={onViewSubmission}
      />
    </div>
  );
}