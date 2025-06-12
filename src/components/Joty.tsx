import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';

interface Team {
  seed: number;
  name: string;
  percentage: number;
  entryId?: string;
  date?: string;
}

interface Match {
  game: number;
  team1: Team;
  team2: Team;
}

interface MatchupProps {
  team1: Team;
  team2: Team;
  roundName: string;
  matchNumber: number;
  regionColor: string;
}

const Matchup: React.FC<MatchupProps> = ({ team1, team2, roundName, matchNumber, regionColor }) => {
  return (
    <div>
      <div className="bg-canvas border border-black/50 rounded-lg overflow-hidden">
        <div 
          className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
            team1.percentage > team2.percentage ? 'font-bold bg-[#f9ae37]' : ''
          }`}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-white px-1 py-0.5 rounded w-6 font-semibold text-center`}>
                {team1.seed}
              </span>
              <span className="text-black">{team1.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team1.date && (
                <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  {team1.date}
                </span>
              )}
              <span className="text-black font-semibold">{team1.percentage}%</span>
            </div>
          </div>
        </div>
        <div 
          className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
            team2.percentage > team1.percentage ? 'font-bold bg-[#f9ae37]' : ''
          }`}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`${regionColor} text-white px-1 py-0.5 rounded w-6 font-semibold text-center`}>
                {team2.seed}
              </span>
              <span className="text-black">{team2.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team2.date && (
                <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  {team2.date}
                </span>
              )}
              <span className="text-black font-semibold">{team2.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Joty() {
  const [regions, setRegions] = useState<{ name: string; color: string; priorityLevel: number }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching regions and matches for JOTY 2020...');
        
        // Fetch regions for 2020 with priority levels 1-4
        const { data: regionsData, error: regionsError } = await supabase
          .from('joty_regions')
          .select('*')
          .eq('joty_region_year', 2020)
          .in('joty_region_prioritylevel', [1, 2, 3, 4])
          .order('joty_region_prioritylevel', { ascending: true });

        if (regionsError) {
          console.error('Error fetching regions:', regionsError);
          throw regionsError;
        }

        console.log('Raw regions data from database:', regionsData);

        // Fetch matches for 2020
        const { data: matchesData, error: matchesError } = await supabase
          .from('joty_matchups')
          .select(`
            *,
            entry1:setlist_entries!joty_matchups_joty_entry1_fkey(
              entry_id,
              entry_song,
              shows!inner(show_date)
            ),
            entry2:setlist_entries!joty_matchups_joty_entry2_fkey(
              entry_id,
              entry_song,
              shows!inner(show_date)
            )
          `)
          .eq('joty_year', 2020)
          .order('joty_game', { ascending: true });

        if (matchesError) {
          console.error('Error fetching matches:', matchesError);
          throw matchesError;
        }

        console.log('Raw matches data from database:', matchesData);
        console.log('Number of matches found:', matchesData?.length);

        if (regionsData && regionsData.length === 4 && matchesData) {
          // Process regions
          const sortedRegions = regionsData.sort((a, b) => a.joty_region_prioritylevel - b.joty_region_prioritylevel);
          const regionColors = ["bg-[#006400]", "bg-[#019B7A]", "bg-[#E17401]", "bg-[#7C2128]"];
          
          const processedRegions = sortedRegions.map((region, index) => ({
            name: region.joty_region_displayname || region.joty_region_name || `Region ${index + 1}`,
            color: regionColors[index],
            priorityLevel: region.joty_region_prioritylevel
          }));

          // Process matches
          const processedMatches = matchesData.map(match => {
            // Helper function to format date as MM.DD
            const formatDate = (entry: any) => {
              if (!entry?.shows?.show_date) return undefined;
              const dateString = entry.shows.show_date;
              
              // Since show_date is stored as YYYY-MM-DD, we can parse it directly
              // without timezone conversions to avoid date shifting
              const [year, month, day] = dateString.split('-');
              
              return `${month}.${day}`;
            };

            console.log(`Processing match ${match.joty_game}:`, {
              entry1: match.entry1?.entry_song,
              entry1_rank: match.joty_entry1_rank,
              entry1_percentage: match.joty_entry1_percentage,
              entry1_date: match.entry1?.shows?.show_date,
              entry2: match.entry2?.entry_song,
              entry2_rank: match.joty_entry2_rank,
              entry2_percentage: match.joty_entry2_percentage,
              entry2_date: match.entry2?.shows?.show_date
            });

            return {
              game: match.joty_game,
              team1: {
                seed: match.joty_entry1_rank || 1,
                name: match.entry1?.entry_song || 'TBD',
                percentage: match.joty_entry1_percentage || 0,
                entryId: match.joty_entry1,
                date: formatDate(match.entry1)
              },
              team2: {
                seed: match.joty_entry2_rank || 16,
                name: match.entry2?.entry_song || 'TBD',
                percentage: match.joty_entry2_percentage || 0,
                entryId: match.joty_entry2,
                date: formatDate(match.entry2)
              }
            };
          });

          console.log('Processed matches:', processedMatches.slice(0, 5)); // Show first 5 matches

          setRegions(processedRegions);
          setMatches(processedMatches);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 text-center">
        <div className="text-black">Loading tournament bracket...</div>
      </div>
    );
  }

  if (regions.length !== 4) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 text-center">
        <div className="text-black">Unable to load tournament data. Please ensure 4 regions exist for 2020.</div>
      </div>
    );
  }

  // Helper function to get a specific match by game number
  const getMatch = (gameNumber: number): Match | undefined => {
    return matches.find(m => m.game === gameNumber);
  };

  // Arrange regions based on priority level
  const topLeftRegion = regions.find(r => r.priorityLevel === 1) || regions[0];
  const bottomLeftRegion = regions.find(r => r.priorityLevel === 2) || regions[1];
  const topRightRegion = regions.find(r => r.priorityLevel === 3) || regions[2];
  const bottomRightRegion = regions.find(r => r.priorityLevel === 4) || regions[3];

  return (
    <div className="max-w-[1600px] mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-mohr inline-block px-3 pt-1.5 bg-[#f9ae37] rounded-full border border-black">
          Jam of the Year
        </h2>
      </div>

      {/* Bracket Container */}
      <div className="bg-primary border border-black rounded-lg p-2 overflow-x-auto">
        <div className="flex gap-4 min-w-[1400px]">
          {/* Left Side - All Regions stacked */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* All regions sorted by priority level */}
              {[topLeftRegion, bottomLeftRegion, topRightRegion, bottomRightRegion].map((region) => (
                <div key={region.priorityLevel}>
                  <h2 className={`text-lg font-mohr ${region.color} ${region.priorityLevel > 1 ? 'text-white' : 'text-white'} inline-block px-2 pt-0.5 rounded-full border border-black mb-2`}>
                    {region.name} Region
                  </h2>
                  
                  {/* Round headers row */}
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <h3 className="text-center text-xs font-bold text-black min-w-[270px]">Round of 64</h3>
                    <h3 className="text-center text-xs font-bold text-black min-w-[270px]">Round of 32</h3>
                    <h3 className="text-center text-xs font-bold text-black min-w-[270px]">Sweet 16</h3>
                    <h3 className="text-center text-xs font-bold text-black min-w-[270px]">Elite 8</h3>
                  </div>
                  
                  {/* Matches grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* Round of 64 */}
                    <div className="space-y-1 min-w-[270px]">
                      {(() => {
                        const startGame = (region.priorityLevel - 1) * 8 + 1;
                        const games = Array.from({length: 8}, (_, i) => startGame + i);
                        return games.map((gameNum) => {
                          const match = getMatch(gameNum);
                          if (!match) return null;
                          return (
                            <Matchup
                              key={gameNum}
                              team1={match.team1}
                              team2={match.team2}
                              roundName="Round of 64"
                              matchNumber={gameNum}
                              regionColor={region.color}
                            />
                          );
                        });
                      })()}
                    </div>
                    
                    {/* Round of 32 */}
                    <div className="space-y-[55px] min-w-[270px] flex flex-col justify-center h-full">
                      {(() => {
                        const startGame = 33 + (region.priorityLevel - 1) * 4;
                        const games = Array.from({length: 4}, (_, i) => startGame + i);
                        return games.map((gameNum, idx) => (
                          <div key={gameNum}>
                            {(() => {
                              const match = getMatch(gameNum);
                              if (!match) return null;
                              return (
                                <Matchup
                                  team1={match.team1}
                                  team2={match.team2}
                                  roundName="Round of 32"
                                  matchNumber={gameNum}
                                  regionColor={region.color}
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
                        const startGame = 49 + (region.priorityLevel - 1) * 2;
                        const games = Array.from({length: 2}, (_, i) => startGame + i);
                        return games.map((gameNum, idx) => (
                          <div key={gameNum}>
                            {(() => {
                              const match = getMatch(gameNum);
                              if (!match) return null;
                              return (
                                <Matchup
                                  team1={match.team1}
                                  team2={match.team2}
                                  roundName="Sweet 16"
                                  matchNumber={gameNum}
                                  regionColor={region.color}
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
                        const gameNum = 57 + (region.priorityLevel - 1);
                        const match = getMatch(gameNum);
                        if (!match) return null;
                        return (
                          <Matchup
                            team1={match.team1}
                            team2={match.team2}
                            roundName="Elite 8"
                            matchNumber={gameNum}
                            regionColor={region.color}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Four Column */}
          <div className="min-w-[300px]">
            <div className='bg-canvas p-2 rounded-lg border border-black/10'>
              <div className="text-center mb-4">
                <h2 className="text-xl font-mohr inline-block px-2 pt-0.5 bg-[#f9ae37] rounded-full border border-black">
                  Final Four
                </h2>
              </div>
              <div className="space-y-2">
                {/* Semifinal 1 */}
                <div>
                  {(() => {
                    const match = getMatch(61);
                    if (!match) return null;
                    
                    // For match 61: top seed from region 1 (green), bottom seed from region 2 (teal)
                    return (
                      <div>
                        <div className="bg-canvas border border-black/50 rounded-lg overflow-hidden">
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team1.percentage > match.team2.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-[#006400] text-white px-1 py-0.5 rounded w-6 font-semibold text-center">
                                  {match.team1.seed}
                                </span>
                                <span className="text-black">{match.team1.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team1.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team1.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team1.percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team2.percentage > match.team1.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-[#019B7A] text-white px-1 py-0.5 rounded w-6 font-semibold text-center">
                                  {match.team2.seed}
                                </span>
                                <span className="text-black">{match.team2.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team2.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team2.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team2.percentage}%</span>
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
                    if (!match) return null;
                    
                    // For match 62: top seed from region 3 (orange), bottom seed from region 4 (dark red)
                    return (
                      <div>
                        <div className="bg-canvas border border-black/50 rounded-lg overflow-hidden">
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team1.percentage > match.team2.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-[#E17401] text-white px-1 py-0.5 rounded w-6 font-semibold text-center">
                                  {match.team1.seed}
                                </span>
                                <span className="text-black">{match.team1.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team1.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team1.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team1.percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team2.percentage > match.team1.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-[#7C2128] text-white px-1 py-0.5 rounded w-6 font-semibold text-center">
                                  {match.team2.seed}
                                </span>
                                <span className="text-black">{match.team2.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team2.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team2.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team2.percentage}%</span>
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
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-mohr inline-block px-2 mt-6 pt-0.5 bg-[#f9ae37] rounded-full border border-black">
                      Championship
                    </h2>
                  </div>
                  {(() => {
                    const match = getMatch(63);
                    const match61 = getMatch(61);
                    const match62 = getMatch(62);
                    if (!match || !match61 || !match62) return null;
                    
                    // Determine colors based on semifinal winners
                    const topSeedColor = match61.team1.percentage > match61.team2.percentage ? 'bg-[#006400]' : 'bg-[#019B7A]';
                    const bottomSeedColor = match62.team1.percentage > match62.team2.percentage ? 'bg-[#E17401]' : 'bg-[#7C2128]';
                    
                    return (
                      <div>
                        <div className="bg-canvas border border-black/50 rounded-lg overflow-hidden">
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team1.percentage > match.team2.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`${topSeedColor} text-white px-1 py-0.5 rounded w-6 font-semibold text-center`}>
                                  {match.team1.seed}
                                </span>
                                <span className="text-black">{match.team1.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team1.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team1.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team1.percentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div 
                            className={`pl-0.5 pr-1 py-0.5 hover:bg-primary transition-colors ${
                              match.team2.percentage > match.team1.percentage ? 'font-bold bg-[#f9ae37]' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className={`${bottomSeedColor} text-white px-1 py-0.5 rounded w-6 font-semibold text-center`}>
                                  {match.team2.seed}
                                </span>
                                <span className="text-black">{match.team2.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {match.team2.date && (
                                  <span className="bg-secondary text-black px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {match.team2.date}
                                  </span>
                                )}
                                <span className="text-black font-semibold">{match.team2.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Champion Box */}
                <div className="pt-8 text-center">
                  {(() => {
                    const championship = getMatch(63);
                    if (!championship) return null;
                    const champion = championship.team1.percentage > championship.team2.percentage 
                      ? championship.team1 
                      : championship.team2;
                    
                    return (
                      <div className="inline-block bg-secondary border border-black rounded-lg px-4 py-3">
                        <p className="text-sm font-bold text-black mb-1">2020 Jam of the Year</p>
                        <p className="text-2xl font-mohr text-black">{champion.name}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}