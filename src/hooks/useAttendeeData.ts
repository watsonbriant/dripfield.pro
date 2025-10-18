import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
}

export function useAttendeeData(filteredShows: Show[]) {
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (filteredShows.length === 0) return;
      
      try {
        const showIds = filteredShows.map(s => s.show_id);
        
        const { count, error: countError } = await supabase
          .from('user_attended_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .in('show_id', showIds)
            .range(start, end);
          
          if (error) throw error;
          
          if (data) {
            allData = [...allData, ...data];
          }
        }
        
        const counts: Record<string, number> = {};
        filteredShows.forEach(show => {
          counts[show.show_id] = 0;
        });
        
        allData.forEach(record => {
          counts[record.show_id] = (counts[record.show_id] || 0) + 1;
        });
        
        setAttendeeCounts(counts);
      } catch (error) {
        console.error('Error fetching attendee counts:', error);
      }
    };
    
    fetchAttendeeCounts();
  }, [filteredShows]);

  return { attendeeCounts };
}
