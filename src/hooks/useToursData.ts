import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

const tourColors = [
  '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', 
  '#9B59B6', '#FF6B81', '#F1C40F', '#34495E',
  '#FFFFFF', '#000000'
];

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
