import { supabase } from '../lib/supabase';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, LongestSong, LiberatedSong } from '../types/home';
import { timeToSeconds } from './tourUtils';

const BATCH_SIZE = 1000;

// Generic batch fetching utility
export const fetchAllData = async <T>(
  buildQuery: (from: number, batchSize: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> => {
  const allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await buildQuery(from, BATCH_SIZE);
    if (error) throw error;

    allData.push(...(data || []));
    
    if (!data || data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      from += BATCH_SIZE;
    }
  }

  return allData;
};

// Build base query with year filter
const buildYearFilter = (query: any, selectedYear: number | string) => {
  if (selectedYear !== 'all-time') {
    return query
      .gte('shows.show_date', `${selectedYear}-01-01`)
      .lte('shows.show_date', `${selectedYear}-12-31`);
  }
  return query;
};

// Fetch top songs
export const fetchTopSongsData = async (selectedYear: number | string): Promise<TopSong[]> => {
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = supabase
      .from('setlist_entries')
      .select(`
        entry_song,
        songs!inner(
          song_id,
          song_category,
          categories!inner(
            category_canonid,
            category_artwork
          )
        ),
        entry_show,
        shows!inner(
          show_date,
          show_group,
          show_canonid
        )
      `)
      .eq('shows.show_group', 'Goose')
      .not('shows.show_canonid', 'is', null);
    
    query = buildYearFilter(query, selectedYear);
    return query.range(from, from + batchSize - 1);
  });

  const songShowCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
    const songId = entry.songs.song_id;
    const showId = entry.entry_show;

    if (!acc[songId]) {
      acc[songId] = {
        song: entry.entry_song,
        song_id: songId,
        shows: new Set([showId]),
        category_canonid: entry.songs.categories.category_canonid,
        category_artwork: entry.songs.categories.category_artwork
      };
    } else {
      acc[songId].shows.add(showId);
    }
    return acc;
  }, {});

  return Object.values(songShowCounts)
    .map((item: any) => ({
      song: item.song,
      song_id: item.song_id,
      play_count: item.shows.size,
      category_canonid: item.category_canonid,
      category_artwork: item.category_artwork
    }))
    .sort((a: any, b: any) => {
      if (b.play_count !== a.play_count) {
        return b.play_count - a.play_count;
      }
      if (a.category_canonid !== b.category_canonid) {
        return a.category_canonid - b.category_canonid;
      }
      return a.song.localeCompare(b.song);
    })
    .slice(0, 10);
};

// Fetch placement-based stats (openers, closers, encores)
const fetchPlacementData = async (
  selectedYear: number | string,
  placement: string | string[]
): Promise<ShowOpener[]> => {
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = supabase
      .from('setlist_entries')
      .select(`
        entry_song,
        songs!inner(
          song_id,
          song_category,
          categories!inner(
            category_canonid,
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid
        )
      `)
      .eq('shows.show_group', 'Goose')
      .not('shows.show_canonid', 'is', null);
    
    if (Array.isArray(placement)) {
      query = query.in('entry_placement', placement);
    } else {
      query = query.eq('entry_placement', placement);
    }
    
    query = buildYearFilter(query, selectedYear);
    return query.range(from, from + batchSize - 1);
  });

  const counts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
    const songName = entry.entry_song;
    if (!acc[songName]) {
      acc[songName] = {
        song_name: songName,
        song_id: entry.songs.song_id,
        times_played: 1,
        category_canonid: entry.songs.categories.category_canonid,
        category_artwork: entry.songs.categories.category_artwork
      };
    } else {
      acc[songName].times_played++;
    }
    return acc;
  }, {});

  return Object.values(counts)
    .sort((a: any, b: any) => {
      if (b.times_played !== a.times_played) {
        return b.times_played - a.times_played;
      }
      if (a.category_canonid !== b.category_canonid) {
        return a.category_canonid - b.category_canonid;
      }
      return a.song_name.localeCompare(b.song_name);
    })
    .slice(0, 10);
};

