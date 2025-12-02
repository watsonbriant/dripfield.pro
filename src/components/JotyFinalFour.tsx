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

  return (
    <div className="min-w-[300px]">
      <div className='bg-canvas border border-fourth shadow-xl'>
        <div className="bg-fourth text-white px-2 py-0.5">
          <h2 className="text-sm font-medium">
            Final Four
          </h2>
        </div>
        <div>
          <div className="space-y-2">
          {/* Semifinal 1 */}
          <div className='mx-2 mt-2'>
            {(() => {
              const match = getMatch(61);
              if (!match) return <div className="h-[52px]"></div>;
              
              // For match 61: top seed from region 1 (green), bottom seed from region 2 (teal)
              return (
                <div>
                  <div className="bg-tertiary/20 border border-fourth overflow-hidden shadow-xl">
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#CE1126] text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs">
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team1.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#2563eb] text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs">
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team2.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team2.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          {/* Semifinal 2 */}
          <div className='mx-2 mt-2'>
            {(() => {
              const match = getMatch(62);
              if (!match) return <div className="h-[52px]"></div>;
              
              // For match 62: top seed from region 3 (orange), bottom seed from region 4 (dark red)
              return (
                <div>
                  <div className="bg-tertiary/20 border border-fourth overflow-hidden shadow-xl">
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#f97316] text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs">
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team1.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#16a34a] text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs">
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team2.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team2.percentage}%</span>
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
            <div className="bg-fourth text-white px-2 py-0.5 mt-4 mb-2">
              <h2 className="text-sm font-medium">
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
                <div className='mx-2 mt-2'>
                  <div className="bg-tertiary/20 border border-fourth overflow-hidden shadow-xl">
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team1.percentage > match.team2.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className={`${topSeedColor} text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs`}>
                            {match.team1.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team1.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team1.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team1.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team1.percentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`pl-0.5 pr-2 py-0.5 hover:bg-tertiary/40 transition-colors cursor-pointer ${
                        match.team2.percentage > match.team1.percentage ? 'bg-tertiary/80' : ''
                      }`}
                      onClick={() => onMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
                    >
                      <div className="flex justify-between items-center text-[0.625rem]">
                        <div className="flex items-center gap-1.5">
                          <span className={`${bottomSeedColor} text-white px-1 py-0.5 rounded w-6 font-medium text-center text-xs`}>
                            {match.team2.seed}
                          </span>
                          <span className="text-fifth font-medium">{match.team2.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {match.team2.date && (
                            <span className="bg-canvas text-fifth px-1.5 py-0.5 rounded text-[0.625rem] font-medium">
                              {match.team2.date}
                            </span>
                          )}
                          <span className="text-fifth font-medium">{match.team2.percentage}%</span>
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
    </div>
  );
};

export default FinalFour;
