import { supabase } from '../lib/supabase';
import { ShowStat } from '../types/home';
import { timeToSeconds } from './tourUtils';

const BATCH_SIZE = 1000;

interface ShowWithLength {
  show_id: string;
  show_date: string;
  show_subvenue?: string;
  show_venue_location?: string;
  show_tour?: string;
  show_rarity?: number;
  show_gap?: number;
  show_length: string | null;
  show_canonid?: number | null;
  venue_id?: string;
  tour_id?: string;
  show_rarity_formatted: string | null;
  show_gap_formatted: string | null;
}

interface ShowStatsResult {
  longest: ShowStat[];
  lowestRarity: ShowStat[];
  highestGap: ShowStat[];
  highestAttended: ShowStat[];
  highestRated: ShowStat[];
}

// Format date helper
const formatDate = (dateStr: string): string => {
  return dateStr
    .split('-')
    .slice(1)
    .concat(dateStr.substring(2, 4))
    .join('.');
};

// Calculate show length from setlist entries
const calculateShowLength = (entries: any[]): string | null => {
  let totalSeconds = 0;
  
  entries.forEach((entry: any) => {
    if (entry.entry_length) {
      const parts = entry.entry_length.split(':').map(Number);
      if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
      } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        totalSeconds += (minutes * 60) + seconds;
      }
    }
  });

  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return null;
};

// Extract venue_id from nested relationship
const extractVenueId = (show: any): string | undefined => {
  if (!show.subvenues) return undefined;
  
  const subvenues = Array.isArray(show.subvenues) ? show.subvenues : [show.subvenues];
  const subvenue = subvenues[0];
  if (!subvenue?.venues) return undefined;
  
  const venues = Array.isArray(subvenue.venues) ? subvenue.venues : [subvenue.venues];
  return venues[0]?.venue_id;
};

// Extract tour_id from nested relationship
const extractTourId = (show: any): string | undefined => {
  if (!show.tours) return undefined;
  const tours = Array.isArray(show.tours) ? show.tours : [show.tours];
  return tours[0]?.tour_id;
};

// Fetch all shows for the year
const fetchYearShows = async (selectedYear: number | string): Promise<any[]> => {
  // Handle all-time case - fetch all shows
  if (selectedYear === 'all-time') {
    const allShowsData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_id,
          show_date,
          show_subvenue,
          show_venue_location,
          show_tour,
          show_rarity,
          show_gap,
          show_canonid,
          setlist_entries (
            entry_length
          ),
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          ),
          tours:show_tour(
            tour_id
          )
        `)
        .eq('show_group', 'Goose')
        .not('show_canonid', 'is', null)
        .range(from, from + BATCH_SIZE - 1);

      if (error) throw error;

      allShowsData.push(...(data || []));
      
      if (!data || data.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        from += BATCH_SIZE;
      }
    }

    return allShowsData;
  }

  // Handle specific year case
  const year = typeof selectedYear === 'number' ? selectedYear : parseInt(selectedYear, 10);
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  const allShowsData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        show_id,
        show_date,
        show_subvenue,
        show_venue_location,
        show_tour,
        show_rarity,
        show_gap,
        show_canonid,
        setlist_entries (
          entry_length
        ),
        subvenues:show_subvenue(
          venues:subvenue_venue(
            venue_id
          )
        ),
        tours:show_tour(
          tour_id
        )
      `)
      .eq('show_group', 'Goose')
      .not('show_canonid', 'is', null)
      .gte('show_date', startDate)
      .lte('show_date', endDate)
      .range(from, from + BATCH_SIZE - 1);

    if (error) throw error;

    allShowsData.push(...(data || []));
    
    if (!data || data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      from += BATCH_SIZE;
    }
  }

  return allShowsData;
};

// Process shows with calculated lengths
const processShowsWithLength = (allShowsData: any[]): ShowWithLength[] => {
  return allShowsData.map((show: any) => {
    const entries = Array.isArray(show.setlist_entries) ? show.setlist_entries : [];
    const show_length = calculateShowLength(entries);

    return {
      ...show,
      show_length,
      venue_id: extractVenueId(show),
      tour_id: extractTourId(show),
      show_rarity_formatted: show.show_rarity !== null && show.show_rarity !== undefined
        ? `${show.show_rarity.toFixed(2)}%`
        : null,
      show_gap_formatted: show.show_gap !== null && show.show_gap !== undefined
        ? show.show_gap.toFixed(2)
        : null
    };
  });
};

