import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
}

export function useShowRatings(filteredShows: Show[]) {
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchShowRatings = async () => {
      if (filteredShows.length === 0) return;
      
      try {
        const showIds = filteredShows.map(s => s.show_id);
        
        const { data, error } = await supabase
          .from('show_ratings')
          .select('show_id, rating')
          .in('show_id', showIds);
        
        if (error) throw error;
        
        const ratings: Record<string, number> = {};
        filteredShows.forEach(show => {
          const showRatingsData = data?.filter(r => r.show_id === show.show_id) || [];
          if (showRatingsData.length > 0) {
            const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
            ratings[show.show_id] = Math.round(average * 100) / 100;
          } else {
            ratings[show.show_id] = 0;
          }
        });
        
        setShowRatings(ratings);
      } catch (error) {
        console.error('Error fetching show ratings:', error);
      }
    };
    
    fetchShowRatings();
  }, [filteredShows]);

  return { showRatings };
}
