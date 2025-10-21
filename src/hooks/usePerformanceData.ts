import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ChartPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  joty_round?: string | null;
  shows_since_debut_num?: number | null;
  gap?: number | string | null;
}

export const usePerformanceData = (performances: ChartPerformance[]) => {
  const { user } = useAuth();
  const [performancesWithGaps, setPerformancesWithGaps] = useState<ChartPerformance[]>([]);
  const [attendedShowIds, setAttendedShowIds] = useState<Set<string>>(new Set());
  const [loadingAttended, setLoadingAttended] = useState(false);

  // Calculate gaps for all performances
  useEffect(() => {
    const calculateGaps = () => {
      const sortedPerfs = [...performances].sort((a, b) => {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        const setA = a.entry_set || '';
        const setB = b.entry_set || '';
        const setComparison = setA.localeCompare(setB);
        if (setComparison !== 0) return setComparison;
        
        const setnumA = parseInt(a.entry_setnum || '0');
        const setnumB = parseInt(b.entry_setnum || '0');
        return setnumA - setnumB;
      });

      const perfsWithGaps = sortedPerfs.map((perf, index) => {
        let gap: number | string | null = null;

        if (perf.shows_since_debut_num !== null && perf.shows_since_debut_num !== undefined) {
          if (index === 0) {
            gap = 'Debut';
          } else {
            let prevIndex = index - 1;
            while (prevIndex >= 0) {
              const prevPerf = sortedPerfs[prevIndex];
              if (prevPerf.shows_since_debut_num !== null && prevPerf.shows_since_debut_num !== undefined) {
                gap = perf.shows_since_debut_num - prevPerf.shows_since_debut_num;
                break;
              }
              prevIndex--;
            }
            
            if (gap === null) {
              gap = 'Debut';
            }
          }
        }

        return { ...perf, gap };
      });

      setPerformancesWithGaps(perfsWithGaps);
    };

    calculateGaps();
  }, [performances]);

  // Fetch attended shows when user is logged in
  useEffect(() => {
    async function fetchAttendedShows() {
      if (!user) {
        setAttendedShowIds(new Set());
        return;
      }

      setLoadingAttended(true);
      try {
        const { data, error } = await supabase
          .from('user_attended_shows')
          .select('show_id')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const showIds = new Set(data.map(record => record.show_id));
          setAttendedShowIds(showIds);
        }
      } catch (error) {
        console.error('Error fetching attended shows:', error);
      } finally {
        setLoadingAttended(false);
      }
    }

    fetchAttendedShows();
  }, [user]);

  return {
    performancesWithGaps,
    attendedShowIds,
    loadingAttended
  };
};
