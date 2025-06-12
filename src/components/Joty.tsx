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
}

const Matchup: React.FC<MatchupProps> = ({ team1, team2, roundName, matchNumber }) => {
  return (
    <div className="mb-2">
      <div className="bg-canvas border border-black rounded-lg overflow-hidden">
        <div 
          className={`pl-0.5 pr-1 py-0.5 border-b border-black hover:bg-primary transition-colors ${
            team1.percentage > team2.percentage ? 'font-bold bg-[#f9ae37]' : ''
          }`}
        >
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#f9ae37] text-black px-1 py-0.5 rounded w-6 font-semibold text-center">
                {team1.seed}
              </span>
              <span className="text-black">{team1.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team1.date && (
                <span className="bg-gray-200 text-black px-1.5 py-0.5 rounded text-[10px] font-medium">
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
              <span className="bg-[#f9ae37] text-black px-1 py-0.5 rounded w-6 font-semibold text-center">
                {team2.seed}
              </span>
              <span className="text-black">{team2.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team2.date && (
                <span className="bg-gray-200 text-black px-1.5 py-0.5 rounded text-[10px] font-medium">
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
          const regionColors = ["bg-[#f9ae37]", "bg-[#f9ae37]", "bg-[#f9ae37]", "bg-[#f9ae37]"];
          
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
        <h1 className="text-4xl font-mohr text-black mb-2">GOOSE JAM OF THE YEAR 2020</h1>
        <div className="inline-block bg-[#f9ae37] text-black px-6 py-2 rounded-full border-2 border-black">
          <span className="font-bold">64 Jams • Single Elimination • Tournament Results</span>
        </div>
      </div>

      {/* Bracket Container */}
      <div className="bg-primary border border-black rounded-lg p-2 overflow-x-auto">
        <div className="flex gap-8 min-w-[1400px]">
          {/* Left Side - All Regions stacked */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* All regions sorted by priority level */}
              {[topLeftRegion, bottomLeftRegion, topRightRegion, bottomRightRegion].map((region) => (
                <div key={region.priorityLevel}>
                  <h2 className={`text-lg font-mohr ${region.color} ${region.priorityLevel > 1 ? 'text-black' : 'text-black'} inline-block px-2 pt-0.5 rounded-full border border-black mb-2`}>
                    {region.name} Region
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {/* Round of 64 */}
                    <div className="space-y-1">
                      <h3 className="text-center text-xs font-bold text-black mb-2">Round of 64</h3>
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
                            />
                          );
                        });
                      })()}
                    </div>
                    {/* Round of 32 */}
                    <div className="space-y-1 pt-8">
                      <h3 className="text-center text-xs font-bold text-black mb-2">Round of 32</h3>
                      {(() => {
                        const startGame = 33 + (region.priorityLevel - 1) * 4;
                        const games = Array.from({length: 4}, (_, i) => startGame + i);
                        return games.map((gameNum, idx) => (
                          <div key={gameNum} className="mb-8">
                            {(() => {
                              const match = getMatch(gameNum);
                              if (!match) return null;
                              return (
                                <Matchup
                                  team1={match.team1}
                                  team2={match.team2}
                                  roundName="Round of 32"
                                  matchNumber={gameNum}
                                />
                              );
                            })()}
                          </div>
                        ));
                      })()}
                    </div>
                    {/* Sweet 16 */}
                    <div className="space-y-1 pt-16">
                      <h3 className="text-center text-xs font-bold text-black mb-2">Sweet 16</h3>
                      {(() => {
                        const startGame = 49 + (region.priorityLevel - 1) * 2;
                        const games = Array.from({length: 2}, (_, i) => startGame + i);
                        return games.map((gameNum, idx) => (
                          <div key={gameNum} className="mb-16">
                            {(() => {
                              const match = getMatch(gameNum);
                              if (!match) return null;
                              return (
                                <Matchup
                                  team1={match.team1}
                                  team2={match.team2}
                                  roundName="Sweet 16"
                                  matchNumber={gameNum}
                                />
                              );
                            })()}
                          </div>
                        ));
                      })()}
                    </div>
                    {/* Elite 8 */}
                    <div className="space-y-1 pt-24">
                      <h3 className="text-center text-xs font-bold text-black mb-2">Elite 8</h3>
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
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Final Four */}
          <div className="flex flex-col items-end justify-center px-4">
            <h2 className="text-2xl font-mohr bg-[#006400] text-white px-6 py-2 rounded-full border-2 border-black mb-8">
              FINAL FOUR
            </h2>
            <div className="space-y-8">
              <div className="flex gap-8">
                <div>
                  <h3 className="text-center text-xs font-bold text-black mb-2 text-center">Semifinal 1</h3>
                  {(() => {
                    const match = getMatch(61);
                    if (!match) return null;
                    return (
                      <Matchup
                        team1={match.team1}
                        team2={match.team2}
                        roundName="Final Four"
                        matchNumber={61}
                      />
                    );
                  })()}
                </div>
                <div>
                  <h3 className="text-center text-xs font-bold text-black mb-2 text-center">Semifinal 2</h3>
                  {(() => {
                    const match = getMatch(62);
                    if (!match) return null;
                    return (
                      <Matchup
                        team1={match.team1}
                        team2={match.team2}
                        roundName="Final Four"
                        matchNumber={62}
                      />
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <h3 className="text-center text-xs font-bold text-black mb-2 text-center">Championship</h3>
                {(() => {
                  const match = getMatch(63);
                  if (!match) return null;
                  return (
                    <Matchup
                      team1={match.team1}
                      team2={match.team2}
                      roundName="Championship"
                      matchNumber={63}
                    />
                  );
                })()}
              </div>
              
              <div className="mt-8 text-center">
                {(() => {
                  const championship = getMatch(63);
                  if (!championship) return null;
                  const champion = championship.team1.percentage > championship.team2.percentage 
                    ? championship.team1 
                    : championship.team2;
                  
                  return (
                    <div className="inline-block bg-[#f9ae37] border-2 border-black rounded-lg px-6 py-4">
                      <p className="text-sm font-bold text-black mb-1">2020 Champion</p>
                      <p className="text-2xl font-mohr text-black">{champion.name}</p>
                      <p className="text-sm font-semibold text-black mt-1">{champion.percentage}% of votes</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-tertiary border border-black rounded"></div>
          <span className="text-sm text-black">Seed Number</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary border border-black rounded"></div>
          <span className="text-sm text-black">Matchup</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-black">Bold = Higher Vote Percentage</span>
        </div>
      </div>
    </div>
  );
}