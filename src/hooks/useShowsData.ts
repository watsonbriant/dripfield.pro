import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { Show, SetlistEntry } from '../types/home';

export const useShowsData = () => {
  const [recentShows, setRecentShows] = useState<Show[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [historicalShows, setHistoricalShows] = useState<Show[]>([]);
  const [mostRecentShow, setMostRecentShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [loadingMostRecent, setLoadingMostRecent] = useState(true);
  const [loadingSetlist, setLoadingSetlist] = useState(true);

  const fetchRecentShows = async () => {
    try {
      const now = new Date();
      const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_date,
          show_id,
          show_canonid,
          show_venue_location,
          show_subvenue,
          show_group,
          show_tour,
          show_detail,
          show_subvenue_venue,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `)
        .lte('show_date', alaskaDate)
        .order('show_date', { ascending: false })
        .order('show_canonid', { ascending: false, nullsFirst: false })
        .order('show_group', { ascending: true })
        .limit(6);

      if (error) throw error;

      const processedShows = data
        ?.slice(1)
        .slice(0, 5)
        .map(show => ({
          show_id: show.show_id,
          show_date: show.show_date,
          formatted_show_date: show.show_date
            .split('-')
            .slice(1)
            .concat(show.show_date.substring(2, 4))
            .join('.'),
          venue_location: show.show_venue_location || '',
          show_subvenue: show.show_subvenue || '',
          show_group: show.show_group || '',
          show_tour: show.show_tour || '',
          show_detail: show.show_detail,
          subvenue_venue: show.show_subvenue_venue || '',
          venue_id: show.subvenues?.venues?.venue_id,
          show_canonid: show.show_canonid
        }));

      const sortedShows = [...processedShows].sort((a, b) => {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }

        const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
        const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
        if (canonIdA !== canonIdB) {
          return canonIdA - canonIdB;
        }

        const groupA = a.show_group || '';
        const groupB = b.show_group || '';
        return groupA.localeCompare(groupB);
      });

      setRecentShows(sortedShows || []);
    } catch (error) {
      console.error('Error fetching recent shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingShows = async () => {
    try {
      const now = new Date();
      const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_date,
          show_id,
          show_canonid,
          show_venue_location,
          show_subvenue,
          show_group,
          show_tour,
          show_detail,
          show_subvenue_venue,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `)
        .gt('show_date', alaskaDate)
        .order('show_date', { ascending: true })
        .order('show_canonid', { ascending: true, nullsFirst: true })
        .order('show_group', { ascending: true })
        .limit(5);

      if (error) throw error;

      const processedShows = data?.map(show => ({
        show_id: show.show_id,
        show_date: show.show_date,
        formatted_show_date: show.show_date
          .split('-')
          .slice(1)
          .concat(show.show_date.substring(2, 4))
          .join('.'),
        venue_location: show.show_venue_location || '',
        show_subvenue: show.show_subvenue || '',
        show_group: show.show_group || '',
        show_tour: show.show_tour || '',
        show_detail: show.show_detail,
        subvenue_venue: show.show_subvenue_venue || '',
        venue_id: show.subvenues?.venues?.venue_id,
        show_canonid: show.show_canonid
      }));

      const sortedShows = [...processedShows].sort((a, b) => {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }

        const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
        const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
        if (canonIdA !== canonIdB) {
          return canonIdA - canonIdB;
        }

        const groupA = a.show_group || '';
        const groupB = b.show_group || '';
        return groupA.localeCompare(groupB);
      });

      setUpcomingShows(sortedShows || []);
    } catch (error) {
      console.error('Error fetching upcoming shows:', error);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const fetchMostRecentShow = async () => {
    try {
      const now = new Date();
      const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_date,
          show_id,
          show_canonid,
          show_venue_location,
          show_subvenue,
          show_group,
          show_tour,
          show_detail,
          show_iscanon,
          show_subvenue_venue,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `)
        .lte('show_date', alaskaDate)
        .order('show_date', { ascending: false })
        .order('show_canonid', { ascending: false, nullsFirst: false })
        .order('show_group', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setMostRecentShow({
          show_id: data.show_id,
          show_date: data.show_date,
          formatted_show_date: data.show_date
            .split('-')
            .slice(1)
            .concat(data.show_date.substring(2, 4))
            .join('.'),
          venue_location: data.show_venue_location || '',
          show_subvenue: data.show_subvenue || '',
          show_group: data.show_group || '',
          show_tour: data.show_tour || '',
          show_detail: data.show_detail,
          show_iscanon: data.show_iscanon,
          subvenue_venue: data.show_subvenue_venue,
          venue_id: data.subvenues?.venues?.venue_id,
          show_canonid: data.show_canonid
        });

        fetchSetlist(data.show_id);
      }
    } catch (error) {
      console.error('Error fetching most recent show:', error);
    } finally {
      setLoadingMostRecent(false);
    }
  };

  const fetchSetlist = async (showId: string) => {
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
          songs!inner(song_id)
        `)
        .eq('entry_show', showId)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true })
        .order('entry_setorder', { ascending: true });

      if (error) throw error;

      setSetlist(data || []);
    } catch (error) {
      console.error('Error fetching setlist:', error);
    } finally {
      setLoadingSetlist(false);
    }
  };

  const fetchHistoricalShows = async () => {
    try {
      const now = new Date();
      const month = formatInTimeZone(now, 'America/Anchorage', 'MM');
      const day = formatInTimeZone(now, 'America/Anchorage', 'dd');
      const todayMMDD = `${month}-${day}`;

      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_date,
          show_id,
          show_canonid,
          show_venue_location,
          show_subvenue,
          show_group,
          show_tour,
          show_detail,
          show_subvenue_venue,
          subvenues:show_subvenue(
            venues:subvenue_venue(
              venue_id
            )
          )
        `)
        .eq('show_day', todayMMDD)
        .order('show_date', { ascending: true })
        .order('show_canonid', { ascending: true, nullsFirst: true })
        .order('show_group', { ascending: true });

      if (error) throw error;

      const processedShows = data?.map(show => ({
        show_id: show.show_id,
        show_date: show.show_date,
        formatted_show_date: show.show_date
          .split('-')
          .slice(1)
          .concat(show.show_date.substring(2, 4))
          .join('.'),
        venue_location: show.show_venue_location || '',
        show_subvenue: show.show_subvenue || '',
        show_group: show.show_group || '',
        show_tour: show.show_tour || '',
        show_detail: show.show_detail,
        subvenue_venue: show.show_subvenue_venue || '',
        venue_id: show.subvenues?.venues?.venue_id,
        show_canonid: show.show_canonid
      }));

      const sortedShows = [...processedShows].sort((a, b) => {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }

        const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
        const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
        if (canonIdA !== canonIdB) {
          return canonIdA - canonIdB;
        }

        const groupA = a.show_group || '';
        const groupB = b.show_group || '';
        return groupA.localeCompare(groupB);
      });

      setHistoricalShows(sortedShows || []);
    } catch (error) {
      console.error('Error fetching historical shows:', error);
    } finally {
      setLoadingHistorical(false);
    }
  };

  useEffect(() => {
    fetchMostRecentShow();
    fetchRecentShows();
    fetchUpcomingShows();
    fetchHistoricalShows();
  }, []);

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
};