// Fetch attendee counts for shows
const fetchAttendeeCounts = async (showIds: string[]): Promise<Record<string, number>> => {
  const attendeeCounts: Record<string, number> = {};
  showIds.forEach((id: string) => {
    attendeeCounts[id] = 0;
  });

  if (showIds.length === 0) return attendeeCounts;

  // Use smaller chunk size to avoid URL length issues
  const CHUNK_SIZE = 500;
  const idChunks: string[][] = [];
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    idChunks.push(showIds.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of idChunks) {
    try {
      let attendeeFrom = 0;
      let attendeeHasMore = true;

      while (attendeeHasMore) {
        const { data: attendeeData, error: attendeeError } = await supabase
          .from('user_attended_shows')
          .select('show_id')
          .in('show_id', chunk)
          .range(attendeeFrom, attendeeFrom + BATCH_SIZE - 1);

        if (attendeeError) {
          console.error('Error fetching attendee data for chunk:', attendeeError);
          attendeeHasMore = false;
          continue; // Skip this chunk and continue with others
        }

        if (attendeeData && attendeeData.length > 0) {
          attendeeData.forEach((record: any) => {
            if (record?.show_id) {
              attendeeCounts[record.show_id] = (attendeeCounts[record.show_id] || 0) + 1;
            }
          });
        }

        // Check if we got fewer records than the batch size, meaning we're done
        if (!attendeeData || attendeeData.length < BATCH_SIZE) {
          attendeeHasMore = false;
        } else {
          attendeeFrom += BATCH_SIZE;
        }
      }
    } catch (error) {
      console.error('Error processing attendee chunk:', error);
      // Continue with next chunk
    }
  }

  return attendeeCounts;
};

// Fetch show ratings
const fetchShowRatings = async (showIds: string[]): Promise<Record<string, number>> => {
  const showRatings: Record<string, number> = {};
  showIds.forEach((id: string) => {
    showRatings[id] = 0;
  });

  if (showIds.length === 0) return showRatings;

  // Use smaller chunk size to avoid URL length issues
  const CHUNK_SIZE = 500;
  const idChunks: string[][] = [];
  for (let i = 0; i < showIds.length; i += CHUNK_SIZE) {
    idChunks.push(showIds.slice(i, i + CHUNK_SIZE));
  }

  const allRatingsData: any[] = [];

  for (const chunk of idChunks) {
    try {
      let ratingsFrom = 0;
      let ratingsHasMore = true;

      while (ratingsHasMore) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('show_ratings')
          .select('show_id, rating')
          .in('show_id', chunk)
          .range(ratingsFrom, ratingsFrom + BATCH_SIZE - 1);

        if (ratingsError) {
          console.error('Error fetching ratings for chunk:', ratingsError);
          ratingsHasMore = false;
          continue; // Skip this chunk and continue with others
        }

        if (ratingsData && ratingsData.length > 0) {
          allRatingsData.push(...ratingsData);
        }

        if (!ratingsData || ratingsData.length < BATCH_SIZE) {
          ratingsHasMore = false;
        } else {
          ratingsFrom += BATCH_SIZE;
        }
      }
    } catch (error) {
      console.error('Error processing ratings chunk:', error);
      // Continue with next chunk
    }
  }

  // Calculate averages for each show
  showIds.forEach((id: string) => {
    const showRatingsData = allRatingsData.filter((r: any) => r?.show_id === id);
    if (showRatingsData.length > 0) {
      const average = showRatingsData.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / showRatingsData.length;
      showRatings[id] = Math.round(average * 100) / 100;
    }
  });

  return showRatings;
};

// Fetch show length ranks (all-time)
const fetchShowLengthRanks = async (): Promise<Record<string, number>> => {
  let allCanonicalShows: any[] = [];
  let rankFrom = 0;
  let rankHasMore = true;

  while (rankHasMore) {
    const { data: rankData, error: rankError } = await supabase
      .from('shows')
      .select('show_id, show_length')
      .not('show_canonid', 'is', null)
      .not('show_length', 'is', null)
      .range(rankFrom, rankFrom + BATCH_SIZE - 1);

    if (rankError) throw rankError;

    if (rankData) {
      allCanonicalShows.push(...rankData);
    }

    if (!rankData || rankData.length < BATCH_SIZE) {
      rankHasMore = false;
    } else {
      rankFrom += BATCH_SIZE;
    }
  }

  const showsWithSeconds = allCanonicalShows
    .map((s: any) => ({
      show_id: s.show_id,
      total_seconds: timeToSeconds(s.show_length)
    }))
    .sort((a: any, b: any) => b.total_seconds - a.total_seconds);

  const showLengthRanks: Record<string, number> = {};
  showsWithSeconds.forEach((s: any, index: number) => {
    if (index < 25) {
      showLengthRanks[s.show_id] = index + 1;
    }
  });

  return showLengthRanks;
};

// Generate show stat entries
const generateShowStat = (
  show: ShowWithLength,
  value: string,
  sortValue: number,
  showLengthRank?: number | null
): ShowStat & { _canonid?: number | null } => ({
  show_id: show.show_id,
  show_date: formatDate(show.show_date),
  show_subvenue: show.show_subvenue,
  show_venue_location: show.show_venue_location,
  show_tour: show.show_tour,
  value,
  venue_id: show.venue_id,
  tour_id: show.tour_id,
  show_length_rank: showLengthRank || null,
  _canonid: show.show_canonid || null
});