export const fetchShowOpenersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, 'Set 1 Opener');

export const fetchSetOpenersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener']);

export const fetchSetClosersData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer']);

export const fetchEncoresData = (selectedYear: number | string) =>
  fetchPlacementData(selectedYear, ['Encore 1', 'Encore 2', 'Encore 3']);

// Fetch longest songs (2025 only)
export const fetchLongestSongsData = async (selectedYear: number | string): Promise<LongestSong[]> => {
  const allData = await fetchAllData(async (from, batchSize) => {
    let query = supabase
      .from('setlist_entries')
      .select(`
        entry_song,
        entry_length,
        entry_show,
        songs!inner(
          song_id,
          song_category,
          categories!inner(
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid,
          show_venue_location
        )
      `)
      .eq('shows.show_group', 'Goose')
      .not('shows.show_canonid', 'is', null)
      .not('entry_length', 'is', null);
    
    query = buildYearFilter(query, selectedYear);
    return query.range(from, from + batchSize - 1);
  });

  const sortedData = allData.sort((a: any, b: any) => {
    const aSeconds = timeToSeconds(a.entry_length);
    const bSeconds = timeToSeconds(b.entry_length);
    return bSeconds - aSeconds;
  }).slice(0, 10);

  return sortedData.map((entry: any) => ({
    song: entry.entry_song,
    song_id: entry.songs?.song_id || '',
    entry_length: entry.entry_length,
    show_date: entry.shows?.show_date,
    show_id: entry.entry_show,
    venue_location: entry.shows?.show_venue_location,
    category_artwork: entry.songs?.categories?.category_artwork
  }));
};

// Fetch liberated songs (2025 only)
export const fetchLiberatedSongsData = async (selectedYear: number | string): Promise<LiberatedSong[]> => {
  if (selectedYear !== 2025) {
    return [];
  }

  const allData = await fetchAllData(async (from, batchSize) => {
    return supabase
      .from('setlist_entries')
      .select(`
        entry_song,
        last_count,
        last_show_date,
        last_show_id,
        entry_show,
        entry_length,
        songs!inner(
          song_id,
          song_category,
          categories!inner(
            category_artwork
          )
        ),
        shows!inner(
          show_date,
          show_group,
          show_canonid,
          show_venue_location
        )
      `)
      .eq('shows.show_group', 'Goose')
      .not('shows.show_canonid', 'is', null)
      .gte('shows.show_date', '2025-01-01')
      .lte('shows.show_date', '2025-12-31')
      .not('last_count', 'is', null)
      .not('last_show_date', 'is', null)
      .range(from, from + batchSize - 1);
  });

  const extractNumberFromLastCount = (lastCount: string | null): number => {
    if (!lastCount) return 0;
    if (lastCount.trim().toLowerCase() === 'debut') {
      return 0;
    }
    const match = lastCount.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return allData
    .map((entry: any) => ({
      song: entry.entry_song,
      song_id: entry.songs?.song_id || '',
      last_count: entry.last_count,
      last_show_date: entry.last_show_date,
      last_show_id: entry.last_show_id,
      entry_length: entry.entry_length,
      show_date: entry.shows?.show_date,
      show_id: entry.entry_show,
      venue_location: entry.shows?.show_venue_location,
      category_artwork: entry.songs?.categories?.category_artwork,
      _extractedCount: extractNumberFromLastCount(entry.last_count)
    }))
    .sort((a: any, b: any) => b._extractedCount - a._extractedCount)
    .slice(0, 10)
    .map(({ _extractedCount, ...entry }: any) => entry)
    .sort((a: any, b: any) => {
      const countA = extractNumberFromLastCount(a.last_count);
      const countB = extractNumberFromLastCount(b.last_count);
      return countB - countA;
    });
};

