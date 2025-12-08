import { SetlistEntry, ShowDate, Show, GuestGroup } from '../types/setlist';

export const getGridClass = (showCanonId: number | null): string => {
  return showCanonId !== null 
    ? "grid grid-cols-[32px_max-content_50px_60px_55px_50px_30px_minmax(150px,1fr)] gap-4"
    : "grid grid-cols-[32px_max-content_50px_30px_minmax(150px,1fr)] gap-4";
};

export const createMarkup = (htmlContent: string) => {
  return { __html: htmlContent };
};

export const calculateRarity = (timesPlayed: number | null, showsSinceDebut: number | null): string => {
  if (!timesPlayed || !showsSinceDebut || showsSinceDebut === 0) return '';
  const percentage = (timesPlayed / showsSinceDebut) * 100;
  return Math.round(percentage) + '%';
};

export const getRarityColor = (percentage: string | null): string => {
  if (!percentage || percentage === '-' || percentage === '') return 'transparent';
  
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },
    { percent: 12, color: { r: 230, g: 81, b: 0 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 46, g: 125, b: 50 } },
    { percent: 100, color: { r: 13, g: 71, b: 161 } }
  ];
  
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const getPlacementColor = (placement: string): string => {
  const colorMap: { [key: string]: string } = {
    'Set 1 Opener': '#047857',
    'Set 1 Closer': '#1e40af',
    'Set 2 Opener': '#10b981',
    'Set 3 Opener': '#10b981',
    'Set 4 Opener': '#10b981',
    'Set 5 Opener': '#10b981',
    'Set 2 Closer': '#3b82f6',
    'Set 3 Closer': '#3b82f6',
    'Set 4 Closer': '#3b82f6',
    'Set 5 Closer': '#3b82f6',
    'Encore 1': '#be123c',
    'Encore 2': '#f43f5e',
    'Encore 3': '#f43f5e'
  };
  
  if (placement.startsWith('Main Set')) {
    return 'transparent';
  }
  
  return colorMap[placement] || '#0c1d27';
};

export const formatLength = (length: string | null): string => {
  if (!length) return '';
  const parts = length.split(':').map(part => parseInt(part));
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours === 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return length;
};

export const isMainSet = (set: string): boolean => {
  return ['1', '2', '3', '4', '5'].includes(set);
};

export const shouldShowSetBreak = (currentSet: string, nextSet: string): boolean => {
  return isMainSet(currentSet) && isMainSet(nextSet) && currentSet !== nextSet;
};

export const getEncoreLabel = (set: string): string => {
  switch (set) {
    case 'E1': return 'Encore';
    case 'E2': return '2nd Encore';
    case 'E3': return '3rd Encore';
    default: return '';
  }
};

export const calculateShowPosition = (show: Show, showDates: ShowDate[]) => {
  if (!show || !showDates.length) return null;
  
  // Sort by show_date ascending, then shows with show_canonid (sorted ascending),
  // then shows without show_canonid (sorted ascending by show_group)
  const sortedShows = [...showDates].sort((a, b) => {
    // Primary sort: show_date ascending
    const dateA = new Date(a.show_date).getTime();
    const dateB = new Date(b.show_date).getTime();
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // Secondary sort: within same date, canonical shows come first
    const aHasCanonid = a.show_canonid !== null;
    const bHasCanonid = b.show_canonid !== null;
    
    if (aHasCanonid && bHasCanonid) {
      // Both have canonid: sort by canonid ascending
      return a.show_canonid! - b.show_canonid!;
    } else if (aHasCanonid && !bHasCanonid) {
      // a has canonid, b doesn't: a comes first
      return -1;
    } else if (!aHasCanonid && bHasCanonid) {
      // a doesn't have canonid, b does: b comes first
      return 1;
    } else {
      // Neither has canonid: sort by show_group ascending
      return (a.show_group || '').localeCompare(b.show_group || '');
    }
  });
  
  const currentIndex = sortedShows.findIndex(s => s.show_id === show.show_id);
  const currentPosition = currentIndex + 1;
  
  const prevShowId = currentIndex > 0 ? sortedShows[currentIndex - 1].show_id : null;
  const nextShowId = currentIndex < sortedShows.length - 1 ? sortedShows[currentIndex + 1].show_id : null;
  
  return {
    current: currentPosition,
    total: sortedShows.length,
    prevShowId,
    nextShowId
  };
};

export const formatTimeDisplay = (interval: string | null) => {
  if (!interval) return "";
  
  if (interval.includes(":")) {
    return interval;
  }
  
  return interval;
};

export const formatDate = (dateString: string): string => {
  // Parse the date as UTC and adjust for timezone (same as AdminShow)
  const date = new Date(dateString + 'T00:00:00Z');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const year = date.getUTCFullYear().toString().slice(-2);
  return `${month}.${day}.${year}`;
};

export const getHeaderStyle = (saveStatus: 'idle' | 'processing' | 'done' | 'error'): string => {
  switch (saveStatus) {
    case 'idle':
      return 'bg-fourth text-white';
    case 'processing':
      return 'bg-black text-white';
    case 'done':
      return 'bg-green-600 text-white';
    case 'error':
      return 'bg-red-600 text-white';
    default:
      return 'bg-fourth text-white';
  }
};

export const getHeaderText = (saveStatus: 'idle' | 'processing' | 'done' | 'error'): string => {
  switch (saveStatus) {
    case 'idle':
      return 'Setlist Management';
    case 'processing':
      return 'Saving...';
    case 'done':
      return 'Saved!';
    case 'error':
      return 'Error saving';
    default:
      return 'Setlist Management';
  }
};

export const getGuestColor = (entry: SetlistEntry, guestGroups: GuestGroup[]): string => {
  if (!entry.guests || entry.guests.length === 0) return 'transparent';
  
  const sortedGuests = [...entry.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
  const entryGuestKey = sortedGuests
    .map(g => g.guest_canonid)
    .join(',');
  
  const group = guestGroups.find(group => 
    group.guests
      .sort((a, b) => a.guest_canonid - b.guest_canonid)
      .map(g => g.guest_canonid)
      .join(',') === entryGuestKey
  );

  return group?.color || 'transparent';
};