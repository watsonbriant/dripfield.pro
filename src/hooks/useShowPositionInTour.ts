import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ShowPosition {
  position: number;
  total: number;
}

export const useShowPositionInTour = (showId: string | undefined, tourId: string | undefined) => {
  const [showPositionInTour, setShowPositionInTour] = useState<ShowPosition | null>(null);

  useEffect(() => {
    async function calculateShowPosition() {
      if (!tourId || !showId) {
        setShowPositionInTour(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_canonid, show_date')
          .eq('show_tour', tourId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setShowPositionInTour(null);
          return;
        }

        // Sort by show_canonid first, then show_date (nulls last)
        const sortedShows = [...data].sort((a, b) => {
          if (a.show_canonid === null && b.show_canonid === null) {
            return new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
          }
          if (a.show_canonid === null) return 1;
          if (b.show_canonid === null) return -1;
          if (a.show_canonid !== b.show_canonid) {
            return a.show_canonid - b.show_canonid;
          }
          return new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
        });

        // Find current show's position (1-indexed)
        const position = sortedShows.findIndex(s => s.show_id === showId) + 1;
        const total = sortedShows.length;

        if (position > 0) {
          setShowPositionInTour({ position, total });
        } else {
          setShowPositionInTour(null);
        }
      } catch (error) {
        console.error('Error calculating show position:', error);
        setShowPositionInTour(null);
      }
    }

    calculateShowPosition();
  }, [tourId, showId]);

  return showPositionInTour;
};

