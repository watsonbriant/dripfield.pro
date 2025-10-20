import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Song = {
  song: string;
  song_id: string;
  song_category: string;
  song_categoryorder: number;
  song_originalartist: string;
};

type Category = {
  category: string;
  category_canonid: number;
  category_display_name: string;
  category_color1: string;
  category_color2: string;
  category_artwork: string;
};

type UserSongStat = {
  song_id: string;
  count: number;
  last_seen_date?: string;
};

export const useUserSongsData = (effectiveUserId: string | null) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSongStats, setUserSongStats] = useState<UserSongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingProgress(5);

      if (!effectiveUserId) {
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
        return;
      }
      
      try {
        // Fetch categories sorted by canonid with pagination
        let allCategoriesData = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('category_canonid', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allCategoriesData = [...allCategoriesData, ...data];
            page++;
            
            // Update progress based on pagination (5-15%)
            setLoadingProgress(Math.min(15, 5 + (page * 2)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        setLoadingProgress(20);
        
        // Fetch all songs with pagination
        let allSongsData = [];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('songs')
            .select('*')
            .or('song_placeholder.is.null,song_placeholder.eq.false')
            .order('song', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSongsData = [...allSongsData, ...data];
            page++;
            
            // Update progress based on pagination (20-40%)
            setLoadingProgress(Math.min(40, 20 + (page * 1)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        setLoadingProgress(45);

        // Fetch user's attended shows with pagination
        let allAttendedShowsData = [];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShowsData = [...allAttendedShowsData, ...data];
            page++;
            
            // Update progress based on pagination (45-60%)
            setLoadingProgress(Math.min(60, 45 + (page * 3)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(65);
        
        // If user has attended shows, get song stats
        if (allAttendedShowsData && allAttendedShowsData.length > 0) {
          const showIds = allAttendedShowsData.map(show => show.show_id);
          
          // Split showIds into chunks for batch processing
          const showIdChunks = [];
          const chunkSize = 200; // Supabase has limits on IN clause size
          
          for (let i = 0; i < showIds.length; i += chunkSize) {
            showIdChunks.push(showIds.slice(i, i + chunkSize));
          }
          
          // Get entries for all attended shows with pagination and chunking
          let allEntriesData = [];

          for (let i = 0; i < showIdChunks.length; i++) {
            const currentChunk = showIdChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              const { data, error } = await supabase
                .from('setlist_entries')
                .select('entry_song, entry_show, entry_short')
                .in('entry_show', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allEntriesData = [...allEntriesData, ...data];
                page++;
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }

          // Define skipShorts
          const skipShorts = ["fake", "tease", "reprise", "aborted"];

          // Group entries by show to identify valid songs
          const showEntriesMap = new Map<string, any[]>();
          allEntriesData.forEach(entry => {
            const showId = entry.entry_show;
            if (!showEntriesMap.has(showId)) {
              showEntriesMap.set(showId, []);
            }
            showEntriesMap.get(showId).push(entry);
          });

          // Process each show to find valid songs
          const validEntries: any[] = [];
          showEntriesMap.forEach((showEntries, showId) => {
            // Find songs with valid performances in this show
            const validSongs = new Set<string>();
            showEntries.forEach(entry => {
              if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
                validSongs.add(entry.entry_song);
              }
            });
            
            // Only include entries for songs that have valid performances
            showEntries.forEach(entry => {
              if (validSongs.has(entry.entry_song)) {
                validEntries.push(entry);
              }
            });
          });
          
          // Get shows data to know when each song was seen with pagination and chunking
          let allShowsData = [];
          
          for (let i = 0; i < showIdChunks.length; i++) {
            const currentChunk = showIdChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              const { data, error } = await supabase
                .from('shows')
                .select('show_id, show_date')
                .in('show_id', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allShowsData = [...allShowsData, ...data];
                page++;
                
                // Update progress based on pagination and chunks (75-85%)
                const progressPerChunk = 10 / showIdChunks.length;
                const chunkProgress = (i / showIdChunks.length) * 10;
                const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
                setLoadingProgress(Math.min(85, 75 + chunkProgress + pageProgress));
                
                // If we got fewer records than the page size, we're done with this chunk
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Create a map of show IDs to dates
          const showDates: Record<string, string> = {};
          allShowsData.forEach(show => {
            showDates[show.show_id] = show.show_date;
          });
          
          // First get song IDs from song names
          const songNames = [...new Set(validEntries.map(entry => entry.entry_song))];
          
          // Split songNames into chunks for batch processing
          const songNameChunks = [];
          const songChunkSize = 200; // Supabase has limits on IN clause size
          
          for (let i = 0; i < songNames.length; i += songChunkSize) {
            songNameChunks.push(songNames.slice(i, i + songChunkSize));
          }
          
          // Get song ID mapping with pagination and chunking
          let allSongMappingData = [];
          
          for (let i = 0; i < songNameChunks.length; i++) {
            const currentChunk = songNameChunks[i];
            page = 0;
            hasMore = true;
            
            while (hasMore) {
              const { data, error } = await supabase
                .from('songs')
                .select('song, song_id')
                .in('song', currentChunk)
                .range(page * pageSize, (page + 1) * pageSize - 1);
              
              if (error) throw error;
              
              if (data && data.length > 0) {
                allSongMappingData = [...allSongMappingData, ...data];
                page++;
                
                // Update progress based on pagination and chunks (85-95%)
                const progressPerChunk = 10 / songNameChunks.length;
                const chunkProgress = (i / songNameChunks.length) * 10;
                const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
                setLoadingProgress(Math.min(95, 85 + chunkProgress + pageProgress));
                
                // If we got fewer records than the page size, we're done with this chunk
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
          }
          
          // Create a mapping from song name to song_id
          const songNameToId: Record<string, string> = {};
          allSongMappingData.forEach(song => {
            songNameToId[song.song] = song.song_id;
          });
          
          // Count unique shows for each song and track last seen date
          const songCounts: Record<string, {count: number, dates: string[], showsSet: Set<string>}> = {};
          validEntries.forEach(entry => {
            const songId = songNameToId[entry.entry_song];
            if (songId) {
              if (!songCounts[songId]) {
                songCounts[songId] = { count: 0, dates: [], showsSet: new Set() };
              }
              // Only count each show once per song
              if (!songCounts[songId].showsSet.has(entry.entry_show)) {
                songCounts[songId].showsSet.add(entry.entry_show);
                songCounts[songId].count += 1;
                if (showDates[entry.entry_show]) {
                  songCounts[songId].dates.push(showDates[entry.entry_show]);
                }
              }
            }
          });
          
          // Convert to array format with last seen date
          const songStats = Object.entries(songCounts).map(([song_id, data]) => {
            // Sort dates in descending order to get most recent
            const sortedDates = [...data.dates].sort((a, b) => 
              new Date(b).getTime() - new Date(a).getTime()
            );
            
            return {
              song_id,
              count: data.count,
              last_seen_date: sortedDates[0] || undefined
            };
          });
          
          setUserSongStats(songStats);
        }
        setLoadingProgress(97);

        setCategories(allCategoriesData || []);
        setSongs(allSongsData || []);
        setLoadingProgress(100);
        
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingProgress(100);
        
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    fetchData();
  }, [effectiveUserId]);

  return {
    categories,
    songs,
    userSongStats,
    loading,
    loadingProgress
  };
};
