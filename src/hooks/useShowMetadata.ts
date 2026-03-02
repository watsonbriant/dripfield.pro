import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
}

export function useShowMetadata(shows: Show[], currentYear: string) {
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());
  const [showsWithRadioIds, setShowsWithRadioIds] = useState<Set<string>>(new Set());

  // Fetch shows with setlists
  useEffect(() => {
    async function fetchShowsWithSetlists() {
      if (!currentYear || shows.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('show_setlists')
          .select('show_id')
          .in('show_id', shows.map(s => s.show_id));
        
        if (error) throw error;
        
        const setlistSet = new Set(data?.map(item => item.show_id) || []);
        setShowsWithSetlists(setlistSet);
      } catch (error) {
        console.error('Error fetching shows with setlists:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchShowsWithSetlists();
    }
  }, [shows, currentYear]);

  // Fetch shows with releases (with pagination)
  useEffect(() => {
    async function fetchShowsWithReleases() {
      if (!currentYear || shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        const { count, error: countError } = await supabase
          .from('releases_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allReleaseShows: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('releases_shows')
            .select('show_id')
            .in('show_id', showIds)
            .range(start, end);
          
          if (error) throw error;
          
          if (data) {
            allReleaseShows = [...allReleaseShows, ...data];
          }
        }
        
        const releaseSet = new Set(allReleaseShows.map(item => item.show_id));
        setShowsWithReleases(releaseSet);
      } catch (error) {
        console.error('Error fetching shows with releases:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchShowsWithReleases();
    }
  }, [shows, currentYear]);

  // Fetch shows with radio_id in setlist_entries
  useEffect(() => {
    async function fetchShowsWithRadioIds() {
      if (!currentYear || shows.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select('entry_show')
          .in('entry_show', shows.map(s => s.show_id))
          .not('radio_id', 'is', null);

        if (error) throw error;

        const radioSet = new Set(data?.map(item => item.entry_show).filter(Boolean) || []);
        setShowsWithRadioIds(radioSet);
      } catch (error) {
        console.error('Error fetching shows with radio IDs:', error);
      }
    }

    if (shows.length > 0) {
      fetchShowsWithRadioIds();
    }
  }, [shows, currentYear]);

  return { showsWithSetlists, showsWithReleases, showsWithRadioIds };
}
