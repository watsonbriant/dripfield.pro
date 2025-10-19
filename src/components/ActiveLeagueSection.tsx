import React from 'react';
import { ListMusic } from 'lucide-react';
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
    <div className="bg-primary border border-secondary rounded-lg p-3 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
          <ListMusic className="w-5 h-5 mr-2" />
          <span>Active League</span>
        </h2>
        <span className="px-3 py-1 text-sm font-medium rounded-lg bg-secondary text-fifth border border-secondary">
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