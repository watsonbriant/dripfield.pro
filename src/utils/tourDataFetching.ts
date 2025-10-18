// Data fetching functions for tour data

import { supabase } from '../lib/supabase';

export const fetchTours = async () => {
  const { data, error } = await supabase
    .from('tours')
    .select('tour, tour_canonid, tour_id, tour_showfields')
    .order('tour_canonid', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const fetchSongIds = async () => {
  const { data, error } = await supabase
    .from('songs')
    .select('song, song_id');

  if (error) throw error;

  const songMap: { [songName: string]: string } = {};
  data?.forEach(songData => {
    songMap[songData.song] = songData.song_id;
  });

  return songMap;
};

export const fetchAttendedShows = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_attended_shows')
    .select('show_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(item => item.show_id);
};

export const fetchAttendeeCounts = async (showIds: string[]) => {
  if (showIds.length === 0) return {};

  const { count, error: countError } = await supabase
    .from('user_attended_shows')
    .select('*', { count: 'exact', head: true })
    .in('show_id', showIds);
  
  if (countError) throw countError;
  
  const batchSize = 1000;
  const totalBatches = Math.ceil((count || 0) / batchSize);
  let allData: any[] = [];
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize - 1, (count || 0) - 1);
    
    const { data, error } = await supabase
      .from('user_attended_shows')
      .select('show_id')
      .in('show_id', showIds)
      .range(start, end);
    
    if (error) throw error;
    
    if (data) {
      allData = [...allData, ...data];
    }
  }
  
  const counts: Record<string, number> = {};
  showIds.forEach(showId => {
    counts[showId] = 0;
  });
  
  allData.forEach(record => {
    counts[record.show_id] = (counts[record.show_id] || 0) + 1;
  });
  
  return counts;
};

export const fetchShowsWithSetlists = async (showIds: string[]) => {
  const { data, error } = await supabase
    .from('show_setlists')
    .select('show_id')
    .in('show_id', showIds);
  
  if (error) throw error;
  
  return new Set(data?.map(item => item.show_id) || []);
};

export const fetchShowsWithReleases = async (showIds: string[]) => {
  const { count, error: countError } = await supabase
    .from('releases_shows')
    .select('*', { count: 'exact', head: true })
    .in('show_id', showIds);
  
  if (countError) throw countError;
  
  const batchSize = 1000;
  const totalBatches = Math.ceil((count || 0) / batchSize);
  let allReleaseShows: any[] = [];
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize - 1, (count || 0) - 1);
    
    const { data, error } = await supabase
      .from('releases_shows')
      .select('show_id')
      .in('show_id', showIds)
      .range(start, end);
    
    if (error) throw error;
    
    if (data) {
      allReleaseShows = [...allReleaseShows, ...data];
    }
  }
  
  return new Set(allReleaseShows.map(item => item.show_id));
};

export const fetchShowRatings = async (showIds: string[]) => {
  const { data, error } = await supabase
    .from('show_ratings')
    .select('show_id, rating')
    .in('show_id', showIds);
  
  if (error) throw error;
  
  const ratings: Record<string, number> = {};
  showIds.forEach(showId => {
    const showRatingsData = data?.filter(r => r.show_id === showId) || [];
    if (showRatingsData.length > 0) {
      const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
      ratings[showId] = Math.round(average * 100) / 100;
    } else {
      ratings[showId] = 0;
    }
  });
  
  return ratings;
};

export const fetchMainTourData = async (currentTour: string) => {
  const showsPromise = supabase
    .from('shows')
    .select(`
      show_iscanon,
      show_tour,
      show_id,
      show_date,
      show_group,
      show_subvenue,
      show_detail,
      show_alert,
      show_canonid,
      show_venue_location,
      show_subvenue_venue,
      show_wl_link,
      show_rarity,
      show_gap,
      subvenues:show_subvenue(
        venues:subvenue_venue(
          venue_id
        )
      ),
      setlist_entries (
        entry_length,
        entry_song,
        entry_short,
        last_count,
        times_played_num,
        shows_since_debut_num,
        songs (
          song_category,
          song_originalartist,
          categories (
            category_canonid,
            category_artwork
          )
        )
      )
    `)
    .eq('show_tour', currentTour)
    .order('show_date', { ascending: true })
    .order('show_canonid', { ascending: true, nullsFirst: true })
    .order('show_group', { ascending: true });

  const placementsPromise = supabase
    .from('placements')
    .select('placements, placement_order')
    .order('placement_order');

  const slotsPromise = supabase
    .from('shows')
    .select(`
      show_id,
      show_date,
      show_canonid,
      show_group,
      setlist_entries (
        entry_placement,
        entry_song,
        entry_setnum
      )
    `)
    .eq('show_tour', currentTour)
    .order('show_date', { ascending: true })
    .order('show_canonid', { ascending: true, nullsFirst: true })
    .order('show_group', { ascending: true });

  const [showsResult, placementsResult, slotsResult] = await Promise.all([
    showsPromise,
    placementsPromise,
    slotsPromise
  ]);

  if (showsResult.error) throw showsResult.error;
  if (placementsResult.error) throw placementsResult.error;
  if (slotsResult.error) throw slotsResult.error;

  return {
    shows: showsResult.data,
    placements: placementsResult.data,
    slots: slotsResult.data
  };
};

export const fetchPlacementData = async (showIds: string[]) => {
  if (showIds.length === 0) return { entries: [], songs: [] };

  const { data: entriesData, error: entriesError } = await supabase
    .from('setlist_entries')
    .select(`
      entry_id,
      entry_placement,
      entry_song,
      entry_show
    `)
    .in('entry_show', showIds);

  if (entriesError) throw entriesError;

  const uniqueSongs = [...new Set(entriesData?.map(entry => entry.entry_song) || [])];

  const { data: songsData, error: songsError } = await supabase
    .from('songs')
    .select(`
      song,
      song_category,
      categories (
        category_canonid,
        category_artwork
      )
    `)
    .in('song', uniqueSongs);

  if (songsError) throw songsError;

  return { entries: entriesData || [], songs: songsData || [] };
};
