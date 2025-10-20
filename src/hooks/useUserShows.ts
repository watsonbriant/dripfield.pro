import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUserShows = (userId: string | null) => {
  const [shows, setShows] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserShows() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadingProgress(5);
      
      try {
        // First get the user's attended show IDs with pagination
        let allAttendedShows: Array<{ show_id: string }> = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', userId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            // Update progress based on pagination (5-20%)
            setLoadingProgress(Math.min(20, 5 + (page * 3)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(25);
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          setShows([]);
          setLoadingProgress(100);
          
          // Small delay to ensure we don't flash "No show data" message
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
          return;
        }

        // Get full show details for these IDs with pagination and chunking
        const showIds = allAttendedShows.map(s => s.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        let allShowsData: Array<any> = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from('shows')
              .select('*')
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1)
              .order('show_date', { ascending: true });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allShowsData = [...allShowsData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (25-45%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(45, 25 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        // Sort shows by date
        allShowsData.sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());
        
        setShows(allShowsData);
        setLoadingProgress(50);
        
        // Set loading to false after successful completion
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        
      } catch (error) {
        console.error('Error fetching user attended shows:', error);
        setErrorMessage('Failed to load attended shows data');
        setLoadingProgress(100);
        
        // Only set loading to false after a delay
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }

    fetchUserShows();
  }, [userId]);

  return {
    shows,
    isLoading,
    loadingProgress,
    errorMessage
  };
};
