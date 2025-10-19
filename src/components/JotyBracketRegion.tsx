import React from 'react';
import Matchup, { Team } from './JotyMatchup';

interface Match {
  game: number;
  team1: Team;
  team2: Team;
}

interface Region {
  name: string;
  color: string;
  priorityLevel: number;
}

interface BracketRegionProps {
  region: Region;
  matches: Match[];
  onMatchupClick: (team1: Team, team2: Team, regionColor: string) => void;
}

const BracketRegion: React.FC<BracketRegionProps> = ({ region, matches, onMatchupClick }) => {
  // Helper function to get a specific match by game number
  const getMatch = (gameNumber: number): Match | undefined => {
    return matches.find(m => m.game === gameNumber);
  };

  return (
    <div key={region?.priorityLevel || Math.random()}>
      <h2 className={`text-lg font-semibold ${region?.color || 'bg-gray-500'} ${region?.priorityLevel > 1 ? 'text-primary' : 'text-primary'} inline-block px-2 py-0.5 rounded-lg border border-secondary mb-2`}>
        {region?.name || 'Loading...'} Region
      </h2>
      
      {/* Round headers row */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <h3 className="text-center text-xs font-semibold text-fifth min-w-[270px]">Round of 64</h3>
        <h3 className="text-center text-xs font-semibold text-fifth min-w-[270px]">Round of 32</h3>
        <h3 className="text-center text-xs font-semibold text-fifth min-w-[270px]">Sweet 16</h3>
        <h3 className="text-center text-xs font-semibold text-fifth min-w-[270px]">Elite 8</h3>
      </div>
      
      {/* Matches grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Round of 64 */}
        <div className="space-y-1 min-w-[270px]">
          {(() => {
            const startGame = ((region?.priorityLevel || 1) - 1) * 8 + 1;
            const games = Array.from({length: 8}, (_, i) => startGame + i);
            return games.map((gameNum) => {
              const match = getMatch(gameNum);
              if (!match) return <div key={gameNum} className="h-[52px]"></div>;
              return (
                <Matchup
                  key={gameNum}
                  team1={match.team1}
                  team2={match.team2}
                  roundName="Round of 64"
                  matchNumber={gameNum}
                  regionColor={region?.color || 'bg-gray-500'}
                  onMatchupClick={onMatchupClick}
                />
              );
            });
          })()}
        </div>
        
        {/* Round of 32 */}
        <div className="space-y-[55px] min-w-[270px] flex flex-col justify-center h-full">
          {(() => {
            const startGame = 33 + ((region?.priorityLevel || 1) - 1) * 4;
            const games = Array.from({length: 4}, (_, i) => startGame + i);
            return games.map((gameNum, idx) => (
              <div key={gameNum}>
                {(() => {
                  const match = getMatch(gameNum);
                  if (!match) return <div className="h-[52px]"></div>;
                  return (
                    <Matchup
                      team1={match.team1}
                      team2={match.team2}
                      roundName="Round of 32"
                      matchNumber={gameNum}
                      regionColor={region?.color || 'bg-gray-500'}
                      onMatchupClick={onMatchupClick}
                    />
                  );
                })()}
              </div>
            ));
          })()}
        </div>
        
        {/* Sweet 16 */}
        <div className="space-y-[159px] min-w-[270px] flex flex-col justify-center h-full">
          {(() => {
            const startGame = 49 + ((region?.priorityLevel || 1) - 1) * 2;
            const games = Array.from({length: 2}, (_, i) => startGame + i);
            return games.map((gameNum, idx) => (
              <div key={gameNum}>
                {(() => {
                  const match = getMatch(gameNum);
                  if (!match) return <div className="h-[52px]"></div>;
                  return (
                    <Matchup
                      team1={match.team1}
                      team2={match.team2}
                      roundName="Sweet 16"
                      matchNumber={gameNum}
                      regionColor={region?.color || 'bg-gray-500'}
                      onMatchupClick={onMatchupClick}
                    />
                  );
                })()}
              </div>
            ));
          })()}
        </div>
        
        {/* Elite 8 */}
        <div className="space-y-1 min-w-[270px] flex flex-col justify-center h-full">
          {(() => {
            const gameNum = 57 + ((region?.priorityLevel || 1) - 1);
            const match = getMatch(gameNum);
            if (!match) return <div className="h-[52px]"></div>;
            return (
              <Matchup
                team1={match.team1}
                team2={match.team2}
                roundName="Elite 8"
                matchNumber={gameNum}
                regionColor={region?.color || 'bg-gray-500'}
                onMatchupClick={onMatchupClick}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default BracketRegion;
export type { Match, Region };
