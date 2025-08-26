import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import aatLogo from '../img/AAT.jpg';
import nugsLogo from '../img/NugsColor.png';
import JotyMatchupModal from './JotyMatchupModal';

interface Team {
  seed: number;
  name: string;
  percentage: number;
  entryId?: string;
  date?: string;
  venue?: string; 
  entryShort?: string | null; 
  subvenue?: string | null;  // Add this line
  fullDate?: string;  // Add this line
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

export function Joty() {
  const { year: urlYear } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(urlYear ? parseInt(urlYear) : 2024);
  const [regions, setRegions] = useState<{ name: string; color: string; priorityLevel: number }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<{
    team1: Team;
    team2: Team;
    regionColor: string;
    team1Color?: string;
    team2Color?: string;
  } | null>(null);

  // Clean song names for display - same function as in Tours component
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

  // Available years
  const availableYears = [2024, 2023, 2022, 2021, 2020];

  // Handle year change
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    navigate(`/joty/${newYear}`);
  };

  // Update selectedYear when URL changes
  useEffect(() => {
    if (urlYear) {
      const year = parseInt(urlYear);
      if (availableYears.includes(year)) {
        setSelectedYear(year);
      } else {
        // Invalid year, redirect to default
        navigate('/joty/2024', { replace: true });
      }
    } else {
      // No year specified, redirect to default
      navigate('/joty/2024', { replace: true });
    }
  }, [urlYear]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        console.log(`Fetching regions and matches for JOTY ${selectedYear}...`);
        
        // Fetch regions for selected year with priority levels 1-4
        const { data: regionsData, error: regionsError } = await supabase
          .from('joty_regions')
          .select('*')
          .eq('joty_region_year', selectedYear)
          .in('joty_region_prioritylevel', [1, 2, 3, 4])
          .order('joty_region_prioritylevel', { ascending: true });

        if (regionsError) {
          console.error('Error fetching regions:', regionsError);
          throw regionsError;
        }

        console.log('Raw regions data from database:', regionsData);

        // In the fetchData function, update the matches query:
        const { data: matchesData, error: matchesError } = await supabase
        .from('joty_matchups')
        .select(`
          *,
          entry1:setlist_entries!joty_matchups_joty_entry1_fkey(
            entry_id,
            entry_song,
            entry_short,
            shows!inner(
              show_date,
              show_venue_location,
              show_subvenue
            )
          ),
          entry2:setlist_entries!joty_matchups_joty_entry2_fkey(
            entry_id,
            entry_song,
            entry_short,
            shows!inner(
              show_date,
              show_venue_location,
              show_subvenue
            )
          )
        `)
        .eq('joty_year', selectedYear)
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
          const regionColors = ["bg-[#CE1126]", "bg-[#2563eb]", "bg-[#f97316]", "bg-[#16a34a]"];
          
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
              const [year, month, day] = dateString.split('-');
              return `${month}.${day}`;
            };
            
            // Helper function to format date as MM.DD.YYYY
            const formatFullDate = (entry: any) => {
              if (!entry?.shows?.show_date) return undefined;
              const dateString = entry.shows.show_date;
              const [year, month, day] = dateString.split('-');
              return `${month}.${day}.${year.slice(-2)}`;
            };
          
            return {
              game: match.joty_game,
              team1: {
                seed: match.joty_entry1_rank || 1,
                name: match.entry1?.entry_song || 'TBD',
                percentage: match.joty_entry1_percentage || 0,
                entryId: match.joty_entry1,
                date: formatDate(match.entry1),
                venue: match.entry1?.shows?.show_venue_location || '',
                entryShort: match.entry1?.entry_short || null,
                subvenue: match.entry1?.shows?.show_subvenue || null,
                fullDate: formatFullDate(match.entry1)
              },
              team2: {
                seed: match.joty_entry2_rank || 16,
                name: match.entry2?.entry_song || 'TBD',
                percentage: match.joty_entry2_percentage || 0,
                entryId: match.joty_entry2,
                date: formatDate(match.entry2),
                venue: match.entry2?.shows?.show_venue_location || '',
                entryShort: match.entry2?.entry_short || null,
                subvenue: match.entry2?.shows?.show_subvenue || null,
                fullDate: formatFullDate(match.entry2)
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
  }, [selectedYear]); // Re-fetch when selectedYear changes

