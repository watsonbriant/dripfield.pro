import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TopSong, LongestPerformance, SlotSong, NotSeenSong } from '../types/userStats';
import { skipShorts } from '../utils/userStatsUtils';

export const useUserStats = (effectiveUserId: string | null) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // State for each stat category
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [longestPerformances, setLongestPerformances] = useState<LongestPerformance[]>([]);
  const [showOpeners, setShowOpeners] = useState<SlotSong[]>([]);
  const [setOpeners, setSetOpeners] = useState<SlotSong[]>([]);
  const [setClosers, setSetClosers] = useState<SlotSong[]>([]);
  const [encoreSongs, setEncoreSongs] = useState<SlotSong[]>([]);
  const [notSeenSongs, setNotSeenSongs] = useState<NotSeenSong[]>([]);
  
  // Loading states for each category
  const [loadingTop, setLoadingTop] = useState<boolean>(true);
  const [loadingLongest, setLoadingLongest] = useState<boolean>(true);
  const [loadingShowOpeners, setLoadingShowOpeners] = useState<boolean>(true);
  const [loadingSetOpeners, setLoadingSetOpeners] = useState<boolean>(true);
  const [loadingSetClosers, setLoadingSetClosers] = useState<boolean>(true);
  const [loadingEncores, setLoadingEncores] = useState<boolean>(true);
  const [loadingNotSeen, setLoadingNotSeen] = useState<boolean>(true);

  const fetchTopSongs = async (showIdChunks: string[][], startProgress: number, endProgress: number) => {
    try {
      let allEntries = [];
      let completedChunks = 0;
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              entry_short,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        completedChunks++;
      }
      
      const showSongGroups = new Map<string, any[]>();
      allEntries.forEach(entry => {
        const showId = entry.entry_show;
        if (!showSongGroups.has(showId)) {
          showSongGroups.set(showId, []);
        }
        showSongGroups.get(showId).push(entry);
      });
      
      const songShowCounts = new Map<string, any>();
      
      showSongGroups.forEach((showEntries, showId) => {
        const validSongs = new Set<string>();
        showEntries.forEach(entry => {
          if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
            validSongs.add(entry.entry_song);
          }
        });
        
        const countedSongsInShow = new Set<string>();
        showEntries.forEach(entry => {
          if (validSongs.has(entry.entry_song) && !countedSongsInShow.has(entry.entry_song)) {
            countedSongsInShow.add(entry.entry_song);
            const songId = entry.songs.song_id;
            
            if (!songShowCounts.has(songId)) {
              songShowCounts.set(songId, {
                song: entry.entry_song,
                song_id: songId,
                shows: new Set([showId]),
                category_canonid: entry.songs.categories.category_canonid,
                category_artwork: entry.songs.categories.category_artwork
              });
            } else {
              songShowCounts.get(songId).shows.add(showId);
            }
          }
        });
      });
      
      const processedSongs = Array.from(songShowCounts.values())
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
      setLoadingTop(false);
    } catch (error) {
      console.error('Error fetching top songs:', error);
      setLoadingTop(false);
    }
  };

  const fetchLongestPerformances = async (showIdChunks: string[][], startProgress: number, endProgress: number) => {
    try {
      let allEntries = [];
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              entry_short,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_length,
              entry_show,
              shows!inner(
                show_date,
                show_venue_location
              )
            `)
            .in('entry_show', currentChunk)
            .not('entry_length', 'is', null)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const processedPerformances = allEntries
        .filter(entry => !entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase()))
        .map((entry: any) => {
          const lengthParts = entry.entry_length.split(':');
          let totalSeconds = 0;
          
          if (lengthParts.length === 3) {
            totalSeconds = (parseInt(lengthParts[0]) * 3600) + 
                           (parseInt(lengthParts[1]) * 60) + 
                           parseInt(lengthParts[2]);
          } else if (lengthParts.length === 2) {
            totalSeconds = (parseInt(lengthParts[0]) * 60) + 
                           parseInt(lengthParts[1]);
          }
          
          const showDate = entry.shows.show_date;
          const formattedDate = showDate
            .split('-')
            .slice(1)
            .concat(showDate.substring(2, 4))
            .join('.');
            
          return {
            song: entry.entry_song,
            song_id: entry.songs.song_id,
            show_date: formattedDate,
            show_id: entry.entry_show,
            venue_location: entry.shows.show_venue_location,
            length: entry.entry_length,
            length_seconds: totalSeconds,
            category_artwork: entry.songs.categories.category_artwork
          };
        })
        .sort((a: any, b: any) => b.length_seconds - a.length_seconds)
        .slice(0, 8);
      
      setLongestPerformances(processedPerformances);
      setLoadingLongest(false);
    } catch (error) {
      console.error('Error fetching longest performances:', error);
      setLoadingLongest(false);
    }
  };

  const fetchSlotSongs = async (
    showIdChunks: string[][], 
    startProgress: number, 
    endProgress: number,
    placementValues: string[],
    setter: (data: SlotSong[]) => void,
    setLoading: (loading: boolean) => void
  ) => {
    try {
      let allEntries = [];
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
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
              entry_show
            `)
            .in('entry_show', currentChunk)
            .in('entry_placement', placementValues)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const songCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
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
      
      const processedSongs = Object.values(songCounts)
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
      
      setter(processedSongs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching slot songs:', error);
      setLoading(false);
    }
  };

  const fetchNotSeenSongs = async (userShowIds: string[], startProgress: number, endProgress: number) => {
    try {
      setLoadingProgress(startProgress);
      
      let userSeenSongsMap = new Map<string, any[]>();
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;
      
      const showIdChunks = [];
      const chunkSize = 200;
      for (let i = 0; i < userShowIds.length; i += chunkSize) {
        showIdChunks.push(userShowIds.slice(i, i + chunkSize));
      }
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              entry_short,
              songs!inner(song_id),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            data.forEach(entry => {
              const showId = entry.entry_show;
              if (!userSeenSongsMap.has(showId)) {
                userSeenSongsMap.set(showId, []);
              }
              userSeenSongsMap.get(showId).push(entry);
            });
            
            page++;
            
            const progressPerChunk = 10 / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(startProgress + 10, startProgress + chunkProgress + pageProgress));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const userSeenSongs = new Set<string>();
      
      userSeenSongsMap.forEach((showEntries, showId) => {
        const validSongs = new Set<string>();
        showEntries.forEach(entry => {
          if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
            validSongs.add(entry.entry_song);
          }
        });
        
        showEntries.forEach(entry => {
          if (validSongs.has(entry.entry_song)) {
            userSeenSongs.add(entry.songs.song_id);
          }
        });
      });
      
      setLoadingProgress(startProgress + 10);
      
      let allEntriesMap = new Map<string, any[]>();
      page = 0;
      hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            entry_short,
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
              show_canonid
            )
          `)
          .not('shows.show_canonid', 'is', null)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          data.forEach(entry => {
            const showId = entry.entry_show;
            if (!allEntriesMap.has(showId)) {
              allEntriesMap.set(showId, []);
            }
            allEntriesMap.get(showId).push(entry);
          });
          
          page++;
          
          const allocatedProgress = endProgress - startProgress - 15;
          const progressPerPage = allocatedProgress / Math.max(5, Math.ceil(data.length / pageSize) * 2);
          
          setLoadingProgress(Math.min(endProgress - 5, startProgress + 10 + (page * progressPerPage)));
          
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      let allSongCounts: { [key: string]: any } = {};
      
      allEntriesMap.forEach((showEntries, showId) => {
        const validSongs = new Set<string>();
        showEntries.forEach(entry => {
          if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
            validSongs.add(entry.entry_song);
          }
        });
        
        const countedSongsInShow = new Set<string>();
        showEntries.forEach(entry => {
          const songId = entry.songs.song_id;
          const songName = entry.entry_song;
          const categoryCanonId = entry.songs.categories.category_canonid;
          const categoryArtwork = entry.songs.categories.category_artwork;
          
          if (validSongs.has(songName) && !countedSongsInShow.has(songId)) {
            countedSongsInShow.add(songId);
            
            if (!allSongCounts[songId]) {
              allSongCounts[songId] = {
                song: songName,
                song_id: songId,
                shows: new Set([showId]),
                category_canonid: categoryCanonId,
                category_artwork: categoryArtwork
              };
            } else {
              allSongCounts[songId].shows.add(showId);
            }
          }
        });
      });
      
      const notSeenSongs = Object.values(allSongCounts)
        .filter((item: any) => !userSeenSongs.has(item.song_id))
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
      
      setNotSeenSongs(notSeenSongs);
      setLoadingNotSeen(false);
      setLoadingProgress(endProgress);
    } catch (error) {
      console.error('Error fetching not seen songs:', error);
      setLoadingNotSeen(false);
      setLoadingProgress(endProgress);
    }
  };

  useEffect(() => {
    if (!effectiveUserId) return;
    
    async function fetchUserShowIds() {
      try {
        setLoadingProgress(5);
        
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            setLoadingProgress(Math.min(15, 5 + (page * 2)));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        if (allAttendedShows.length === 0) {
          setTopSongs([]);
          setLongestPerformances([]);
          setShowOpeners([]);
          setSetOpeners([]);
          setSetClosers([]);
          setEncoreSongs([]);
          setNotSeenSongs([]);
          
          setLoadingTop(false);
          setLoadingLongest(false);
          setLoadingShowOpeners(false);
          setLoadingSetOpeners(false);
          setLoadingSetClosers(false);
          setLoadingEncores(false);
          setLoadingNotSeen(false);
          
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        const showIds = allAttendedShows.map(show => show.show_id);
        
        const showIdChunks = [];
        const chunkSize = 200;
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        setLoadingProgress(20);
        
        await Promise.all([
          fetchTopSongs(showIdChunks, 20, 30),
          fetchLongestPerformances(showIdChunks, 30, 40),
          fetchSlotSongs(showIdChunks, 40, 50, ['Set 1 Opener'], setShowOpeners, setLoadingShowOpeners),
          fetchSlotSongs(showIdChunks, 50, 60, ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener'], setSetOpeners, setLoadingSetOpeners),
          fetchSlotSongs(showIdChunks, 60, 70, ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer'], setSetClosers, setLoadingSetClosers),
          fetchSlotSongs(showIdChunks, 70, 80, ['Encore', 'Encore 1', 'Encore 2', 'Encore 3'], setEncoreSongs, setLoadingEncores),
          fetchNotSeenSongs(showIds, 80, 100)
        ]);
        
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching user show data:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }
    
    fetchUserShowIds();
  }, [effectiveUserId]);

  return {
    loading,
    loadingProgress,
    topSongs,
    longestPerformances,
    showOpeners,
    setOpeners,
    setClosers,
    encoreSongs,
    notSeenSongs,
    loadingTop,
    loadingLongest,
    loadingShowOpeners,
    loadingSetOpeners,
    loadingSetClosers,
    loadingEncores,
    loadingNotSeen
  };
};
