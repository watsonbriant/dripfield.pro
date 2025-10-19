import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ShowData, SetlistEntryData } from '../types/setlist';

export const useAdminSetlist = () => {
  const [shows, setShows] = useState<ShowData[]>([]);
  const [setlistEntries, setSetlistEntries] = useState<SetlistEntryData[]>([]);
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const mountedRef = useRef(false);
  const showDataLoadedRef = useRef(false);

  // Fetch all shows from the database with pagination
  const fetchShows = async () => {
    try {
      setLoading(true);
      setLoadingProgress(5);
      
      let allShowsData: ShowData[] = [];
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid')
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsLast: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allShowsData = [...allShowsData, ...data];
          page++;
          setLoadingProgress(Math.min(95, 5 + (page * 15)));
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      setShows(allShowsData || []);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching shows:', error);
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  // Fetch setlist entries for a specific show
  const fetchSetlistEntries = async (showId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
          entry_id, 
          entry_set, 
          entry_setnum, 
          entry_setorder,
          entry_song, 
          entry_short, 
          entry_segue, 
          entry_length, 
          entry_placement, 
          entry_coachnotes,
          entry_new,
          entry_show
        `)
        .eq('entry_show', showId)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true });
  
      if (error) throw error;
      setSetlistEntries(data || []);
    } catch (error) {
      console.error('Error fetching setlist entries:', error);
      setSetlistEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle show selection
  const handleShowSelect = (show: ShowData) => {
    setSelectedShow(show);
    fetchSetlistEntries(show.show_id);
    
    // Save the selected show ID to localStorage
    try {
      localStorage.setItem('adminSelectedShowId', show.show_id);
    } catch (error) {
      console.error('Error saving selected show to localStorage:', error);
    }
  };

  // Load selected show from localStorage
  const loadSelectedShowFromStorage = () => {
    if (shows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true;
      
      try {
        const storedShowId = localStorage.getItem('adminSelectedShowId');
        
        if (storedShowId) {
          const storedShow = shows.find(show => show.show_id === storedShowId);
          
          if (storedShow) {
            setSelectedShow(storedShow);
            fetchSetlistEntries(storedShowId);
          }
        }
      } catch (error) {
        console.error('Error restoring selected show from localStorage:', error);
      }
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (!mountedRef.current) {
      fetchShows();
      mountedRef.current = true;
    }
  }, []);

  // Load selected show from localStorage after shows are loaded
  useEffect(() => {
    loadSelectedShowFromStorage();
  }, [shows]);

  // Handle visibility change to reload data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedShow) {
        fetchSetlistEntries(selectedShow.show_id);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedShow]);

  return {
    shows,
    setlistEntries,
    selectedShow,
    loading,
    loadingProgress,
    handleShowSelect,
    fetchSetlistEntries
  };
};
