import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
  show_iscanon: boolean;
  show_canonid: number | null;
}

interface SetlistEntry {
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_placement: string;
  entry_setorder: number;
  entry_set: string;
  entry_setnum: number;
  averageLength: string | null;
  songs: {
    song_id: string;
    category_artwork?: string | null;
  };
}

interface SongSelectionDetail {
  song: string;
  assignedSet: string;
  totalAppearances: number;
  averagePoints: number;
  rarityPercentage: number;
}

interface SetlistStats {
  totalCanonicalShows: number;
  totalSetlistEntries: number;
  includedSets: Array<{
    set: string;
    showsWithSet: number;
    percentage: number;
    avgSongsPerSet: number;
  }>;
  totalUniqueSongs: number;
  threshold: number;
  songSelections: SongSelectionDetail[];
}

interface AverageSetlistResult {
  averageSetlist: SetlistEntry[];
  stats: SetlistStats | null;
  isLoading: boolean;
  error: string | null;
}

const SET_ORDER = ['1', '2', '3', '4', '5', 'E1', 'E2', 'E3'];
const SKIP_SHORTS = ['fake', 'tease', 'reprise', 'aborted'];
const SET_INCLUSION_THRESHOLD = 0.5; // 50% majority
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 200; // Supabase IN clause limit

// Point system: base points for each set
const SET_POINTS: Record<string, number> = {
  '1': 100,
  '2': 200,
  '3': 300,
  '4': 400,
  '5': 500,
  'E1': 600,
  'E2': 700,
  'E3': 800
};

