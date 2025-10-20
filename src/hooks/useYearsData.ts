import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useYearsData = () => {
  const [years, setYears] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');

  // Function to fetch all available years
  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('years')
        .select('year')
        .order('year', { ascending: false });

      if (error) throw error;
      if (data) {
        const yearList = data.map(y => y.year);
        setYears(yearList);
        // Set default year to the latest year
        if (yearList.length > 0 && !yearFilter) {
          setYearFilter(yearList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  // Fetch years on component mount
  useEffect(() => {
    fetchYears();
  }, []);

  return {
    years,
    yearFilter,
    setYearFilter
  };
};