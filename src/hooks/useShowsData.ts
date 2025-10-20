import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Show {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  venue_location: string | null;
  show_venue_location: string;
  show_subvenue_venue: string;
  venue_id?: string;
  attended?: boolean;
  show_wl_link?: string | null;
  formatted_show_date: string;
}

interface ShowResponse {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  show_subvenue_venue: string;
  show_venue_location: string;
  show_wl_link?: string | null;
  subvenues?: {
    venues?: {
      venue_id: string;
    };
  };
}

export function useShowsData() {
  const { user } = useAuth();
  const [recentShows, setRecentShows] = useState<Show[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [historicalShows, setHistoricalShows] = useState<Show[]>([]);
  const [mostRecentShow, setMostRecentShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [loadingMostRecent, setLoadingMostRecent] = useState(true);
  const [loadingSetlist, setLoadingSetlist] = useState(true);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
  
  // Create a date state that updates daily
  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString());

  // Update date daily
  useEffect(() => {
    const updateDate = () => {
      const today = new Date().toDateString();
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    };

    // Check immediately
    updateDate();

    // Set up interval to check every hour
    const interval = setInterval(updateDate, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentDate]);

  // Fetch attended shows for current user
  useEffect(() => {
    if (!user) {
      setAttendedShowIds([]);
      return;
    }

    const fetchAttendedShows = async () => {
      try {
        const { data, error } = await supabase
          .from('user_attended_shows')
          .select('show_id')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setAttendedShowIds(data.map(item => item.show_id));
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setAttendedShowIds([]);
      }
    };
    
    fetchAttendedShows();
  }, [user]);

  // Fetch recent shows (last 5 - actually 2nd-6th most recent)
  useEffect(() => {
    const fetchRecentShows = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('shows')
          .select<any, ShowResponse>(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .lt('show_date', tomorrowString)
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true })
          .range(1, 5); // Skip first (most recent), get next 5

        if (error) throw error;

        const processedData = data?.map(show => ({
          ...show,
          venue_id: show.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(show.show_id),
          venue_location: show.show_venue_location,
          formatted_show_date: new Date(show.show_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          }).replace(/\//g, '.')
        }));

        setRecentShows((processedData || []).reverse());
      } catch (error) {
        console.error('Error fetching recent shows:', error);
        setRecentShows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentShows();
  }, [attendedShowIds, currentDate]);

  // Fetch upcoming shows (next 5)
  useEffect(() => {
    const fetchUpcomingShows = async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('shows')
          .select<any, ShowResponse>(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .gte('show_date', tomorrowString)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true })
          .limit(5);

        if (error) throw error;

        const processedData = data?.map(show => ({
          ...show,
          venue_id: show.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(show.show_id),
          venue_location: show.show_venue_location,
          formatted_show_date: new Date(show.show_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          }).replace(/\//g, '.')
        }));

        setUpcomingShows(processedData || []);
      } catch (error) {
        console.error('Error fetching upcoming shows:', error);
        setUpcomingShows([]);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingShows();
  }, [attendedShowIds, currentDate]);

  // Fetch historical shows (this day in history)
  useEffect(() => {
    const fetchHistoricalShows = async () => {
      try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Get all shows and filter client-side for now
        const { data, error } = await supabase
          .from('shows')
          .select<any, ShowResponse>(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        if (error) throw error;

        // Filter shows that occurred on the same month and day
        const filteredData = data?.filter(show => {
          const showDate = new Date(show.show_date + 'T00:00:00');
          const showMonth = String(showDate.getMonth() + 1).padStart(2, '0');
          const showDay = String(showDate.getDate()).padStart(2, '0');
          return showMonth === month && showDay === day;
        });

        const processedData = filteredData?.map(show => ({
          ...show,
          venue_id: show.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(show.show_id),
          venue_location: show.show_venue_location,
          formatted_show_date: new Date(show.show_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          }).replace(/\//g, '.')
        }));

        setHistoricalShows((processedData || []).reverse());
      } catch (error) {
        console.error('Error fetching historical shows:', error);
        setHistoricalShows([]);
      } finally {
        setLoadingHistorical(false);
      }
    };

    fetchHistoricalShows();
  }, [attendedShowIds, currentDate]);

  // Fetch most recent show
  useEffect(() => {
    const fetchMostRecentShow = async () => {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select<any, ShowResponse>(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .lt('show_date', new Date().toISOString().split('T')[0])
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true })
          .limit(1)
          .single();

        if (error) throw error;

        const processedShow = data ? {
          ...data,
          venue_id: data.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(data.show_id),
          venue_location: data.show_venue_location,
          formatted_show_date: new Date(data.show_date).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          }).replace(/\//g, '.')
        } : null;

        setMostRecentShow(processedShow);
      } catch (error) {
        console.error('Error fetching most recent show:', error);
        setMostRecentShow(null);
      } finally {
        setLoadingMostRecent(false);
      }
    };

    fetchMostRecentShow();
  }, [attendedShowIds, currentDate]);

  // Fetch setlist for most recent show
  useEffect(() => {
    if (!mostRecentShow) {
      setSetlist([]);
      setLoadingSetlist(false);
      return;
    }

    const fetchSetlist = async () => {
      try {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            entry_short,
            entry_segue,
            entry_placement,
            entry_setorder,
            entry_set,
            entry_setnum,
            songs:entry_song(
              song_id
            )
          `)
          .eq('entry_show', mostRecentShow.show_id)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true });

        if (error) throw error;

        setSetlist(data || []);
      } catch (error) {
        console.error('Error fetching setlist:', error);
        setSetlist([]);
      } finally {
        setLoadingSetlist(false);
      }
    };

    fetchSetlist();
  }, [mostRecentShow]);

  return { 
    recentShows, 
    upcomingShows, 
    historicalShows, 
    mostRecentShow, 
    setlist,
    loading, 
    loadingUpcoming, 
    loadingHistorical, 
    loadingMostRecent, 
    loadingSetlist 
  };
}