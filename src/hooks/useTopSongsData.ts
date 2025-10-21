import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SongStat } from './useSetlistGameShowData';

export function useTopSongsData(showId: string | undefined) {
  const [topSongs, setTopSongs] = useState<SongStat[]>([]);

  useEffect(() => {
    async function fetchTopSongs() {
      if (!showId) return;

      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopSongs([]);
          return;
        }

        const submissionIds = submissionsData.map(sub => sub.submission_id);

        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('song')
          .in('submission_id', submissionIds);

        if (picksError) {
          console.error('Error fetching song picks:', picksError);
          return;
        }

        const songCounts: Record<string, number> = {};
        picksData?.forEach(pick => {
          if (!songCounts[pick.song]) {
            songCounts[pick.song] = 0;
          }
          songCounts[pick.song]++;
        });

        // Fetch song categories with pagination
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error fetching song count:', countError);
          return;
        }
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allSongData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select(`
              song, 
              song_id,
              song_category,
              categories:song_category(
                category,
                category_canonid,
                category_artwork
              )
            `)
            .order('song', { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`Error fetching song batch ${i + 1}:`, error);
            throw error;
          }
          
          if (data) {
            allSongData = [...allSongData, ...data];
          }
        }

        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        allSongData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = song.categories.category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = song.categories.category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        const songStatsArray: SongStat[] = Object.entries(songCounts).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        const sortedSongs = [...songStatsArray].sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }
          return a.song.localeCompare(b.song);
        });

        const top10Songs = sortedSongs.slice(0, 8);
        setTopSongs(top10Songs);
      } catch (error) {
        console.error('Error fetching top songs:', error);
      }
    }

    fetchTopSongs();
  }, [showId]);

  return topSongs;
}

export function useTopOpenersData(showId: string | undefined) {
  const [topOpeners, setTopOpeners] = useState<SongStat[]>([]);

  useEffect(() => {
    async function fetchTopOpeners() {
      if (!showId) return;

      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopOpeners([]);
          return;
        }

        const submissionIds = submissionsData.map(sub => sub.submission_id);

        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('song')
          .in('submission_id', submissionIds)
          .eq('placement', 'Set 1 Opener');

        if (picksError) {
          console.error('Error fetching opener picks:', picksError);
          return;
        }

        const songCounts: Record<string, number> = {};
        picksData?.forEach(pick => {
          if (!songCounts[pick.song]) {
            songCounts[pick.song] = 0;
          }
          songCounts[pick.song]++;
        });

        // Fetch song categories with pagination
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error fetching song count:', countError);
          return;
        }
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allSongData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select(`
              song, 
              song_id,
              song_category,
              categories:song_category(
                category,
                category_canonid,
                category_artwork
              )
            `)
            .order('song', { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`Error fetching song batch ${i + 1}:`, error);
            throw error;
          }
          
          if (data) {
            allSongData = [...allSongData, ...data];
          }
        }

        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        allSongData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = song.categories.category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = song.categories.category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        const songStatsArray: SongStat[] = Object.entries(songCounts).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        const sortedSongs = [...songStatsArray].sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }
          return a.song.localeCompare(b.song);
        });

        const top10Openers = sortedSongs.slice(0, 8);
        setTopOpeners(top10Openers);
      } catch (error) {
        console.error('Error fetching top openers:', error);
      }
    }

    fetchTopOpeners();
  }, [showId]);

  return topOpeners;
}

export function useTopClosersData(showId: string | undefined) {
  const [topClosers, setTopClosers] = useState<SongStat[]>([]);

  useEffect(() => {
    async function fetchTopClosers() {
      if (!showId) return;

      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('show_id', showId);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }

        if (!submissionsData || submissionsData.length === 0) {
          setTopClosers([]);
          return;
        }

        const submissionIds = submissionsData.map(sub => sub.submission_id);
        const closerSongs: Record<string, number> = {};

        for (const subId of submissionIds) {
          const { data: lastPickData, error: lastPickError } = await supabase
            .from('setlist_game_picks')
            .select('song')
            .eq('submission_id', subId)
            .order('set', { ascending: false })
            .order('setnum', { ascending: false })
            .limit(1);

          if (lastPickError) {
            console.error('Error fetching last pick:', lastPickError);
            continue;
          }

          if (lastPickData && lastPickData.length > 0) {
            const song = lastPickData[0].song;
            if (!closerSongs[song]) {
              closerSongs[song] = 0;
            }
            closerSongs[song]++;
          }
        }

        // Fetch song categories with pagination
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error fetching song count:', countError);
          return;
        }
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allSongData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select(`
              song, 
              song_id,
              song_category,
              categories:song_category(
                category,
                category_canonid,
                category_artwork
              )
            `)
            .order('song', { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`Error fetching song batch ${i + 1}:`, error);
            throw error;
          }
          
          if (data) {
            allSongData = [...allSongData, ...data];
          }
        }

        const songCategoryMap: Record<string, number> = {};
        const songIdMap: Record<string, string> = {};
        const categoryArtworkMap: Record<string, string> = {};

        allSongData?.forEach(song => {
          if (song.categories && typeof song.categories === 'object') {
            if ('category_canonid' in song.categories) {
              songCategoryMap[song.song] = song.categories.category_canonid || 0;
            }
            if ('category_artwork' in song.categories) {
              categoryArtworkMap[song.song] = song.categories.category_artwork || '';
            }
          }
          songIdMap[song.song] = song.song_id || '';
        });

        const songStatsArray: SongStat[] = Object.entries(closerSongs).map(([song, count]) => ({
          song,
          count,
          percentage: Math.round((count / submissionsData.length) * 100),
          categoryId: songCategoryMap[song] || 0,
          song_id: songIdMap[song] || '',
          category_artwork: categoryArtworkMap[song] || ''
        }));

        const sortedSongs = [...songStatsArray].sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          if ((a.categoryId || 0) !== (b.categoryId || 0)) {
            return (a.categoryId || 0) - (b.categoryId || 0);
          }
          return a.song.localeCompare(b.song);
        });

        const top8Closers = sortedSongs.slice(0, 8);
        setTopClosers(top8Closers);
      } catch (error) {
        console.error('Error fetching top closers:', error);
      }
    }

    fetchTopClosers();
  }, [showId]);

  return topClosers;
}
