import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AttendanceStatsData } from '../types/attendance';

export const useAttendanceStats = (userId: string | null) => {
  const [data, setData] = useState<AttendanceStatsData>({
    showsCount: 0,
    venuesCount: 0,
    songsCount: 0,
    tourCounts: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const fetchDataWithPagination = async (
    table: string,
    select: string,
    filter: { column: string; value: any },
    pageSize: number = 1000
  ) => {
    let allData = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq(filter.column, filter.value)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        page++;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  };

  const fetchDataInChunks = async (
    table: string,
    select: string,
    ids: string[],
    idColumn: string,
    pageSize: number = 1000
  ) => {
    const chunkSize = 200;
    const chunks = [];
    
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    let allData = [];

    for (const chunk of chunks) {
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select(select)
          .in(idColumn, chunk)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    }

    return allData;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        if (!userId) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }

        // Get user's attended shows
        const allAttendedShows = await fetchDataWithPagination(
          'user_attended_shows',
          'show_id',
          { column: 'user_id', value: userId }
        );
        
        setLoadingProgress(22);
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }

        const allShowIds = allAttendedShows.map(record => record.show_id);
        setLoadingProgress(25);

        // Get show details and filter for Goose shows with canonid
        const allShowDetails = await fetchDataInChunks(
          'shows',
          'show_id, show_group, show_canonid',
          allShowIds,
          'show_id'
        );

        const filteredShows = allShowDetails.filter(show => 
          show.show_group === 'Goose' && show.show_canonid
        );

        const showIds = filteredShows.map(show => show.show_id);
        setLoadingProgress(35);

        // Count unique venues
        const allVenueData = await fetchDataInChunks(
          'shows',
          `show_id,
          show_subvenue,
          subvenues(
            subvenue_venue,
            venues(venue)
          )`,
          showIds,
          'show_id'
        );

        const uniqueVenues = new Set();
        allVenueData.forEach(show => {
          if (show.subvenues && show.subvenues.subvenue_venue) {
            uniqueVenues.add(show.subvenues.subvenue_venue);
          }
        });

        setLoadingProgress(65);

        // Count unique songs
        const allSongData = await fetchDataInChunks(
          'setlist_entries',
          'entry_song',
          showIds,
          'entry_show'
        );

        const uniqueSongs = new Set();
        allSongData.forEach(entry => {
          if (entry.entry_song) {
            uniqueSongs.add(entry.entry_song);
          }
        });

        setLoadingProgress(90);

        // Get tour counts
        const allTourData = await fetchDataInChunks(
          'shows',
          `show_id,
          show_tour,
          tours(
            tour,
            tour_canonid,
            tour_id
          )`,
          showIds,
          'show_id'
        );

        // Count shows per tour
        const tourCountMap: Record<string, { count: number; tour: string; tour_canonid: number; tour_id: string }> = {};

        allTourData.forEach(show => {
          if (show.show_tour && show.tours) {
            const tourName = show.tours.tour;
            const canonId = show.tours.tour_canonid;
            const tourId = show.tours.tour_id;
            
            if (!tourCountMap[tourName]) {
              tourCountMap[tourName] = { 
                count: 0,
                tour: tourName,
                tour_canonid: canonId || 0,
                tour_id: tourId
              };
            }
            
            tourCountMap[tourName].count += 1;
          }
        });
        
        // Convert to array and sort by tour_canonid
        const sortedTours = Object.values(tourCountMap).sort(
          (a, b) => a.tour_canonid - b.tour_canonid
        );

        setData({
          showsCount: showIds.length,
          venuesCount: uniqueVenues.size,
          songsCount: uniqueSongs.size,
          tourCounts: sortedTours,
        });

        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
        
      } catch (error) {
        console.error('Error fetching attendance stats:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchStats();
  }, [userId]);

  return { data, loading, loadingProgress };
};
