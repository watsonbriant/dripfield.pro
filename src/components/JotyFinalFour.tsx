import React from 'react';
import { Team, Match } from './JotyBracketRegion';
import ChampionBox from './JotyChampionBox';

interface FinalFourProps {
  matches: Match[];
  selectedYear: number;
  onMatchupClick: (team1: Team, team2: Team, regionColor: string, team1Color?: string, team2Color?: string) => void;
}

const FinalFour: React.FC<FinalFourProps> = ({ matches, selectedYear, onMatchupClick }) => {
  // Helper function to get a specific match by game number
  const getMatch = (gameNumber: number): Match | undefined => {
    return matches.find(m => m.game === gameNumber);
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
    <div className="min-w-[300px]">
      <div className='bg-canvas p-2 rounded-lg border border-secondary/10'>
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold inline-block px-2 py-0.5 bg-fifth text-primary rounded-lg border border-secondary">
            Final Four
          </h2>
        </div>
        <div className="space-y-2">
          {/* Semifinal 1 */}
          <div>
            {(() => {
              const match = getMatch(61);
              if (!match) return <div className="h-[52px]"></div>;
              
              // For match 61: top seed from region 1 (green), bottom seed from region 2 (teal)
              return (
                <div>
                  <div className="bg-canvas border border-secondary/50 rounded-lg overflow-hidden">
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#CE1126] text-primary px-1 py-0.5 rounded w-6 font-medium text-center">
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team1.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#2563eb] text-primary px-1 py-0.5 rounded w-6 font-medium text-center">
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team2.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team2.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Semifinal 2 */}
          <div>
            {(() => {
              const match = getMatch(62);
              if (!match) return <div className="h-[52px]"></div>;
              
              // For match 62: top seed from region 3 (orange), bottom seed from region 4 (dark red)
              return (
                <div>
                  <div className="bg-canvas border border-secondary/50 rounded-lg overflow-hidden">
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#f97316] text-primary px-1 py-0.5 rounded w-6 font-medium text-center">
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team1.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#16a34a] text-primary px-1 py-0.5 rounded w-6 font-medium text-center">
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team2.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team2.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Championship */}
          <div>
            <div className="text-center mt-8 mb-2">
              <h2 className="text-xl font-semibold inline-block px-2 py-0.5 bg-fifth text-primary rounded-lg border border-secondary">
                Championship
              </h2>
            </div>
            {(() => {
              const match = getMatch(63);
              const match61 = getMatch(61);
              const match62 = getMatch(62);
              if (!match || !match61 || !match62) return <div className="h-[52px]"></div>;
              
              // Determine colors based on semifinal winners
              const topSeedColor = match61.team1.percentage > match61.team2.percentage ? 'bg-[#CE1126]' : 'bg-[#2563eb]';
              const bottomSeedColor = match62.team1.percentage > match62.team2.percentage ? 'bg-[#f97316]' : 'bg-[#16a34a]';
              
              return (
                <div>
                  <div className="bg-canvas border border-secondary/50 rounded-lg overflow-hidden">
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`${topSeedColor} text-primary px-1 py-0.5 rounded w-6 font-medium text-center`}>
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team1.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-1 py-0.5 hover:bg-fourth/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'font-bold bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`${bottomSeedColor} text-primary px-1 py-0.5 rounded w-6 font-medium text-center`}>
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1">{cleanSongName(match.team2.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-fifth text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-semibold">{match.team2.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Champion Box */}
          <ChampionBox championship={getMatch(63)} selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  );
};

export default FinalFour;