  if (loading) {
    // Don't return early - let the component render with opacity
  }

  if (!loading && regions.length !== 4) {
    return (
      <div className="max-w-[1600px] mx-auto text-center">
        <div className="text-fifth">Unable to load tournament data. Please ensure 4 regions exist for {selectedYear}.</div>
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

  const handleMatchupClick = (team1: Team, team2: Team, regionColor: string, team1Color?: string, team2Color?: string) => {
    setSelectedMatchup({ team1, team2, regionColor, team1Color, team2Color });
    setModalOpen(true);
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header with Year Selector */}
      <div className="mb-8">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
              Jam of the Year
            </h2>
            
            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Credits with logos */}
          <div className="flex items-center gap-3">
            {/* Logos */}
            <div className="flex items-center gap-2">
              <a href="https://www.osirispod.com/podcasts/always-almost-there/" target="_blank">
                <img src={aatLogo} alt="Always Almost There" className="h-8 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
              </a>
              <a href="https://www.nugs.net/" target="blank"><img src={nugsLogo} alt="nugs" className="h-8 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" /></a>
            </div>
            
            {/* Credits */}
            <div className="bg-fourth border border-secondary rounded-lg px-3 py-1.5 max-w-[350px]">
              <p className="text-xs font-medium text-primary">Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs.</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">
              Jam of the Year
            </h2>
            
            {/* Year Dropdown */}
            <div className="mt-4">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-fourth/40 transition-colors text-lg font-semibold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Logos */}
            <div className="flex items-center justify-center gap-3 mt-4 mb-4">
              <a href="https://www.osirispod.com/podcasts/always-almost-there/" target="_blank">
                <img src={aatLogo} alt="Always Almost There" className="h-10 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
              </a>
              <a href="https://www.nugs.net/" target="_blank">
                <img src={nugsLogo} alt="nugs" className="h-10 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
              </a>
            </div>
          </div>
          
          {/* Credits */}
          <div className="bg-fourth border border-secondary rounded-lg px-3 py-1.5 mb-4 mx-auto max-w-[350px]">
            <p className="text-xs font-medium text-primary text-center">Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs.</p>
          </div>
        </div>
      </div>

      {/* Bracket Container */}
      <div className={`bg-primary border border-secondary rounded-lg p-2 overflow-x-auto ${loading ? 'opacity-20' : ''} transition-opacity duration-300`}>
        <div className="flex gap-4 min-w-[1400px]">
          {/* Left Side - All Regions stacked */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* All regions sorted by priority level */}
              {[topLeftRegion, bottomLeftRegion, topRightRegion, bottomRightRegion].map((region) => (
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
                              onMatchupClick={handleMatchupClick}
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
                                  onMatchupClick={handleMatchupClick}
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
                                  onMatchupClick={handleMatchupClick}
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
                            onMatchupClick={handleMatchupClick}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#CE1126]', 'bg-[#2563eb]')}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', 'bg-[#f97316]', 'bg-[#16a34a]')}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
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
                            onClick={() => handleMatchupClick(match.team1, match.team2, 'bg-tertiary/80', topSeedColor, bottomSeedColor)}
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
                <div className="pt-8 text-center">
                  {(() => {
                    const championship = getMatch(63);
                    if (!championship) return null;
                    const champion = championship.team1.percentage > championship.team2.percentage 
                      ? championship.team1 
                      : championship.team2;
                    
                    return (
                      <div className="inline-block bg-tertiary/80 border border-secondary rounded-lg p-2">
                        <p className="text-sm font-semibold text-fifth mb-1">{selectedYear} Jam of the Year</p>
                        <p className="text-2xl font-trad text-[1.5rem] leading-[1.5rem] pb-1 text-fifth">{cleanSongName(champion.name)}</p>
                        {champion.date && champion.venue && (
                          <p className="text-sm text-fifth mt-1 font-medium">
                            {champion.date}.{selectedYear.toString().slice(2)}<br /><span className="font-light">{champion.venue}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedMatchup && (
        <JotyMatchupModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMatchup(null);
          }}
          team1={selectedMatchup.team1}
          team2={selectedMatchup.team2}
          regionColor={selectedMatchup.regionColor}
          team1Color={selectedMatchup.team1Color}
          team2Color={selectedMatchup.team2Color}
        />
      )}
    </div>
  );
}