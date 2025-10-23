import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface GuestInfo {
  guest: string;
  guest_category: string;
  guest_instrument: string;
  guest_displayname: string;
}

interface Performance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_tour: string | null;
  tour_id: string | null;
  venue_id: string;
}

interface SongShowMap {
  [songName: string]: string[];
}

interface SongCount {
  song: string;
  play_count: number;
  category?: string;
  category_canonid?: number;
  original_artist?: string;
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork?: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

export const useGuestData = (PersonnelID: string | undefined) => {
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [songShowMap, setSongShowMap] = useState<SongShowMap>({});
  const [songs, setSongs] = useState<SongCount[]>([]);
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadItem[]>([]);

  useEffect(() => {
    if (!PersonnelID) return;

    async function fetchAllGuestData() {
      try {
        setLoadingProgress(5);
        
        // Fetch guest info first (quick)
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .select(`
            guest,
            guest_category,
            guest_instrument,
            guest_displayname
          `)
          .eq('guest_id', PersonnelID)
          .single();

        if (guestError) throw guestError;
        setGuest(guestData);
        setLoadingProgress(10);

        // Fetch all setlist entry data in one optimized query with pagination
        let allEntries: any[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('setlist_entry_guests')
            .select(`
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_song,
                entry_show,
                songs:entry_song(
                  song,
                  song_category,
                  song_originalartist,
                  categories:song_category(
                    category_canonid
                  )
                ),
                shows:entry_show(
                  show_id,
                  show_date,
                  show_group,
                  show_subvenue,
                  show_venue_location,
                  show_tour,
                  tours:show_tour(
                    tour_id
                  ),
                  subvenues:show_subvenue(
                    subvenue,
                    subvenue_venue,
                    venues:subvenue_venue(
                      venue,
                      venue_id
                    )
                  )
                )
              )
            `)
            .eq('guest_id', PersonnelID)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Update progress based on pagination (10-60%)
            const paginationProgress = 10 + (page * 8);
            setLoadingProgress(Math.min(60, paginationProgress));
            
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(65);
        
        // Process all data in parallel
        const [
          processedPerformances,
          processedSongData,
          processedSongShowMap
        ] = await Promise.all([
          processPerformances(allEntries),
          processSongData(allEntries),
          processSongShowMap(allEntries)
        ]);
        
        setPerformances(processedPerformances);
        setSongs(processedSongData.songs);
        setSongShowMap(processedSongShowMap);
        setSongSpreadData(processedSongData.songSpreadData);
        
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching guest data:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }

    fetchAllGuestData();
  }, [PersonnelID]);

  return {
    guest,
    performances,
    loading,
    loadingProgress,
    songShowMap,
    songs,
    songSpreadData
  };
};

// Helper function to process performances
async function processPerformances(allEntries: any[]): Promise<Performance[]> {
  const uniqueShowsMap: Record<string, Performance> = {};

  allEntries.forEach(item => {
    if (item.setlist_entries && item.setlist_entries.shows) {
      const show = item.setlist_entries.shows;
      
      const venueId = show.subvenues?.venues?.venue_id || '';
      const tourId = show.tours?.tour_id || null;

      uniqueShowsMap[show.show_id] = {
        show_id: show.show_id,
        show_date: show.show_date,
        show_group: show.show_group || '',
        show_subvenue: show.show_subvenue || '',
        show_venue_location: show.show_venue_location || '',
        show_tour: show.show_tour || null,
        tour_id: tourId,
        venue_id: venueId
      };
    }
  });
  
  const uniqueShows = Object.values(uniqueShowsMap);
  uniqueShows.sort((a, b) => a.show_date.localeCompare(b.show_date));
  
  return uniqueShows;
}

// Helper function to process song data
async function processSongData(allEntries: any[]): Promise<{
  songs: SongCount[];
  songSpreadData: SongSpreadItem[];
}> {
  // Process song counts and categories
  const songData: Record<string, { 
    count: number, 
    category: string, 
    categoryCanonId?: number,
    originalArtist?: string 
  }> = {};
  
  allEntries.forEach(item => {
    if (item.setlist_entries?.songs?.song) {
      const songName = item.setlist_entries.songs.song;
      const category = item.setlist_entries.songs.song_category;
      const categoryCanonId = item.setlist_entries.songs.categories?.category_canonid;
      const originalArtist = item.setlist_entries.songs.song_originalartist;
      
      if (!songData[songName]) {
        songData[songName] = { 
          count: 0, 
          category, 
          categoryCanonId,
          originalArtist: originalArtist || undefined
        };
      }
      songData[songName].count += 1;
    }
  });

  // Get category metadata in parallel
  const categories = [...new Set(Object.values(songData).map(data => data.category))];
  
  const [categoryData, artworkData] = await Promise.all([
    categories.length > 0 ? supabase
      .from('categories')
      .select('category, category_canonid')
      .in('category', categories) : Promise.resolve({ data: [], error: null }),
    categories.length > 0 ? supabase
      .from('categories')
      .select('category, category_artwork')
      .in('category', categories) : Promise.resolve({ data: [], error: null })
  ]);

  const categoryCanonIds: Record<string, number> = {};
  const categoryArtwork: Record<string, string | null> = {};

  if (categoryData.data) {
    categoryData.data.forEach(cat => {
      categoryCanonIds[cat.category] = cat.category_canonid;
    });
  }

  if (artworkData.data) {
    artworkData.data.forEach(cat => {
      categoryArtwork[cat.category] = cat.category_artwork;
    });
  }

  // Convert to array format
  const songsArray = Object.entries(songData).map(([song, data]) => ({
    song,
    play_count: data.count,
    category: data.category,
    category_canonid: data.categoryCanonId || categoryCanonIds[data.category] || 9999,
    original_artist: data.originalArtist
  }));

  // Prepare song spread data
  const categorySongs: Record<string, Array<{song: string, playCount: number, artist?: string}>> = {};
  const categoryTotalPerformances: Record<string, number> = {};
  
  songsArray.forEach(songData => {
    const category = songData.category || 'Uncategorized';
    
    if (!categorySongs[category]) {
      categorySongs[category] = [];
      categoryTotalPerformances[category] = 0;
    }
    
    categorySongs[category].push({
      song: songData.song,
      playCount: songData.play_count,
      artist: songData.original_artist
    });
    
    categoryTotalPerformances[category] += songData.play_count;
  });
  
  const songSpreadData = Object.keys(categoryTotalPerformances).map(category => ({
    category,
    count: categoryTotalPerformances[category],
    canonid: categoryCanonIds[category] || 9999,
    artwork: categoryArtwork[category],
    songs: categorySongs[category].sort((a, b) => b.playCount - a.playCount)
  })).sort((a, b) => a.canonid - b.canonid);

  return { songs: songsArray, songSpreadData };
}

// Helper function to process song-show mapping
function processSongShowMap(allEntries: any[]): SongShowMap {
  const songShowMapping: SongShowMap = {};
  
  allEntries.forEach(item => {
    if (item.setlist_entries?.songs?.song && item.setlist_entries?.entry_show) {
      const songName = item.setlist_entries.songs.song;
      const showId = item.setlist_entries.entry_show;
      
      if (!songShowMapping[songName]) {
        songShowMapping[songName] = [];
      }
      
      if (!songShowMapping[songName].includes(showId)) {
        songShowMapping[songName].push(showId);
      }
    }
  });
  
  return songShowMapping;
}