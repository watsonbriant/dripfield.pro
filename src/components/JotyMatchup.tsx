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

  // Clean song names for display
  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

  return (
    <div>
      <div className="bg-canvas border border-secondary/50 rounded-lg overflow-hidden">
        <div 
          className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
            team1.percentage > team2.percentage ? 'font-bold bg-tertiary/80' : ''
          }`}
          onClick={handleTeamClick}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-primary px-1 py-0.5 rounded w-6 font-medium text-center`}>
                {team1.seed}
              </span>
              <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(team1.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              {team1.date && (
                <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {team1.date}
                </span>
              )}
              <span className="text-fifth font-semibold">{team1.percentage}%</span>
            </div>
          </div>
        </div>
        <div 
          className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
            team2.percentage > team1.percentage ? 'font-bold bg-tertiary/80' : ''
          }`}
          onClick={handleTeamClick}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-primary px-1 py-0.5 rounded w-6 font-medium text-center`}>
                {team2.seed}
              </span>
              <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(team2.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              {team2.date && (
                <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                  {team2.date}
                </span>
              )}
              <span className="text-fifth font-semibold">{team2.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matchup;
export type { Team, MatchupProps };
