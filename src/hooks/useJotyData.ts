import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface JotyResult {
  entry_id: string;
  entry_song: string;
  entry_short: string | null;
  show_date: string;
  show_venue_location: string;
  show_tour: string | null;
  show_subvenue: string;
  round_achieved: string;
}

export interface JotyRound {
  joty_round: string;
  joty_round_priority: number;
  results: JotyResult[];
}

// Mapping from round_achieved short codes to joty_round full names
const ROUND_CODE_TO_NAME: Record<string, string> = {
  'JOTY': 'Jam of the Year',
  '2nd': '2nd Place',
  'F4': 'Final Four',
  'E8': 'Elite Eight',
  'S16': 'Sweet 16',
  'R32': 'Round of 32',
  'R64': 'Round of 64',
};

// Reverse mapping from full names to short codes
const ROUND_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUND_CODE_TO_NAME).map(([code, name]) => [name, code])
);

export const useJotyData = (isOpen: boolean, year: number | null) => {
  const [rounds, setRounds] = useState<JotyRound[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && year !== null) {
      fetchJotyData();
    } else {
      setRounds([]);
    }
  }, [isOpen, year]);

  const fetchJotyData = async () => {
    setLoading(true);
    try {
      // First, fetch all joty_rounds sorted by priority
      const { data: roundsData, error: roundsError } = await supabase
        .from('joty_rounds')
        .select('joty_round, joty_round_priority')
        .order('joty_round_priority', { ascending: true });

      if (roundsError) throw roundsError;

      if (!roundsData || roundsData.length === 0) {
        setRounds([]);
        setLoading(false);
        return;
      }

      // Fetch all joty_results for the year with related setlist_entries and shows
      const { data: resultsData, error: resultsError } = await supabase
        .from('joty_results')
        .select(`
          entry_id,
          round_achieved,
          setlist_entries (
            entry_id,
            entry_song,
            entry_short,
            shows (
              show_date,
              show_venue_location,
              show_tour,
              show_subvenue
            )
          )
        `)
        .eq('year', year);

      if (resultsError) throw resultsError;

      // Group results by round_achieved
      const roundsMap = new Map<string, JotyResult[]>();

      if (!resultsData || resultsData.length === 0) {
        console.log('No joty_results found for year:', year);
      } else {
        console.log('Found', resultsData.length, 'joty_results for year:', year);
      }

      resultsData?.forEach((result: any) => {
        const round = result.round_achieved;
        if (!round) {
          console.warn('Missing round_achieved for entry_id:', result.entry_id);
          return;
        }

        // Handle nested data structure from Supabase
        // The structure might be an object (one-to-one) or array (one-to-many)
        const setlistEntry = Array.isArray(result.setlist_entries) 
          ? result.setlist_entries[0] 
          : result.setlist_entries;
          
        if (!setlistEntry) {
          console.warn('Missing setlist_entries for entry_id:', result.entry_id, 'Full result:', result);
          return;
        }

        // Handle shows - might be array or object
        const show = Array.isArray(setlistEntry.shows) 
          ? setlistEntry.shows[0] 
          : setlistEntry.shows;
          
        if (!show) {
          console.warn('Missing shows for entry_id:', result.entry_id, 'Setlist entry:', setlistEntry);
          return;
        }

        if (!roundsMap.has(round)) {
          roundsMap.set(round, []);
        }

        roundsMap.get(round)?.push({
          entry_id: result.entry_id,
          entry_song: setlistEntry.entry_song,
          entry_short: setlistEntry.entry_short,
          show_date: show.show_date || '',
          show_venue_location: show.show_venue_location || '',
          show_tour: show.show_tour,
          show_subvenue: show.show_subvenue || '',
          round_achieved: result.round_achieved,
        });
      });

      // Debug: log the grouping
      console.log('JOTY rounds map (grouped by round_achieved):', Array.from(roundsMap.entries()).map(([round, results]) => ({
        round,
        count: results.length
      })));
      
      // Debug: log unique round_achieved values
      const uniqueRounds = new Set(resultsData?.map((r: any) => r.round_achieved).filter(Boolean));
      console.log('Unique round_achieved values:', Array.from(uniqueRounds));
      
      // Debug: log joty_round values
      console.log('joty_round values from joty_rounds table:', roundsData.map(r => r.joty_round));

      // Combine rounds data with results, including all rounds (even if they have no results)
      // Match round_achieved values (short codes) to joty_round values (full names)
      const roundsWithResults: JotyRound[] = roundsData.map(round => {
        // Convert full name to short code to look up in the map
        const roundCode = ROUND_NAME_TO_CODE[round.joty_round];
        const matchingResults = roundCode ? (roundsMap.get(roundCode) || []) : [];
        
        // Sort results by show_date (ascending), then alphabetically by song name
        const sortedResults = [...matchingResults].sort((a, b) => {
          // First sort by show_date (ascending)
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          // If dates are equal, sort alphabetically by song name
          return a.entry_song.localeCompare(b.entry_song);
        });
        
        return {
          joty_round: round.joty_round,
          joty_round_priority: round.joty_round_priority,
          results: sortedResults,
        };
      });

      // Debug: log final rounds
      console.log('Final rounds with results:', roundsWithResults.map(r => ({
        round: r.joty_round,
        priority: r.joty_round_priority,
        resultCount: r.results.length
      })));

      setRounds(roundsWithResults);
    } catch (error) {
      console.error('Error fetching JOTY data:', error);
      setRounds([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    rounds,
    loading,
  };
};

