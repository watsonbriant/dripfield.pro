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
          .select('show_id, show_canonid, show_date, show_group')
          .eq('show_tour', tourId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setShowPositionInTour(null);
          return;
        }

        // Sort by show_date ascending, then shows with show_canonid (sorted ascending), 
        // then shows without show_canonid (sorted ascending by show_group)
        const sortedShows = [...data].sort((a, b) => {
          // Primary sort: show_date ascending
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          
          // Secondary sort: within same date, canonical shows come first
          const aHasCanonid = a.show_canonid !== null;
          const bHasCanonid = b.show_canonid !== null;
          
          if (aHasCanonid && bHasCanonid) {
            // Both have canonid: sort by canonid ascending
            return a.show_canonid! - b.show_canonid!;
          } else if (aHasCanonid && !bHasCanonid) {
            // a has canonid, b doesn't: a comes first
            return -1;
          } else if (!aHasCanonid && bHasCanonid) {
            // a doesn't have canonid, b does: b comes first
            return 1;
          } else {
            // Neither has canonid: sort by show_group ascending
            return (a.show_group || '').localeCompare(b.show_group || '');
          }
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