export function useAverageSetlist(
  shows: Show[],
  type: 'year' | 'tour'
): AverageSetlistResult {
  const [averageSetlist, setAverageSetlist] = useState<SetlistEntry[]>([]);
  const [stats, setStats] = useState<SetlistStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Keep a ref to the latest shows array so we always use the most current data
  const showsRef = useRef(shows);
  showsRef.current = shows;

  // Create a stable dependency key based only on canonical show IDs
  // This prevents recalculation when the shows array reference changes
  // but the actual canonical show IDs remain the same
  const showsKey = useMemo(() => {
    if (!shows || shows.length === 0) {
      return '';
    }
    
    // Filter to canonical shows and extract IDs
    const canonicalShowIds = shows
      .filter(show => show.show_iscanon === true || show.show_canonid !== null)
      .map(show => show.show_id)
      .sort(); // Sort for consistent key generation
    
    // Create a stable string key from sorted show IDs
    return canonicalShowIds.join('|');
  }, [shows]);

  useEffect(() => {
    async function calculateAverageSetlist() {
      // Use the ref to always get the latest shows array
      const currentShows = showsRef.current;
      
      if (!currentShows || currentShows.length === 0) {
        setAverageSetlist([]);
        setStats(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Filter to canonical shows only
        const canonicalShows = currentShows.filter(
          show => show.show_iscanon === true || show.show_canonid !== null
        );

        if (canonicalShows.length === 0) {
          setAverageSetlist([]);
          setStats(null);
          setIsLoading(false);
          return;
        }

        const showIds = canonicalShows.map(show => show.show_id);

        // Get max canonid from the tour/year for rarity calculation
        // This will be the "final canonical date" up through which we calculate rarity
        const canonIds = canonicalShows
          .map(s => s.show_canonid)
          .filter((id): id is number => id !== null);
        const maxCanonId = Math.max(...canonIds);
        
        // Min canonid is always 1 (first canonical show ever)
        const minCanonId = 1;
        const canonRange = maxCanonId - minCanonId + 1;

        // Step 2: Fetch setlist entries with pagination
        const showIdChunks: string[][] = [];
        for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
          showIdChunks.push(showIds.slice(i, i + CHUNK_SIZE));
        }

        let allEntries: any[] = [];

        for (const chunk of showIdChunks) {
          let page = 0;
          let hasMore = true;

          while (hasMore) {
            const { data, error: entriesError } = await supabase
              .from('setlist_entries')
              .select(`
                entry_song,
                entry_short,
                entry_segue,
                entry_placement,
                entry_set,
                entry_setnum,
                entry_show,
                entry_length,
                songs (
                  song_id,
                  categories (
                    category_artwork
                  )
                )
              `)
              .in('entry_show', chunk)
              .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (entriesError) throw entriesError;

            if (data && data.length > 0) {
              allEntries = [...allEntries, ...data];
              page++;
              hasMore = data.length === PAGE_SIZE;
            } else {
              hasMore = false;
            }
          }
        }

        // Filter out entries with skip shorts
        const validEntries = allEntries.filter(
          entry => !entry.entry_short || !SKIP_SHORTS.includes(entry.entry_short.toLowerCase())
        );

        if (validEntries.length === 0) {
          setAverageSetlist([]);
          setStats({
            totalCanonicalShows: canonicalShows.length,
            totalSetlistEntries: 0,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: []
          });
          setIsLoading(false);
          return;
        }

        // Step 3: Determine which sets to include (majority rule)
        const setShowCounts = new Map<string, Set<string>>();
        const setSongCounts = new Map<string, Map<string, Set<string>>>(); // set -> song -> shows

        validEntries.forEach(entry => {
          const set = entry.entry_set;
          const showId = entry.entry_show;
          const song = entry.entry_song;

          if (!setShowCounts.has(set)) {
            setShowCounts.set(set, new Set());
            setSongCounts.set(set, new Map());
          }

          setShowCounts.get(set)!.add(showId);

          if (!setSongCounts.get(set)!.has(song)) {
            setSongCounts.get(set)!.set(song, new Set());
          }
          // Count one appearance per show per set (even if song appears multiple times)
          setSongCounts.get(set)!.get(song)!.add(showId);
        });

        const includedSets: string[] = [];
        const includedSetsStats: SetlistStats['includedSets'] = [];

        SET_ORDER.forEach(set => {
          const showsWithSet = setShowCounts.get(set);
          if (showsWithSet) {
            const percentage = showsWithSet.size / canonicalShows.length;
            if (percentage > SET_INCLUSION_THRESHOLD) {
              includedSets.push(set);

              // Calculate average songs per set
              const showsWithSetArray = Array.from(showsWithSet);
              let totalSongs = 0;

              showsWithSetArray.forEach(showId => {
                // Count unique songs per show for this set
                const uniqueSongsInShow = new Set<string>();
                validEntries.forEach(entry => {
                  if (entry.entry_show === showId && entry.entry_set === set) {
                    uniqueSongsInShow.add(entry.entry_song);
                  }
                });
                totalSongs += uniqueSongsInShow.size;
              });

              const avgSongsPerSet = Math.round(totalSongs / showsWithSetArray.length);

              includedSetsStats.push({
                set,
                showsWithSet: showsWithSet.size,
                percentage: percentage * 100,
                avgSongsPerSet
              });
            }
          }
        });

        if (includedSets.length === 0) {
          setAverageSetlist([]);
          setStats({
            totalCanonicalShows: canonicalShows.length,
            totalSetlistEntries: validEntries.length,
            includedSets: [],
            totalUniqueSongs: 0,
            threshold: SET_INCLUSION_THRESHOLD * 100,
            songSelections: []
          });
          setIsLoading(false);
          return;
        }

        // Calculate total songs needed
        const totalSongsNeeded = includedSetsStats.reduce((sum, setInfo) => sum + setInfo.avgSongsPerSet, 0);

        // Step 4: Count song frequencies (one per show, like TourSongStats)
        const songFrequency = new Map<string, number>();
        const songShowIds = new Map<string, Set<string>>(); // For rarity calculation
        const allUniqueSongs = new Set<string>();

        validEntries.forEach(entry => {
          const song = entry.entry_song;
          const showId = entry.entry_show;
          
          allUniqueSongs.add(song);

          if (!songShowIds.has(song)) {
            songShowIds.set(song, new Set());
            songFrequency.set(song, 0);
          }

          // Count once per show (like TourSongStats)
          if (!songShowIds.get(song)!.has(showId)) {
            songShowIds.get(song)!.add(showId);
            songFrequency.set(song, songFrequency.get(song)! + 1);
          }
        });

        // Step 5: Calculate rarity percentage for each song
        // We need to find each song's debut (first canonical appearance) and count
        // canonical shows from debut up through maxCanonId
        const songRarity = new Map<string, number>();
        
        // Fetch all canonical shows up to maxCanonId to get their show_ids and canonids
        const { data: allCanonicalShowsUpToMax, error: canonShowsError } = await supabase
          .from('shows')
          .select('show_id, show_canonid')
          .not('show_canonid', 'is', null)
          .lte('show_canonid', maxCanonId)
          .order('show_canonid', { ascending: true });
        
        if (canonShowsError) {
          console.error('Error fetching canonical shows for rarity:', canonShowsError);
        }
        
        const allCanonicalShowIds = new Set(
          (allCanonicalShowsUpToMax || []).map(s => s.show_id)
        );
        
        // Create a map of show_id to canonid for quick lookup
        const showIdToCanonId = new Map<string, number>();
        (allCanonicalShowsUpToMax || []).forEach(s => {
          if (s.show_canonid !== null) {
            showIdToCanonId.set(s.show_id, s.show_canonid);
          }
        });
        
        // For each song, count how many canonical shows (up to maxCanonId) it appeared in
        // We need to fetch setlist entries for all canonical shows up to maxCanonId
        if (allCanonicalShowIds.size > 0) {
          const allCanonicalShowIdsArray = Array.from(allCanonicalShowIds);
          const canonShowIdChunks: string[][] = [];
          for (let i = 0; i < allCanonicalShowIdsArray.length; i += CHUNK_SIZE) {
            canonShowIdChunks.push(allCanonicalShowIdsArray.slice(i, i + CHUNK_SIZE));
          }
          
          // Fetch setlist entries for all canonical shows up to maxCanonId
          let allCanonEntries: any[] = [];
          
          for (const chunk of canonShowIdChunks) {
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
              const { data, error: entriesError } = await supabase
                .from('setlist_entries')
                .select('entry_song, entry_show, entry_short')
                .in('entry_show', chunk)
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
              
              if (entriesError) {
                console.error('Error fetching canonical entries for rarity:', entriesError);
                hasMore = false;
                break;
              }
              
              if (data && data.length > 0) {
                allCanonEntries = [...allCanonEntries, ...data];
                page++;
                hasMore = data.length === PAGE_SIZE;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Filter out skip shorts
          const validCanonEntries = allCanonEntries.filter(
            entry => !entry.entry_short || !SKIP_SHORTS.includes(entry.entry_short.toLowerCase())
          );
          
          // For each song, find its debut canonid and count appearances
          const songDebutCanonIds = new Map<string, number>(); // song -> debut canonid
          const songCanonShowCounts = new Map<string, Set<string>>(); // song -> set of show_ids
          
          validCanonEntries.forEach(entry => {
            const song = entry.entry_song;
            const showId = entry.entry_show;
            const canonId = showIdToCanonId.get(showId);
            
            if (canonId === undefined) return;
            
            // Track debut canonid (minimum canonid for this song)
            if (!songDebutCanonIds.has(song) || canonId < songDebutCanonIds.get(song)!) {
              songDebutCanonIds.set(song, canonId);
            }
            
            // Count unique shows per song
            if (!songCanonShowCounts.has(song)) {
              songCanonShowCounts.set(song, new Set());
            }
            songCanonShowCounts.get(song)!.add(showId);
          });
          
          // Calculate rarity for each song
          songShowIds.forEach((_showIdSet, song) => {
            const debutCanonId = songDebutCanonIds.get(song);
            const canonShowCount = songCanonShowCounts.get(song)?.size || 0;
            
            if (debutCanonId !== undefined) {
              // Calculate range from debut to maxCanonId
              const showRange = maxCanonId - debutCanonId + 1;
              const rarityPercentage = (canonShowCount / showRange) * 100;
              songRarity.set(song, rarityPercentage);
            } else {
              // Song never appeared in canonical shows up to maxCanonId
              songRarity.set(song, 0);
            }
          });
        } else {
          // Fallback: use tour/year shows only if we can't fetch all canonical shows
          songShowIds.forEach((showIdSet, song) => {
            const uniqueShowCount = showIdSet.size;
            const rarityPercentage = (uniqueShowCount / canonRange) * 100;
            songRarity.set(song, rarityPercentage);
          });
        }

        // Step 6: Select top N songs by frequency (tiebreaker: rarity percentage, higher is better)
        const sortedSongs = Array.from(songFrequency.entries())
          .map(([song, count]) => ({
            song,
            count,
            rarity: songRarity.get(song) || 0
          }))
          .sort((a, b) => {
            // Primary: frequency (descending)
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            // Tiebreaker: rarity percentage (descending - higher is better)
            return b.rarity - a.rarity;
          })
          .slice(0, totalSongsNeeded);

        // Helper function to parse PostgreSQL interval to seconds
        const parseDuration = (interval: string | null | undefined): number | null => {
          if (!interval) return null;
          
          // Handle PostgreSQL interval format (e.g., "00:05:23" or "01:23:45")
          const match = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/);
          if (match) {
            const hours = parseInt(match[1] || '0', 10);
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            return hours * 3600 + minutes * 60 + seconds;
          }
          
          return null;
        };

        // Helper function to format seconds to MM:SS or H:MM:SS
        const formatDuration = (seconds: number): string => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          
          if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          }
          return `${minutes}:${secs.toString().padStart(2, '0')}`;
        };

        // Step 7: Calculate average points and average length for each selected song
        interface SongPointData {
          song: string;
          averagePoints: number;
          averageLength: string | null;
          totalAppearances: number;
          rarityPercentage: number;
        }

        const songPointData: SongPointData[] = [];

        sortedSongs.forEach(({ song, count, rarity }) => {
          // Get all entries for this song
          const songEntries = validEntries.filter(e => e.entry_song === song);

          // Group by show to handle multiple performances per show
          const showPoints = new Map<string, number[]>(); // showId -> array of points
          const showLengths = new Map<string, number>(); // showId -> total seconds (sum if multiple)

          songEntries.forEach(entry => {
            const showId = entry.entry_show;
            const set = entry.entry_set;
            const setnum = entry.entry_setnum;

            const basePoints = SET_POINTS[set] || 0;
            const points = basePoints + setnum;

            if (!showPoints.has(showId)) {
              showPoints.set(showId, []);
              showLengths.set(showId, 0);
            }
            showPoints.get(showId)!.push(points);

            // Sum lengths if multiple appearances in same show
            const lengthSeconds = parseDuration(entry.entry_length);
            if (lengthSeconds !== null) {
              showLengths.set(showId, showLengths.get(showId)! + lengthSeconds);
            }
          });

          // Calculate average points per show, then overall average
          const showAverages: number[] = [];
          showPoints.forEach((pointsArray) => {
            // Average points for this show (handles multiple performances)
            const showAverage = pointsArray.reduce((sum, p) => sum + p, 0) / pointsArray.length;
            showAverages.push(showAverage);
          });

          // Overall average points
          const overallAverage = showAverages.reduce((sum, avg) => sum + avg, 0) / showAverages.length;

          // Calculate average length
          const showLengthValues = Array.from(showLengths.values()).filter(v => v > 0);
          let averageLength: string | null = null;
          if (showLengthValues.length > 0) {
            const totalSeconds = showLengthValues.reduce((sum, sec) => sum + sec, 0);
            const avgSeconds = totalSeconds / showLengthValues.length;
            averageLength = formatDuration(Math.round(avgSeconds));
          }

          songPointData.push({
            song,
            averagePoints: overallAverage,
            averageLength,
            totalAppearances: count,
            rarityPercentage: rarity
          });
        });

        // Step 8: Sort by average points (ascending)
        songPointData.sort((a, b) => a.averagePoints - b.averagePoints);

        // Step 9: Assign songs to sets (Option A: first N1 → Set 1, next N2 → Set 2, etc.)
        const resultEntries: SetlistEntry[] = [];
        const songSelections: SongSelectionDetail[] = [];

        let currentIndex = 0;
        includedSets.forEach(set => {
          const setStat = includedSetsStats.find(s => s.set === set);
          const numSongs = setStat?.avgSongsPerSet || 0;

          // Determine placement based on set
          let placement = '';
          if (set === '1') {
            placement = 'Set 1';
          } else if (set === '2') {
            placement = 'Set 2';
          } else if (set === '3') {
            placement = 'Set 3';
          } else if (set === '4') {
            placement = 'Set 4';
          } else if (set === '5') {
            placement = 'Set 5';
          } else if (set === 'E1') {
            placement = 'Encore 1';
          } else if (set === 'E2') {
            placement = 'Encore 2';
          } else if (set === 'E3') {
            placement = 'Encore 3';
          }

          // Take next N songs for this set
          const songsForSet = songPointData.slice(currentIndex, currentIndex + numSongs);

          songsForSet.forEach((songData, index) => {
            // Find a sample entry to get song_id and category_artwork
            const sampleEntry = validEntries.find(
              e => e.entry_song === songData.song && e.songs?.song_id
            );

            if (sampleEntry) {
              // Calculate position within set (based on average points relative to other songs in set)
              // Since songs are already sorted by average points, we can use index + 1
              const positionInSet = index + 1;
              
              // Determine placement: first song = opener, last song = closer, encore = encore
              let finalPlacement = placement;
              if (set.startsWith('E')) {
                // Encores: keep as "Encore 1", "Encore 2", "Encore 3"
                finalPlacement = placement;
              } else {
                // Regular sets: mark opener and closer
                if (index === 0) {
                  // First song in set = opener
                  finalPlacement = `${placement} Opener`;
                } else if (index === songsForSet.length - 1) {
                  // Last song in set = closer
                  finalPlacement = `${placement} Closer`;
                } else {
                  // Middle songs = just the set name
                  finalPlacement = placement;
                }
              }

              resultEntries.push({
                entry_song: songData.song,
                entry_short: null,
                entry_segue: null,
                entry_placement: finalPlacement,
                entry_setorder: positionInSet,
                entry_set: set,
                entry_setnum: positionInSet,
                averageLength: songData.averageLength,
                songs: {
                  song_id: sampleEntry.songs?.song_id || '',
                  category_artwork: sampleEntry.songs?.categories?.category_artwork || null
                }
              });

              songSelections.push({
                song: songData.song,
                assignedSet: set,
                totalAppearances: songData.totalAppearances,
                averagePoints: songData.averagePoints,
                rarityPercentage: songData.rarityPercentage
              });
            }
          });

          currentIndex += numSongs;
        });

        // Sort result entries by set order, then by setnum (already sorted within sets)
        resultEntries.sort((a, b) => {
          const setIndexA = SET_ORDER.indexOf(a.entry_set);
          const setIndexB = SET_ORDER.indexOf(b.entry_set);
          if (setIndexA !== setIndexB) {
            return setIndexA - setIndexB;
          }
          return a.entry_setnum - b.entry_setnum;
        });

        setAverageSetlist(resultEntries);
        setStats({
          totalCanonicalShows: canonicalShows.length,
          totalSetlistEntries: validEntries.length,
          includedSets: includedSetsStats,
          totalUniqueSongs: allUniqueSongs.size,
          threshold: SET_INCLUSION_THRESHOLD * 100,
          songSelections: songSelections
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error calculating average setlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate average setlist');
        setAverageSetlist([]);
        setStats(null);
        setIsLoading(false);
      }
    }

    calculateAverageSetlist();
  }, [showsKey, type]);

  return {
    averageSetlist,
    stats,
    isLoading,
    error
  };
}
