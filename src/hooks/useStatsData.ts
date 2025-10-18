import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong } from '../types/home';

export const useStatsData = (selectedYear: number | string) => {
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [showOpeners, setShowOpeners] = useState<ShowOpener[]>([]);
  const [setOpeners, setSetOpeners] = useState<SetOpener[]>([]);
  const [setClosers, setSetClosers] = useState<SetCloser[]>([]);
  const [encores, setEncores] = useState<Encore[]>([]);
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([]);
  
  const [loadingTopSongs, setLoadingTopSongs] = useState(true);
  const [loadingShowOpeners, setLoadingShowOpeners] = useState(true);
  const [loadingSetOpeners, setLoadingSetOpeners] = useState(true);
  const [loadingSetClosers, setLoadingSetClosers] = useState(true);
  const [loadingEncores, setLoadingEncores] = useState(true);
  const [loadingNotPlayed, setLoadingNotPlayed] = useState(true);

  const fetchTopSongs = async () => {
    try {
      const allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
        
        if (selectedYear !== 'all-time') {
          query = query
            .gte('shows.show_date', `${selectedYear}-01-01`)
            .lte('shows.show_date', `${selectedYear}-12-31`);
        }
        
        const { data, error } = await query.range(from, from + batchSize - 1);

        if (error) throw error;

        allData.push(...(data || []));
        
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

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

      const processedSongs = Object.values(songShowCounts)
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
        .slice(0, 8);

      setTopSongs(processedSongs);
    } catch (error) {
      console.error('Error fetching top songs:', error);
    } finally {
      setLoadingTopSongs(false);
    }
  };

  const fetchShowOpeners = async () => {
    try {
      const allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
          .not('shows.show_canonid', 'is', null)
          .eq('entry_placement', 'Set 1 Opener');
        
        if (selectedYear !== 'all-time') {
          query = query
            .gte('shows.show_date', `${selectedYear}-01-01`)
            .lte('shows.show_date', `${selectedYear}-12-31`);
        }
        
        const { data, error } = await query.range(from, from + batchSize - 1);

        if (error) throw error;

        allData.push(...(data || []));
        
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
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

      const processedOpeners = Object.values(openerCounts)
        .sort((a: any, b: any) => {
          if (b.times_played !== a.times_played) {
            return b.times_played - a.times_played;
          }
          if (a.category_canonid !== b.category_canonid) {
            return a.category_canonid - b.category_canonid;
          }
          return a.song_name.localeCompare(b.song_name);
        })
        .slice(0, 8);

      setShowOpeners(processedOpeners);
    } catch (error) {
      console.error('Error fetching show openers:', error);
    } finally {
      setLoadingShowOpeners(false);
    }
  };

  const fetchSetOpeners = async () => {
    try {
      const allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
          .not('shows.show_canonid', 'is', null)
          .in('entry_placement', ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener']);
        
        if (selectedYear !== 'all-time') {
          query = query
            .gte('shows.show_date', `${selectedYear}-01-01`)
            .lte('shows.show_date', `${selectedYear}-12-31`);
        }
        
        const { data, error } = await query.range(from, from + batchSize - 1);

        if (error) throw error;

        allData.push(...(data || []));
        
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
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

      const processedOpeners = Object.values(openerCounts)
        .sort((a: any, b: any) => {
          if (b.times_played !== a.times_played) {
            return b.times_played - a.times_played;
          }
          if (a.category_canonid !== b.category_canonid) {
            return a.category_canonid - b.category_canonid;
          }
          return a.song_name.localeCompare(b.song_name);
        })
        .slice(0, 8);

      setSetOpeners(processedOpeners);
    } catch (error) {
      console.error('Error fetching set openers:', error);
    } finally {
      setLoadingSetOpeners(false);
    }
  };

  const fetchSetClosers = async () => {
    try {
      const allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
          .not('shows.show_canonid', 'is', null)
          .in('entry_placement', ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer']);
        
        if (selectedYear !== 'all-time') {
          query = query
            .gte('shows.show_date', `${selectedYear}-01-01`)
            .lte('shows.show_date', `${selectedYear}-12-31`);
        }
        
        const { data, error } = await query.range(from, from + batchSize - 1);

        if (error) throw error;

        allData.push(...(data || []));
        
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      const closerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
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

      const processedClosers = Object.values(closerCounts)
        .sort((a: any, b: any) => {
          if (b.times_played !== a.times_played) {
            return b.times_played - a.times_played;
          }
          if (a.category_canonid !== b.category_canonid) {
            return a.category_canonid - b.category_canonid;
          }
          return a.song_name.localeCompare(b.song_name);
        })
        .slice(0, 8);

      setSetClosers(processedClosers);
    } catch (error) {
      console.error('Error fetching set closers:', error);
    } finally {
      setLoadingSetClosers(false);
    }
  };

  const fetchEncores = async () => {
    try {
      const allData = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
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
          .not('shows.show_canonid', 'is', null)
          .in('entry_placement', ['Encore 1', 'Encore 2', 'Encore 3']);
        
        if (selectedYear !== 'all-time') {
          query = query
            .gte('shows.show_date', `${selectedYear}-01-01`)
            .lte('shows.show_date', `${selectedYear}-12-31`);
        }
        
        const { data, error } = await query.range(from, from + batchSize - 1);

        if (error) throw error;

        allData.push(...(data || []));
        
        if (!data || data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      }

      const encoreCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
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

      const processedEncores = Object.values(encoreCounts)
        .sort((a: any, b: any) => {
          if (b.times_played !== a.times_played) {
            return b.times_played - a.times_played;
          }
          if (a.category_canonid !== b.category_canonid) {
            return a.category_canonid - b.category_canonid;
          }
          return a.song_name.localeCompare(b.song_name);
        })
        .slice(0, 8);

      setEncores(processedEncores);
    } catch (error) {
      console.error('Error fetching encores:', error);
    } finally {
      setLoadingEncores(false);
    }
  };

  const fetchNotPlayedSongs = async () => {
    if (selectedYear === 'all-time') {
      setNotPlayedSongs([]);
      setLoadingNotPlayed(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_most_common_not_played_songs', { 
          selected_year: selectedYear 
        });
  
      if (error) throw error;
  
      setNotPlayedSongs(data || []);
    } catch (error) {
      console.error('Error fetching not played songs:', error);
    } finally {
      setLoadingNotPlayed(false);
    }
  };

  useEffect(() => {
    setLoadingTopSongs(true);
    setLoadingShowOpeners(true);
    setLoadingSetOpeners(true);
    setLoadingSetClosers(true);
    setLoadingEncores(true);
    if (selectedYear !== 'all-time') {
      setLoadingNotPlayed(true);
    }

    fetchTopSongs();
    fetchShowOpeners();
    fetchSetOpeners();
    fetchSetClosers();
    fetchEncores();
    fetchNotPlayedSongs();
  }, [selectedYear]);

  const isAnyStatLoading = loadingTopSongs || loadingShowOpeners || loadingSetOpeners || loadingSetClosers || loadingEncores || loadingNotPlayed;

  return {
    topSongs,
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    notPlayedSongs,
    isAnyStatLoading
  };
};
