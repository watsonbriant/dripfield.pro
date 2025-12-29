import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

const tourColors = ['#0bacc9', '#e4482f', '#fcb924', '#67a343', '#9e598f', '#be823a', '#f58ba2', '#7b6e66', '#ec7523', '#050608', '#fee4d3'];

export function useToursData(currentYear: string) {
  const [tours, setTours] = useState<TourCount[]>([]);

  useEffect(() => {
    if (!currentYear) return;

    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_tour,
            tours(tour,tour_canonid,tour_id)
          `)
          .eq('show_year', currentYear);

        if (error) throw error;

        const tourCounts = {};
        data.forEach(item => {
          if (tourCounts[item.show_tour]) {
            tourCounts[item.show_tour].count++;
          } else {
            tourCounts[item.show_tour] = {
              count: 1,
              tour_canonid: item.tours?.tour_canonid,
              tour_id: item.tours?.tour_id,
              tour: item.show_tour
            };
          }
        });

        const transformedTours = Object.entries(tourCounts).map(([tourName, { count, tour_canonid, tour_id, tour }]) => ({
          tour_count: `${tourName} (${count})`,
          tour_canonid: tour_canonid || 0,
          tour_id: tour_id || '',
          tour: tourName
        }));

        const sortedTours = transformedTours.sort((a, b) => a.tour_canonid - b.tour_canonid);
        
        const toursWithColors = sortedTours.map((tour, index) => ({
          ...tour,
          color: tourColors[index % tourColors.length]
        }));

        setTours(toursWithColors);
      } catch (error) {
        console.error('Error fetching tours:', error);
      }
    }

    fetchTours();
  }, [currentYear]);

  return { tours };
}
