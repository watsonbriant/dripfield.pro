import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export interface AttendShow {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue: string;
  show_alert: string | null;
  show_detail: string | null;
  show_year: string;
  attended: boolean;
}

export const useAttendShowData = (yearFilter: string) => {
  const { user, addAttendedShow, removeAttendedShow } = useAuth();
  const [shows, setShows] = useState<AttendShow[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch attended shows for the user
  const fetchAttendedShowIds = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_attended_shows')
        .select('show_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return data.map(item => item.show_id);
    } catch (error) {
      console.error('Error fetching attended shows:', error);
      return [];
    }
  };

  // Function to fetch shows with attendance status
  const fetchShows = useCallback(async () => {
    if (!user || !yearFilter) return;
    
    setLoading(true);
    try {
      // First get all attended show IDs
      const attendedShowIds = await fetchAttendedShowIds();
      
      // Then fetch shows for the selected year
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_id,
          show_date,
          show_group,
          show_subvenue,
          show_venue_location,
          show_subvenue_venue,
          show_alert,
          show_detail,
          show_year
        `)
        .eq('show_year', yearFilter)
        .order('show_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Map the shows and mark those that are attended
        const showsWithAttendance = data.map(show => ({
          ...show,
          attended: attendedShowIds.includes(show.show_id)
        }));
        
        setShows(showsWithAttendance);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  }, [user, yearFilter]);

  // Handle attendance toggle
  const handleAttendanceToggle = async (show: AttendShow) => {
    if (!user) return;
    
    try {
      if (show.attended) {
        await removeAttendedShow(show.show_id);
      } else {
        await addAttendedShow(show.show_id);
      }
      
      // Update the local state to reflect the change
      setShows(prev => 
        prev.map(s => 
          s.show_id === show.show_id ? { ...s, attended: !s.attended } : s
        )
      );
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  // Fetch shows when year filter changes
  useEffect(() => {
    if (yearFilter) {
      fetchShows();
    }
  }, [yearFilter, fetchShows]);

  return {
    shows,
    loading,
    handleAttendanceToggle
  };
};