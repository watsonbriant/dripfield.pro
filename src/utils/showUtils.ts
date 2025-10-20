import { supabase } from '../lib/supabase';

// Convert UTC datetime to Eastern Time for display
export const convertToEasternDisplay = (utcDatetime: string | null): string => {
    if (!utcDatetime) return '';
    
    const utcDate = new Date(utcDatetime);
    
    // Create a new date representing the same moment in Eastern Time
    const easternDateString = utcDate.toLocaleString('en-CA', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Convert from "YYYY-MM-DD, HH:MM" to "YYYY-MM-DDTHH:MM"
    const formatted = easternDateString.replace(', ', 'T');
    
    return formatted;
};

// Convert Eastern Time input to UTC for storage
export const convertFromEasternToUTC = (easternDatetime: string): string => {
    if (!easternDatetime) return '';
    
    try {
        // Parse the datetime-local input as Eastern Time
        const [datePart, timePart] = easternDatetime.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        
        // Create a date in Eastern Time using Intl.DateTimeFormat to handle EST/EDT automatically
        const easternDate = new Date();
        easternDate.setFullYear(year, month - 1, day);
        easternDate.setHours(hour, minute, 0, 0);
        
        // Convert to Eastern timezone string and then parse as UTC
        const easternISO = easternDate.toLocaleString('sv-SE', { timeZone: 'America/New_York' }).replace(' ', 'T') + ':00.000Z';
        
        // Better approach: use the fact that we know the offset
        const tempUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
        
        // Get the timezone offset for this specific date (handles EST vs EDT)
        const testDate = new Date(year, month - 1, day);
        const easternOffset = testDate.toLocaleString('en', { timeZone: 'America/New_York', timeZoneName: 'short' }).includes('EDT') ? -4 : -5;
        
        // Apply the offset to convert Eastern to UTC
        const utcDate = new Date(tempUtc.getTime() - (easternOffset * 60 * 60 * 1000));
        
        const isoString = utcDate.toISOString();
        
        return isoString;
    } catch (error) {
        return '';
    }
};

export const formatDate = (dateString: string) => {
    // Parse the date as UTC and adjust for timezone
    const date = new Date(dateString + 'T00:00:00Z');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const year = date.getUTCFullYear().toString().slice(-2);
    return `${month}.${day}.${year}`;
};

export const getShowDisplayData = (show: any) => {
    const dateStr = formatDate(show.show_date);
    const canonIdStr = show.show_canonid ? ` [${show.show_canonid}]` : '';
    const locationStr = ` [${show.show_group} – ${show.show_venue_location || 'Unknown'}]`;
    return {
        dateStr,
        canonIdStr,
        locationStr
    };
};

export interface AttendedShow {
  id: string;
  user_id: string;
  show_id: string;
  created_at: string;
  show?: {
    show_id: string;
    show_date: string;
    show_group: string;
    show_subvenue: string;
    show_venue_location: string;
    show_subvenue_venue: string;
    show_tour: string | null;
    show_canonid: string | null;
    tours: {
      tour_id: string;
    } | null;
    show_detail: string | null;
    show_alert: string | null;
    show_length?: string | null;
    show_rarity?: string | null;
    show_gap?: string | null;
  };
}

export const fetchAttendedShows = async (
  userId: string,
  onProgress?: (progress: number) => void
): Promise<AttendedShow[]> => {
  onProgress?.(5);
  
  // Get the basic attended show records with pagination
  let allAttendanceData = [];
  let page = 0;
  let hasMore = true;
  const pageSize = 1000;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('user_attended_shows')
      .select('*')
      .eq('user_id', userId)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      allAttendanceData = [...allAttendanceData, ...data];
      page++;
      
      // Update progress based on pagination (5-25%)
      onProgress?.(Math.min(25, 5 + (page * 5)));
      
      // If we got fewer records than the page size, we're done
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }
  
  // If the user hasn't attended any shows, return early
  if (allAttendanceData.length === 0) {
    onProgress?.(100);
    return [];
  }
  
  // Extract the show IDs
  const showIds = allAttendanceData.map(show => show.show_id);
  
  onProgress?.(30);
  
  // Split showIds into chunks for batch processing
  const showIdChunks = [];
  const chunkSize = 200; // Supabase has limits on IN clause size
  
  for (let i = 0; i < showIds.length; i += chunkSize) {
    showIdChunks.push(showIds.slice(i, i + chunkSize));
  }
  
  // Fetch the show details for each attended show with pagination and chunking
  let allShowData = [];
  
  for (let i = 0; i < showIdChunks.length; i++) {
    const currentChunk = showIdChunks[i];
    page = 0;
    hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_id,
          show_date,
          show_group,
          show_subvenue,
          show_venue_location,
          show_subvenue_venue,
          show_tour,
          show_canonid,
          show_length,
          show_rarity,
          show_gap,
          tours!show_tour(
            tour_id
          ),
          show_detail,
          show_alert
        `)
        .in('show_id', currentChunk)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        allShowData = [...allShowData, ...data];
        page++;
        
        // Update progress based on pagination and chunks (30-75%)
        const progressPerChunk = 45 / showIdChunks.length;
        const chunkProgress = (i / showIdChunks.length) * 45;
        const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
        onProgress?.(Math.min(75, 30 + chunkProgress + pageProgress));
        
        // If we got fewer records than the page size, we're done with this chunk
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
  }
  onProgress?.(80);
  
  // Combine the attendance records with the show details and format the values
  const combinedData = allAttendanceData.map(attendedShow => {
    const showDetails = allShowData?.find(show => show.show_id === attendedShow.show_id);
    
    let showWithFormattedValues = { ...showDetails };
    
    if (showDetails) {
      // Format rarity with % symbol if it exists
      const show_rarity = showDetails.show_rarity !== null && showDetails.show_rarity !== undefined
        ? `${showDetails.show_rarity.toFixed(2)}%`
        : null;
      
      // Format gap as string with 2 decimal places if it exists
      const show_gap = showDetails.show_gap !== null && showDetails.show_gap !== undefined
        ? showDetails.show_gap.toFixed(2)
        : null;
      
      showWithFormattedValues = {
        ...showDetails,
        show_rarity,
        show_gap
      };
    }
    
    return {
      ...attendedShow,
      show: showWithFormattedValues
    };
  });
  
  onProgress?.(90);
  
  // Sort by date, oldest first
  const sortedShows = combinedData.sort((a, b) => {
    if (!a.show?.show_date || !b.show?.show_date) return 0;
    return new Date(a.show.show_date).getTime() - new Date(b.show.show_date).getTime();
  });
  
  onProgress?.(100);
  return sortedShows;
};