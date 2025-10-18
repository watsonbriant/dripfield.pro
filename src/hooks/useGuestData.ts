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

export const useGuestData = (PersonnelID: string | undefined) => {
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [songShowMap, setSongShowMap] = useState<SongShowMap>({});

  useEffect(() => {
    if (!PersonnelID) return;

    async function fetchGuestData() {
      try {
        setLoadingProgress(5);
        
        // First get the guest info
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
        setLoadingProgress(20);

        // Then get all performances - with pagination handling
        let allShows: any[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data: showsData, error: showsError } = await supabase
            .from('setlist_entry_guests')
            .select(`
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_show,
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
            
          if (showsError) throw showsError;
          
          if (showsData && showsData.length > 0) {
            allShows = [...allShows, ...showsData];
            page++;
            
            // Update progress based on pagination
            const paginationProgress = 20 + (page * 10);
            setLoadingProgress(Math.min(70, paginationProgress));
            
            hasMore = showsData.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(75);
        
        // Process the joined data to get unique shows
        const uniqueShowsMap: Record<string, Performance> = {};

        allShows.forEach(item => {
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
        
        setPerformances(uniqueShows);
        setLoadingProgress(90);
      } catch (error) {
        console.error('Error fetching guest data:', error);
      }
    }

    async function fetchSongShowMap() {
      try {
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
                  song
                )
              )
            `)
            .eq('guest_id', PersonnelID)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
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
        
        setSongShowMap(songShowMapping);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching song-show map:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }
    
    if (PersonnelID) {
      fetchGuestData().then(() => fetchSongShowMap());
    }
  }, [PersonnelID]);

  return {
    guest,
    performances,
    loading,
    loadingProgress,
    songShowMap
  };
};
