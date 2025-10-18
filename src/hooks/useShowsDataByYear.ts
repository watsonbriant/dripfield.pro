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

export function useShowsDataByYear(currentYear: string) {
  const { user } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);

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

  // Fetch shows - only when currentYear is set
  useEffect(() => {
    if (!currentYear) return;

    async function fetchShows() {
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
          .eq('show_year', currentYear)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        if (error) throw error;

        const processedData = data?.map(show => ({
          ...show,
          venue_id: show.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(show.show_id),
          venue_location: show.show_venue_location
        }));

        setShows(processedData || []);
      } catch (error) {
        console.error('Error fetching shows:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShows();
  }, [currentYear, attendedShowIds]);

  return { shows, loading };
}
