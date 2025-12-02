import React from 'react';

interface Team {
  seed: number;
  name: string;
  percentage: number;
  entryId?: string;
  date?: string;
  venue?: string; 
  entryShort?: string | null; 
  subvenue?: string | null;
  fullDate?: string;
  songId?: string | null;
  showId?: string | null;
  venueId?: string | null;
}

interface MatchupProps {
  team1: Team;
  team2: Team;
  roundName: string;
  matchNumber: number;
  regionColor: string;
  onMatchupClick: (team1: Team, team2: Team, regionColor: string) => void;
}

const Matchup: React.FC<MatchupProps> = ({ team1, team2, roundName, matchNumber, regionColor, onMatchupClick }) => {
  const handleTeamClick = () => {
    onMatchupClick(team1, team2, regionColor);
  };

  return (
    <div>
      <div className="bg-tertiary/10 border border-fourth overflow-hidden shadow-xl">
        <div 
          className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
            team1.percentage > team2.percentage ? 'bg-tertiary/80' : ''
          }`}
          onClick={handleTeamClick}
        >
          <div className="flex justify-between items-center gap-2 text-[0.625rem]">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs`}>
                {team1.seed}
              </span>
              <span className="text-fifth font-medium">{team1.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team1.date && (
                <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                  {team1.date}
                </span>
              )}
              <span className="text-fifth font-medium">{team1.percentage}%</span>
            </div>
          </div>
        </div>
        <div 
          className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
            team2.percentage > team1.percentage ? 'bg-tertiary/80' : ''
          }`}
          onClick={handleTeamClick}
        >
          <div className="flex justify-between items-center gap-2 text-[0.625rem]">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs`}>
                {team2.seed}
              </span>
              <span className="text-fifth font-medium">{team2.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team2.date && (
                <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                  {team2.date}
                </span>
              )}
              <span className="text-fifth font-medium">{team2.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchup;
export type { Team, MatchupProps };
