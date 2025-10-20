import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Guest, GuestsByCategory } from '../types/guests';

export const useUserGuests = (userId: string | null) => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [guestsByCategory, setGuestsByCategory] = useState<GuestsByCategory>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserGuests = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // 1. Get user's attended shows with pagination
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
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        const showIds = allAttendedShows.map(show => show.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        // 2. Get setlist entries for those shows with pagination and chunking
        let allSetlistEntries = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from('setlist_entries')
              .select('entry_id, entry_show')
              .in('entry_show', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allSetlistEntries = [...allSetlistEntries, ...data];
              page++;
              
              // Update progress based on pagination and chunks (20-40%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(40, 20 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allSetlistEntries || allSetlistEntries.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        const entryIds = allSetlistEntries.map(entry => entry.entry_id);
        
        // Create a mapping of entry_id to show_id for later use
        const entryToShowMap: Record<string, string> = {};
        allSetlistEntries.forEach(entry => {
          entryToShowMap[entry.entry_id] = entry.entry_show;
        });
        
        // Split entryIds into chunks for batch processing
        const entryIdChunks = [];
        
        for (let i = 0; i < entryIds.length; i += chunkSize) {
          entryIdChunks.push(entryIds.slice(i, i + chunkSize));
        }
        
        // 3. Get guest appearances for those setlist entries with pagination and chunking
        let allGuestJoins = [];
        
        for (let i = 0; i < entryIdChunks.length; i++) {
          const currentChunk = entryIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from('setlist_entry_guests')
              .select('setlist_entry_id, guest_id')
              .in('setlist_entry_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allGuestJoins = [...allGuestJoins, ...data];
              page++;
              
              // Update progress based on pagination and chunks (40-60%)
              const progressPerChunk = 20 / entryIdChunks.length;
              const chunkProgress = (i / entryIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(60, 40 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allGuestJoins || allGuestJoins.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        // Get unique guest IDs
        const guestIds = [...new Set(allGuestJoins.map(join => join.guest_id))];
        
        // Split guestIds into chunks for batch processing if needed
        const guestIdChunks = [];
        
        for (let i = 0; i < guestIds.length; i += chunkSize) {
          guestIdChunks.push(guestIds.slice(i, i + chunkSize));
        }
        
        // 4. Get guest details with pagination and chunking
        let allGuests = [];
        
        for (let i = 0; i < guestIdChunks.length; i++) {
          const currentChunk = guestIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from('guests')
              .select('guest_id, guest, guest_category')
              .in('guest_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allGuests = [...allGuests, ...data];
              page++;
              
              // Update progress based on pagination and chunks (60-80%)
              const progressPerChunk = 20 / guestIdChunks.length;
              const chunkProgress = (i / guestIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(80, 60 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allGuests || allGuests.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        setLoadingProgress(85);
        
        // 5. Process data to count guest appearances by category
        const guestMap: Record<string, Guest> = {};
        const guestSongs: Record<string, Set<string>> = {};
        const guestShows: Record<string, Set<string>> = {};
        
        // Initialize tracking structures
        allGuests.forEach(guest => {
          const guestId = guest.guest_id;
          guestSongs[guestId] = new Set();
          guestShows[guestId] = new Set();
          
          guestMap[guestId] = {
            guest_id: guestId,
            guest: guest.guest,
            guest_category: guest.guest_category,
            song_count: 0,
            show_count: 0
          };
        });
        
        setLoadingProgress(90);
        
        // Count songs and shows for each guest
        allGuestJoins.forEach(join => {
          const guestId = join.guest_id;
          const entryId = join.setlist_entry_id;
          const showId = entryToShowMap[entryId];
          
          if (guestId && entryId) {
            guestSongs[guestId].add(entryId);
          }
          
          if (guestId && showId) {
            guestShows[guestId].add(showId);
          }
        });
        
        // Update guest objects with counts
        Object.keys(guestMap).forEach(guestId => {
          guestMap[guestId].song_count = guestSongs[guestId]?.size || 0;
          guestMap[guestId].show_count = guestShows[guestId]?.size || 0;
        });
        
        setLoadingProgress(95);
        
        // Group by category
        const groupedGuests: GuestsByCategory = {};
        
        Object.values(guestMap).forEach(guest => {
          const category = guest.guest_category;
          
          if (!groupedGuests[category]) {
            groupedGuests[category] = {
              guests: [],
              count: 0
            };
          }
          
          groupedGuests[category].guests.push(guest);
          groupedGuests[category].count = groupedGuests[category].guests.length;
        });
        
        // Sort guests within each category by song count descending
        for (const category in groupedGuests) {
          groupedGuests[category].guests.sort((a, b) => b.song_count - a.song_count);
        }
        
        setGuestsByCategory(groupedGuests);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching user personnel:', error);
        setError('Failed to load personnel data');
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };
    
    fetchUserGuests();
  }, [userId]);

  return {
    loading,
    loadingProgress,
    guestsByCategory,
    error
  };
};