// Main function to fetch all show stats
export const fetchShowStatsData = async (selectedYear: number | string): Promise<ShowStatsResult> => {
  try {
    // Fetch shows for the selected year
    const allShowsData = await fetchYearShows(selectedYear);
    const showsWithLength = processShowsWithLength(allShowsData);

    const showIds = showsWithLength.map((s: any) => s.show_id);
    
    // Fetch parallel data with error handling
    let attendeeCounts: Record<string, number> = {};
    let showRatings: Record<string, number> = {};
    let showLengthRanks: Record<string, number> = {};

    try {
      [attendeeCounts, showRatings, showLengthRanks] = await Promise.all([
        fetchAttendeeCounts(showIds),
        fetchShowRatings(showIds),
        fetchShowLengthRanks()
      ]);
    } catch (error) {
      console.error('Error fetching parallel data for show stats:', error);
      // Continue with empty data - stats will still work, just without attendee/rating data
    }

    // Generate stats
    const longest = showsWithLength
      .filter((s: any) => s.show_length)
      .map((s: any) => ({
        ...generateShowStat(s, s.show_length!, timeToSeconds(s.show_length!), showLengthRanks[s.show_id]),
        _sortValue: timeToSeconds(s.show_length!)
      }))
      .sort((a: any, b: any) => {
        if (b._sortValue !== a._sortValue) {
          return b._sortValue - a._sortValue;
        }
        // Secondary sort by show_canonid ascending
        const canonidA = a._canonid ?? 0;
        const canonidB = b._canonid ?? 0;
        return canonidA - canonidB;
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }: any) => rest);

    const lowestRarity = showsWithLength
      .filter((s: any) => s.show_rarity !== null && s.show_rarity !== undefined)
      .map((s: any) => ({
        ...generateShowStat(s, s.show_rarity_formatted!, s.show_rarity!),
        _sortValue: s.show_rarity!
      }))
      .sort((a: any, b: any) => {
        if (a._sortValue !== b._sortValue) {
          return a._sortValue - b._sortValue;
        }
        // Secondary sort by show_canonid ascending
        const canonidA = a._canonid ?? 0;
        const canonidB = b._canonid ?? 0;
        return canonidA - canonidB;
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }: any) => rest);

    const highestGap = showsWithLength
      .filter((s: any) => s.show_gap !== null && s.show_gap !== undefined)
      .map((s: any) => ({
        ...generateShowStat(s, s.show_gap_formatted!, s.show_gap!),
        _sortValue: s.show_gap!
      }))
      .sort((a: any, b: any) => {
        if (b._sortValue !== a._sortValue) {
          return b._sortValue - a._sortValue;
        }
        // Secondary sort by show_canonid ascending
        const canonidA = a._canonid ?? 0;
        const canonidB = b._canonid ?? 0;
        return canonidA - canonidB;
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }: any) => rest);

    const highestAttended = showsWithLength
      .filter((s: any) => attendeeCounts[s.show_id] > 0)
      .map((s: any) => ({
        ...generateShowStat(s, attendeeCounts[s.show_id].toString(), attendeeCounts[s.show_id]),
        _sortValue: attendeeCounts[s.show_id]
      }))
      .sort((a: any, b: any) => {
        if (b._sortValue !== a._sortValue) {
          return b._sortValue - a._sortValue;
        }
        // Secondary sort by show_canonid ascending
        const canonidA = a._canonid ?? 0;
        const canonidB = b._canonid ?? 0;
        return canonidA - canonidB;
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }: any) => rest);

    const highestRated = showsWithLength
      .filter((s: any) => showRatings[s.show_id] > 0)
      .map((s: any) => ({
        ...generateShowStat(s, showRatings[s.show_id].toFixed(2), showRatings[s.show_id]),
        _sortValue: showRatings[s.show_id]
      }))
      .sort((a: any, b: any) => {
        if (b._sortValue !== a._sortValue) {
          return b._sortValue - a._sortValue;
        }
        // Secondary sort by show_canonid ascending
        const canonidA = a._canonid ?? 0;
        const canonidB = b._canonid ?? 0;
        return canonidA - canonidB;
      })
      .slice(0, 10)
      .map(({ _sortValue, _canonid, ...rest }: any) => rest);

    return {
      longest,
      lowestRarity,
      highestGap,
      highestAttended,
      highestRated
    };
  } catch (error) {
    console.error('Error in fetchShowStatsData:', error);
    // Return empty stats on error
    return {
      longest: [],
      lowestRarity: [],
      highestGap: [],
      highestAttended: [],
      highestRated: []
    };
  }
};

