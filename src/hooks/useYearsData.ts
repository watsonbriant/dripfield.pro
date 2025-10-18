import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Year {
  year: string;
  year_id: string;
}

export function useYearsData() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchYears() {
      try {
        const { data, error } = await supabase
          .from('years')
          .select('year, year_id')
          .order('year', { ascending: true });

        if (error) throw error;
        setYears(data || []);
      } catch (error) {
        console.error('Error fetching years:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchYears();
  }, []);

  return { years, loading };
}
