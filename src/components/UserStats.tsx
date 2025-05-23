import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface TopSong {
  song: string;
  song_id: string;
  play_count: number;
}

interface LongestPerformance {
  song: string;
  song_id: string;
  show_date: string;
  show_id: string;
  length: string;
  length_seconds: number;
  venue_location?: string;
}

interface SlotSong {
  song_name: string;
  song_id: string;
  times_played: number;
}

interface NotSeenSong {
  song: string;
  song_id: string;
  play_count: number;
}

interface StatData {
  type: 'topSongs' | 'longestPerformances' | 'showOpeners' | 'setOpeners' | 'setClosers' | 'encoreSongs' | 'notSeenSongs';
  title: string;
  data: any[];
  loading: boolean;
  countKey?: string;
  showDate?: boolean;
  showLength?: boolean;
  songNameKey?: string;
  songIdKey?: string;
  bgColor?: string;
}

// CircularProgress component for reuse
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#dad0bc" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#f9ae37" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-black">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface UserStatsProps {
  userId?: string;
}

const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);
  
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

  // Track current column count for responsive layout
  const [columnCount, setColumnCount] = useState(1);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Fetch username if viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            return;
          }
          
          if (data?.username) {
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Error in username fetch:', error);
        }
      };
      
      fetchUsername();
    }
  }, [userId, isOwnProfile, user]);

  // Handle responsive column calculation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setColumnCount(3); // xl breakpoint - 3 columns
      } else if (width >= 1024) {
        setColumnCount(2); // lg breakpoint - 2 columns
      } else {
        setColumnCount(1); // mobile - 1 column
      }
    };
    
    // Initial calculation
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!effectiveUserId) return;
    
    async function fetchUserShowIds() {
      try {
        setLoadingProgress(5);
        
        // Get attended shows with pagination
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
            
            // Update progress (5-15%)
            setLoadingProgress(Math.min(15, 5 + (page * 2)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        if (allAttendedShows.length === 0) {
          // If user hasn't attended any shows, set empty results and stop loading
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
        
        // Split into chunks for processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        setLoadingProgress(20);
        
        // Fetch all stats in parallel, but with individual progress tracking
        await Promise.all([
          fetchTopSongs(showIdChunks, 20, 30),
          fetchLongestPerformances(showIdChunks, 30, 40),
          fetchShowOpeners(showIdChunks, 40, 50),
          fetchSetOpeners(showIdChunks, 50, 60),
          fetchSetClosers(showIdChunks, 60, 70),
          fetchEncoreSongs(showIdChunks, 70, 80),
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

  async function fetchTopSongs(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid
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
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        completedChunks++;
      }
      
      // Count songs by unique show to avoid counting multiple plays in the same show
      const songShowCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
        const songName = entry.entry_song;
        const songId = entry.songs.song_id;
        const showId = entry.entry_show;
        const uniqueKey = `${songId}-${showId}`;
        
        if (!acc[songId]) {
          acc[songId] = {
            song: songName,
            song_id: songId,
            shows: new Set([showId]),
            category_canonid: entry.songs.categories.category_canonid
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
          category_canonid: item.category_canonid
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
  }

  async function fetchLongestPerformances(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
              songs!inner(song_id),
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
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      // Process data to extract length in seconds
      const processedPerformances = allEntries.map((entry: any) => {
        // Parse interval string (e.g., "00:15:23") into seconds
        const lengthParts = entry.entry_length.split(':');
        let totalSeconds = 0;
        
        if (lengthParts.length === 3) {
          // HH:MM:SS format
          totalSeconds = (parseInt(lengthParts[0]) * 3600) + 
                         (parseInt(lengthParts[1]) * 60) + 
                         parseInt(lengthParts[2]);
        } else if (lengthParts.length === 2) {
          // MM:SS format
          totalSeconds = (parseInt(lengthParts[0]) * 60) + 
                         parseInt(lengthParts[1]);
        }
        
        // Format date as MM.DD.YY
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
          length_seconds: totalSeconds
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
  }

  async function fetchShowOpeners(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
                  category_canonid
                )
              ),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .eq('entry_placement', 'Set 1 Opener')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const openerCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
        const songName = entry.entry_song;
        if (!acc[songName]) {
          acc[songName] = {
            song_name: songName,
            song_id: entry.songs.song_id,
            times_played: 1,
            category_canonid: entry.songs.categories.category_canonid
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
      setLoadingShowOpeners(false);
    } catch (error) {
      console.error('Error fetching show openers:', error);
      setLoadingShowOpeners(false);
    }
  }

  async function fetchSetOpeners(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
                  category_canonid
                )
              ),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .in('entry_placement', ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener'])
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const openerCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
        const songName = entry.entry_song;
        if (!acc[songName]) {
          acc[songName] = {
            song_name: songName,
            song_id: entry.songs.song_id,
            times_played: 1,
            category_canonid: entry.songs.categories.category_canonid
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
      setLoadingSetOpeners(false);
    } catch (error) {
      console.error('Error fetching set openers:', error);
      setLoadingSetOpeners(false);
    }
  }

  async function fetchSetClosers(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
                  category_canonid
                )
              ),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .in('entry_placement', ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer'])
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const closerCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
        const songName = entry.entry_song;
        if (!acc[songName]) {
          acc[songName] = {
            song_name: songName,
            song_id: entry.songs.song_id,
            times_played: 1,
            category_canonid: entry.songs.categories.category_canonid
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
      setLoadingSetClosers(false);
    } catch (error) {
      console.error('Error fetching set closers:', error);
      setLoadingSetClosers(false);
    }
  }

  async function fetchEncoreSongs(showIdChunks: string[][], startProgress: number, endProgress: number) {
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
                  category_canonid
                )
              ),
              entry_show
            `)
            .in('entry_show', currentChunk)
            .in('entry_placement', ['Encore', 'Encore 1', 'Encore 2', 'Encore 3'])
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Calculate progress within this function's allocated range
            const progressPerChunk = (endProgress - startProgress) / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(endProgress, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      const encoreCounts = allEntries.reduce((acc: { [key: string]: any }, entry: any) => {
        const songName = entry.entry_song;
        if (!acc[songName]) {
          acc[songName] = {
            song_name: songName,
            song_id: entry.songs.song_id,
            times_played: 1,
            category_canonid: entry.songs.categories.category_canonid
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
      
      setEncoreSongs(processedEncores);
      setLoadingEncores(false);
    } catch (error) {
      console.error('Error fetching encores:', error);
      setLoadingEncores(false);
    }
  }

  async function fetchNotSeenSongs(userShowIds: string[], startProgress: number, endProgress: number) {
    try {
      setLoadingProgress(startProgress);
      
      // First, get all songs the user has seen
      let userSeenSongs = new Set<string>();
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;
      
      // Process in chunks due to query size limitations
      const showIdChunks = [];
      const chunkSize = 200;
      for (let i = 0; i < userShowIds.length; i += chunkSize) {
        showIdChunks.push(userShowIds.slice(i, i + chunkSize));
      }
      
      // Get all songs the user has seen
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        page = 0;
        hasMore = true;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(song_id)
            `)
            .in('entry_show', currentChunk)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Add each song_id to the set of seen songs
            data.forEach(entry => {
              userSeenSongs.add(entry.songs.song_id);
            });
            
            page++;
            
            // Calculate progress (startProgress to startProgress + 10%)
            const progressPerChunk = 10 / showIdChunks.length;
            const chunkProgress = i * progressPerChunk;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            
            setLoadingProgress(Math.min(startProgress + 10, startProgress + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      setLoadingProgress(startProgress + 10);
      
      // Now get the most played songs overall (only from canonical shows)
      let allSongCounts: { [key: string]: any } = {};
      page = 0;
      hasMore = true;
      
      while (hasMore) {
        
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
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
          // Group by song and unique shows to count properly
          data.forEach(entry => {
            const songId = entry.songs.song_id;
            const showId = entry.entry_show;
            const songName = entry.entry_song;
            const categoryCanonId = entry.songs.categories.category_canonid;
            
            if (!allSongCounts[songId]) {
              allSongCounts[songId] = {
                song: songName,
                song_id: songId,
                shows: new Set([showId]),
                category_canonid: categoryCanonId
              };
            } else {
              allSongCounts[songId].shows.add(showId);
            }
          });
          
          page++;
          
          // Calculate progress for this part (from startProgress+10 to endProgress-5)
          const allocatedProgress = endProgress - startProgress - 15;
          const progressPerPage = allocatedProgress / Math.max(5, Math.ceil(data.length / pageSize) * 2); // Estimate total pages
          
          setLoadingProgress(Math.min(endProgress - 5, startProgress + 10 + (page * progressPerPage)));
          
          // If we got fewer records than the page size, we're done
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      // Filter to only songs the user hasn't seen
      const notSeenSongs = Object.values(allSongCounts)
        .filter((item: any) => !userSeenSongs.has(item.song_id))
        .map((item: any) => ({
          song: item.song,
          song_id: item.song_id,
          play_count: item.shows.size,
          category_canonid: item.category_canonid
        }))
        .sort((a: any, b: any) => {
          // Sort by play count (descending)
          if (b.play_count !== a.play_count) {
            return b.play_count - a.play_count;
          }
          // Then by category (ascending)
          if (a.category_canonid !== b.category_canonid) {
            return a.category_canonid - b.category_canonid;
          }
          // Then alphabetically
          return a.song.localeCompare(b.song);
        })
        .slice(0, 8); // Get top 10
      
      setNotSeenSongs(notSeenSongs);
      setLoadingNotSeen(false);
      setLoadingProgress(endProgress);
    } catch (error) {
      console.error('Error fetching not seen songs:', error);
      setLoadingNotSeen(false);
      setLoadingProgress(endProgress);
    }
  }
  
    // Format the time interval to display as MM:SS or HH:MM:SS
    const formatTimeInterval = (interval: string) => {
      const parts = interval.split(':');
      if (parts.length === 3) {
        // Convert from HH:MM:SS format
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      return interval;
    };
  
    // Get personalized loading message
    const getLoadingMessage = () => {
      if (isOwnProfile) {
        return "Loading your stats...";
      } else {
        return `Loading ${username ? username + "'s" : "their"} stats...`;
      }
    };
  
    // Get personalized titles for the different stat sections
    const getPersonalizedTitle = (baseTitle: string) => {
      return baseTitle;
    };
    
    // Get color background for each stat type
    const getStatBgColor = (type: string): string => {
      switch(type) {
        case 'topSongs':
          return 'bg-[#f9ae37]'; // Use existing tertiary color
        case 'longestPerformances':
          return 'bg-[#f9ae37]'; // Burgundy
        case 'notSeenSongs':
          return 'bg-[#CE1126]'; // Red
        case 'showOpeners':
          return 'bg-[#006400]'; // Dark green
        case 'setOpeners':
          return 'bg-[#019B7A]'; // Teal
        case 'setClosers':
          return 'bg-[#E17401]'; // Orange
        case 'encoreSongs':
          return 'bg-[#7C2128]'; // Burgundy
        default:
          return 'bg-[#f9ae37]'; // Default yellow
      }
    };
    
    // Create a stat box component for reuse
    const StatBox = ({ 
      title, 
      data, 
      loading, 
      countKey = 'play_count',
      showDate = false,
      showLength = false,
      songNameKey = 'song',
      songIdKey = 'song_id',
      type
    }: { 
      title: string;
      data: any[];
      loading: boolean;
      countKey?: string;
      showDate?: boolean;
      showLength?: boolean;
      songNameKey?: string;
      songIdKey?: string;
      type: string;
    }) => (
      <div className="bg-primary border border-black rounded-lg p-3 w-full h-full">
        <h3 className={`text-lg font-bold ${getStatBgColor(type)} ${
          type === 'showOpeners' || type === 'setOpeners' || type === 'setClosers' || type === 'encoreSongs' || type === 'notSeenSongs'
            ? 'text-white' 
            : 'text-black'
        } inline-block px-3 pt-0.5 pb-0.5 rounded-full border border-black mb-2`}>
          {getPersonalizedTitle(title)}
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center h-40 flex items-center justify-center">
            <p className="text-black">No data available</p>
          </div>
        ) : (
          <div>
            {data.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-start py-0.5 ${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-black/10`}
              >
                <div className="flex-1 pl-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => navigate(`/song/${item[songIdKey]}`)}
                      className="text-black hover:text-[#a9682e] text-left font-semibold text-sm hover:underline"
                    >
                      {item[songNameKey]}
                    </button>
                    {showDate && item.show_date && (
                      <button
                        onClick={() => navigate(`/setlist/${item.show_id}`)}
                        className="hover:underline text-xs text-black ml-2"
                      >
                        [{item.show_date}]
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-black font-semibold pr-2">
                  {showLength ? formatTimeInterval(item.length) : item[countKey]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
    
    // Create stats data array in the desired order
    const statData: StatData[] = [
      {
        type: 'topSongs',
        title: 'Most Seen Songs',
        data: topSongs,
        loading: loadingTop
      },
      {
        type: 'longestPerformances',
        title: 'Longest Song Performances',
        data: longestPerformances,
        loading: loadingLongest,
        countKey: 'length_seconds',
        showDate: true,
        showLength: true
      },
      {
        type: 'notSeenSongs',
        title: 'Most Common Not Seen',
        data: notSeenSongs,
        loading: loadingNotSeen
      },
      {
        type: 'showOpeners',
        title: 'Most Seen Show Openers',
        data: showOpeners,
        loading: loadingShowOpeners,
        countKey: 'times_played',
        songNameKey: 'song_name'
      },
      {
        type: 'setOpeners',
        title: 'Most Seen Set Openers',
        data: setOpeners,
        loading: loadingSetOpeners,
        countKey: 'times_played',
        songNameKey: 'song_name'
      },
      {
        type: 'setClosers',
        title: 'Most Seen Set Closers',
        data: setClosers,
        loading: loadingSetClosers,
        countKey: 'times_played',
        songNameKey: 'song_name'
      },
      {
        type: 'encoreSongs',
        title: 'Most Seen in the Encore',
        data: encoreSongs,
        loading: loadingEncores,
        countKey: 'times_played',
        songNameKey: 'song_name'
      }
    ];
    
    // Create columns based on the current column count
    const createStatColumns = (stats: StatData[], numColumns: number = 3) => {
      if (numColumns === 1) {
        // For single column, return all stats in one column
        return [stats];
      }
      
      const columns: StatData[][] = Array(numColumns).fill([]).map(() => []);
      const itemsPerColumn = Math.ceil(stats.length / numColumns);
      
      // Distribute items across columns
      stats.forEach((stat, index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        columns[columnIndex] = [...columns[columnIndex], stat];
      });
      
      return columns;
    };
    
    // Generate columns based on current column count
    const statColumns = createStatColumns(statData, columnCount);
    
    if (loading) {
      return (
        <div className="bg-primary border border-black rounded-lg p-3">
          <div className="flex flex-col justify-center items-center h-56">
            <CircularProgress value={loadingProgress} />
            <p className="text-black mt-4">{getLoadingMessage()}</p>
          </div>
        </div>
      );
    }
    
    // If no user ID found, show an appropriate message
    if (!effectiveUserId) {
      return (
        <div className="bg-primary border border-black rounded-lg p-3">
          <div className="text-center py-6">
            <p className="text-black">No user data available.</p>
          </div>
        </div>
      );
    }
    
    // Check if we have any data to display
    const hasNoData = topSongs.length === 0 && 
      longestPerformances.length === 0 &&
      showOpeners.length === 0 &&
      setOpeners.length === 0 &&
      setClosers.length === 0 &&
      encoreSongs.length === 0 &&
      notSeenSongs.length === 0;
    
    if (hasNoData) {
      return (
        <div className="bg-primary border border-black rounded-lg p-3">
          <div className="text-center py-6">
            <p className="text-black">
              {isOwnProfile 
                ? "No stats available. Start adding shows you've attended!" 
                : `${username ? username : "This user"} hasn't added any attended shows yet.`}
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto grid-flow-row">
          {statData.map((stat, index) => (
            <div key={`stat-${index}`} className="w-full h-auto">
              <StatBox
                title={stat.title}
                data={stat.data}
                loading={stat.loading}
                countKey={stat.countKey}
                showDate={stat.showDate}
                showLength={stat.showLength}
                songNameKey={stat.songNameKey}
                songIdKey={stat.songIdKey}
                type={stat.type}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
export default UserStats;