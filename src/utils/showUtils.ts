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
