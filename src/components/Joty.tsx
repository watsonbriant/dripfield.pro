import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import JotyMatchupModal from './JotyMatchupModal';
import JotyHeader from './JotyHeader';
import BracketRegion, { Match, Region } from './JotyBracketRegion';
import FinalFour from './JotyFinalFour';
import { Team } from './JotyMatchup';

export function Joty() {
  const { year: urlYear } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(urlYear ? parseInt(urlYear) : 2024);
  const [regions, setRegions] = useState<Region[]>([]);
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
        
        // Fetch regions for selected year with priority levels 1-4
        const { data: regionsData, error: regionsError } = await supabase
          .from('joty_regions')
          .select('*')
          .eq('joty_region_year', selectedYear)
          .in('joty_region_prioritylevel', [1, 2, 3, 4])
          .order('joty_region_prioritylevel', { ascending: true });

        if (regionsError) {
          throw regionsError;
        }

        // In the fetchData function, update the matches query:
        const { data: matchesData, error: matchesError } = await supabase
        .from('joty_matchups')
        .select(`
          *,
          entry1:setlist_entries!joty_matchups_joty_entry1_fkey(
            entry_id,
            entry_song,
            entry_short,
            songs:entry_song(
              song_id
            ),
            shows!inner(
              show_id,
              show_date,
              show_venue_location,
              show_subvenue,
              subvenues(
                subvenue_venue,
                venues(
                  venue_id
                )
              )
            )
          ),
          entry2:setlist_entries!joty_matchups_joty_entry2_fkey(
            entry_id,
            entry_song,
            entry_short,
            songs:entry_song(
              song_id
            ),
            shows!inner(
              show_id,
              show_date,
              show_venue_location,
              show_subvenue,
              subvenues(
                subvenue_venue,
                venues(
                  venue_id
                )
              )
            )
          )
        `)
        .eq('joty_year', selectedYear)
        .order('joty_game', { ascending: true });

        if (matchesError) {
          throw matchesError;
        }

        if (regionsData && regionsData.length === 4 && matchesData) {
          // Process regions
          const sortedRegions = regionsData.sort((a, b) => a.joty_region_prioritylevel - b.joty_region_prioritylevel);
          const regionColors = ["bg-[#CE1126]", "bg-[#2563eb]", "bg-[#f97316]", "bg-[#16a34a]"];
          
          const processedRegions: Region[] = sortedRegions.map((region, index) => ({
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
              const [, month, day] = dateString.split('-');
              return `${month}.${day}`;
            };
            
            // Helper function to format date as MM.DD.YYYY
            const formatFullDate = (entry: any) => {
              if (!entry?.shows?.show_date) return undefined;
              const dateString = entry.shows.show_date;
              const [, month, day] = dateString.split('-');
              return `${month}.${day}.${dateString.slice(0, 4).slice(-2)}`;
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
                fullDate: formatFullDate(match.entry1),
                songId: match.entry1?.songs?.song_id || null,
                showId: match.entry1?.shows?.show_id || null,
                venueId: match.entry1?.shows?.subvenues?.venues?.venue_id || null
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
                fullDate: formatFullDate(match.entry2),
                songId: match.entry2?.songs?.song_id || null,
                showId: match.entry2?.shows?.show_id || null,
                venueId: match.entry2?.shows?.subvenues?.venues?.venue_id || null
              }
            };
          });

          setRegions(processedRegions);
          setMatches(processedMatches);
        }
      } catch (error) {
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
      <div className="max-w-[1600px]">
        <div className="bg-primary border border-fourth p-2 text-center">
          <p className="text-fifth text-[0.625rem]">Unable to load tournament data. Please ensure 4 regions exist for {selectedYear}.</p>
        </div>
      </div>
    );
  }

  const handleMatchupClick = (team1: Team, team2: Team, regionColor: string, team1Color?: string, team2Color?: string) => {
    setSelectedMatchup({ team1, team2, regionColor, team1Color, team2Color });
    setModalOpen(true);
  };

  return (
    <div className="max-w-[1600px]">
      {/* Header with Year Selector */}
      <JotyHeader 
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={handleYearChange}
      />

      {/* Bracket Container */}
      <div className={`bg-primary border border-fourth overflow-x-auto ${loading ? 'opacity-20' : ''} transition-opacity duration-300`}>
        <div className="flex gap-4 min-w-[1400px] p-2">
          {/* Left Side - All Regions stacked */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* All regions sorted by priority level */}
              {regions.map((region) => (
                <BracketRegion
                  key={region.priorityLevel}
                  region={region}
                  matches={matches}
                  onMatchupClick={handleMatchupClick}
                />
              ))}
            </div>
          </div>

          {/* Final Four Column */}
          <FinalFour 
            matches={matches}
            selectedYear={selectedYear}
            onMatchupClick={handleMatchupClick}
          />
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