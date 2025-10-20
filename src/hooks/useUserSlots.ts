import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SlotData, SongEntryWithId } from '../types/userSlots';

export const useUserSlots = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [songIdMap, setSongIdMap] = useState<{ [songName: string]: string }>({});
  const [hasSlotEntries, setHasSlotEntries] = useState(false);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);

  // Fetch attended shows for user
  useEffect(() => {
    if (!userId) {
      setAttendedShowIds([]);
      setIsLoading(false);
      return;
    }

    const fetchAttendedShows = async () => {
      try {
        setLoadingProgress(5);
        
        // Get user's attended shows with pagination
        let allAttendedShows = [];
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
        
        const showIds = allAttendedShows.map(item => item.show_id);
        setAttendedShowIds(showIds);
        
        // If there are attended shows, fetch the slots data
        if (showIds.length > 0) {
          fetchSlotsData(showIds);
        } else {
          setLoadingProgress(100);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setAttendedShowIds([]);
        setLoadingProgress(100);
        setIsLoading(false);
      }
    };
    
    fetchAttendedShows();
  }, [userId]);

  // Fetch song IDs
  useEffect(() => {
    const fetchSongIds = async () => {
      try {
        setLoadingProgress(prev => Math.max(prev, 25));
        
        // Fetch song IDs with pagination
        let allSongData = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('songs')
            .select('song, song_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSongData = [...allSongData, ...data];
            page++;
            
            // Update progress based on pagination (25-40%)
            const currentProgress = Math.min(40, 25 + (page * 1));
            setLoadingProgress(prev => Math.max(prev, currentProgress));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        const songMap: { [songName: string]: string } = {};
        allSongData?.forEach(songData => {
          songMap[songData.song] = songData.song_id;
        });
        
        setSongIdMap(songMap);
        setLoadingProgress(prev => Math.max(prev, 40));
      } catch (error) {
        console.error('Error fetching song IDs:', error);
        setLoadingProgress(prev => Math.max(prev, 40));
      }
    };
    
    fetchSongIds();
  }, []);

  const fetchSlotsData = async (showIds: string[]) => {
    if (!showIds.length) {
      setLoadingProgress(100);
      setIsLoading(false);
      return;
    }

    try {
      setLoadingProgress(40);
      
      // Fetch placements
      const { data: placementsData, error: placementsError } = await supabase
        .from('placements')
        .select('placements, placement_order')
        .order('placement_order');
        
      if (placementsError) throw placementsError;
      
      setLoadingProgress(50);
      
      // Split showIds into chunks for batch processing
      const showIdChunks = [];
      const chunkSize = 200; // Supabase has limits on IN clause size
      
      for (let i = 0; i < showIds.length; i += chunkSize) {
        showIdChunks.push(showIds.slice(i, i + chunkSize));
      }
      
      // Get slots data for all attended shows with pagination and chunking
      let allSlotsData = [];
      
      for (let i = 0; i < showIdChunks.length; i++) {
        const currentChunk = showIdChunks[i];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('shows')
            .select(`
              show_id,
              show_date,
              show_canonid,
              setlist_entries (
                entry_placement,
                entry_song,
                entry_setnum
              )
            `)
            .in('show_id', currentChunk)
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order('show_date', { ascending: true })
            .order('show_canonid', { ascending: true, nullsFirst: true });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSlotsData = [...allSlotsData, ...data];
            page++;
            
            // Update progress based on pagination and chunks (50-90%)
            const progressPerChunk = 40 / showIdChunks.length;
            const chunkProgress = (i / showIdChunks.length) * 40;
            const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
            setLoadingProgress(Math.min(90, 50 + chunkProgress + pageProgress));
            
            // If we got fewer records than the page size, we're done with this chunk
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
      }
      
      // Process slots data
      setLoadingProgress(95);
      
      const transformedData = allSlotsData?.map(show => {
        const slots: any = {
          show_id: show.show_id,
          Show_Date: show.show_date
        };

        // Group entries by placement
        const placementEntries: { [key: string]: Array<SongEntryWithId> } = {};
        
        show.setlist_entries?.forEach(entry => {
          // Skip main set entries
          if (entry.entry_placement.startsWith('Main Set')) {
            return;
          }
          
          const key = entry.entry_placement.replace(/\s+/g, '_');
          if (!placementEntries[key]) {
            placementEntries[key] = [];
          }
          placementEntries[key].push({
            song: entry.entry_song,
            setnum: entry.entry_setnum
          });
        });

        // Add entries to slots
        Object.entries(placementEntries).forEach(([key, entries]) => {
          // Sort entries by setnum
          entries.sort((a, b) => a.setnum - b.setnum);
          slots[key] = entries;
        });

        return slots;
      });

      // Find active columns and order them according to placement_order
      const columnsWithData = new Set<string>();
      transformedData?.forEach(show => {
        Object.entries(show).forEach(([key, value]) => {
          if (value && key !== 'show_id' && key !== 'Show_Date') {
            columnsWithData.add(key);
          }
        });
      });

      // Order the columns based on placement_order
      const orderedColumns = placementsData
        ?.filter(p => Array.from(columnsWithData).includes(p.placements.replace(/\s+/g, '_')))
        .map(p => p.placements.replace(/\s+/g, '_'));

      const hasEntries = (transformedData || []).some(show => 
        Object.keys(show).some(key => 
          key !== 'show_id' && 
          key !== 'Show_Date' && 
          show[key] !== null
        )
      );
      
      // Update state
      setSlots(transformedData || []);
      setHasSlotEntries(hasEntries);
      setActiveColumns(orderedColumns || []);
      setLoadingProgress(100);
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching slots data:', error);
      setLoadingProgress(100);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    loadingProgress,
    slots,
    activeColumns,
    songIdMap,
    hasSlotEntries,
    attendedShowIds
  };
};
