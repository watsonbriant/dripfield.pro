import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { Show, SetlistEntry } from '../types/setlist';

interface Tour {
  tour: string;
  tour_canonid: number;
  tour_id: string;
}

interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string | null;
  show_detail: string | null;
  show_alert: string | null;
  show_rarity_percentage: string | null;
  total_entry_length: string | null;
  show_canonid: number | null;
}

export function useSetlistData(showId: string | undefined) {
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLengthRank, setShowLengthRank] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSetlist() {
      if (!showId) return;

      try {
        // Fetch show details
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_group,
            show_tour,
            show_subvenue,
            show_venue_location,
            show_detail,
            show_alert,
            show_coachnotes,
            show_canonid,
            show_callbacks,
            show_wl_link,
            show_subvenue_venue,
            rating_visibility,
            show_rarity,
            show_gap,
            show_listcategorycomplete,
            show_jivecomplete,
            show_dripfieldcomplete,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours!inner(tour_showfields, tour_id)
          `)
          .eq('show_id', showId)
          .single();

        if (showError) throw showError;
        
        setShow({
          ...showData,
          show_tour: showData.show_tour || null,
          tour_showfields: showData.tours.tour_showfields,
          show_callbacks: showData.show_callbacks,
          tour_id: showData.tours.tour_id,
          venue_id: showData.subvenues?.venues?.venue_id
        } as Show);

        // Fetch setlist entries
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_entries')
          .select(`
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_setorder,
            entry_show,
            song_tour_count,
            last_count,
            last_show_id,
            last_show_tour,
            last_show_subvenue,
            last_venue,
            last_venue_location,
            last_show_date,
            times_played,
            shows_since_debut,
            song_rarity_percentage,
            times_played_num,
            shows_since_debut_num,
            songs (
              song_id,
              song_category,
              song_originalartist,
              categories (
                category_canonid
              )
            ),
            setlist_entry_guests(
              guest_id,
              guests(
                guest_displayname,
                guest_canonid,
                guest_instrument
              )
            ),
            joty_results (
              round_achieved
            )
          `)
          .eq('entry_show', showId)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true });
        
        if (setlistError) throw setlistError;
        
        // Transform the data to include guests in the expected format
        const processedSetlist = setlistData?.map(entry => ({
          ...entry,
          song_id: entry.songs?.song_id || '',
          song_category: entry.songs?.song_category || '',
          song_originalartist: entry.songs?.song_originalartist || null,
          category_canonid: entry.songs?.categories?.category_canonid || 0,
          times_played_num: entry.times_played_num ? parseInt(entry.times_played_num) : null,
          shows_since_debut_num: entry.shows_since_debut_num ? parseInt(entry.shows_since_debut_num) : null,
          joty_round: entry.joty_results?.round_achieved || null,
          guests: entry.setlist_entry_guests?.map(guest => ({
            guest_id: guest.guest_id,
            guest_display_name: guest.guests.guest_displayname,
            guest_canonid: guest.guests.guest_canonid,
            guest_instrument: guest.guests.guest_instrument
          })) || [],
          songs: entry.songs || {
            song_id: '',
            song_category: '',
            song_originalartist: null,
            categories: {
              category_canonid: 0,
              category_artwork: null
            }
          }
        })) as SetlistEntry[];
        
        setSetlist(processedSetlist || []);
      } catch (error) {
        console.error('Error fetching setlist:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSetlist();
  }, [showId]);

  useEffect(() => {
    async function fetchShowLengthRank() {
      if (!showId || !show?.show_canonid) return;

      try {
        // Fetch all canonical shows with show_length
        const { data: showsData, error } = await supabase
          .from('shows')
          .select('show_id, show_length')
          .not('show_canonid', 'is', null)
          .not('show_length', 'is', null);

        if (error) throw error;

        // Convert show_length to seconds for comparison
        const timeToSeconds = (timeStr: string) => {
          const parts = timeStr.split(':').map(Number);
          if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
          }
          return 0;
        };

        // Convert and sort by length
        const showsWithSeconds = showsData
          .map(s => ({
            show_id: s.show_id,
            total_seconds: timeToSeconds(s.show_length)
          }))
          .sort((a, b) => b.total_seconds - a.total_seconds);

        // Find current show's rank (1-indexed)
        const rankIndex = showsWithSeconds.findIndex(s => s.show_id === showId);
        
        // Only set rank if show is in top 25
        if (rankIndex !== -1 && rankIndex < 25) {
          setShowLengthRank(rankIndex + 1);
        } else {
          setShowLengthRank(null);
        }
      } catch (error) {
        console.error('Error fetching show length rank:', error);
        setShowLengthRank(null);
      }
    }

    fetchShowLengthRank();
  }, [showId, show?.show_canonid]);

  return { show, setlist, loading, showLengthRank };
}

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('tour, tour_canonid, tour_id')
          .order('tour_canonid', { ascending: true });

        if (error) throw error;
        setTours(data || []);
      } catch (error) {
        console.error('Error fetching tours:', error);
      }
    }

    fetchTours();
  }, []);

  return { tours };
}

export function useShowDates(show: Show | null, showId: string | undefined) {
  const [showDates, setShowDates] = useState<ShowDate[]>([]);

  useEffect(() => {
    async function fetchShowDates() {
      if (!show?.show_tour) return;
      
      // Clear showDates when tour changes
      setShowDates([]);
      
      try {
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_venue_location,
            show_canonid,
            subvenues (
              subvenue_venue,
              venues (
                venue_location
              )
            )
          `)
          .eq('show_tour', show.show_tour)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsLast: true });
    
        if (error) throw error;
    
        const processedShows = data?.map(show => ({
          show_id: show.show_id,
          show_date: show.show_date,
          formatted_show_date: formatInTimeZone(
            new Date(show.show_date), 
            'UTC',
            'MM.dd.yy'
          ),
          show_group: show.show_group,
          show_subvenue: show.show_subvenue,
          show_venue_location: show.show_venue_location,
          show_detail: show.show_detail,
          show_alert: show.show_alert,
          show_rarity_percentage: null,
          total_entry_length: null,
          show_canonid: show.show_canonid
        }));
    
        setShowDates(processedShows || []);
      } catch (error) {
        console.error('Error fetching show dates:', error);
      }
    }
  
    fetchShowDates();
  }, [show?.show_tour, showId]);

  return { showDates };
}
