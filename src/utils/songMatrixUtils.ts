import { MatrixSortMode } from '../components/TourSongsCombined';

export const cleanSongName = (songName: string): string => {
  return songName
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/∆/g, 'a');
};

export const getColumnBackgroundColor = (placement: string | null): string => {
  if (!placement) return '';
  
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
  
  // For Main Set entries, use the specified color from the attachment (dark navy)
  if (placement.startsWith('Main Set')) {
    return '#000000'; // Dark navy color from the attachment
  }
  
  return colorMap[placement] || '#1C4482'; // Default to navy if no specific color
};

export const getSortedSongs = (
  songs: string[],
  data: Record<string, any[]>,
  metadata: Record<string, any>,
  mode: MatrixSortMode,
  chronologicalOrder?: string[]
): string[] => {
  switch (mode) {
    case 'alphabetical':
      // Sort alphabetically (already done when songs were extracted)
      return [...songs].sort((a, b) => a.localeCompare(b));
    
    case 'chronological':
      // If we have a chronological order from initial processing, use it
      if (chronologicalOrder && chronologicalOrder.length > 0) {
        return chronologicalOrder;
      }
      // Otherwise fallback to sorting by first appearance in the tour
      return [...songs].sort((a, b) => {
        return metadata[a].firstPlayedShowIndex - metadata[b].firstPlayedShowIndex;
      });
    
    case 'playcount':
      // Sort by total count (descending)
      return [...songs].sort((a, b) => {
        // First by total plays (descending)
        const countDiff = metadata[b].totalCount - metadata[a].totalCount;
        if (countDiff !== 0) return countDiff;
        
        // If same count, sort by which song reached max count earlier
        const maxPlayDiff = metadata[a].lastMaxPlayedShowIndex - metadata[b].lastMaxPlayedShowIndex;
        if (maxPlayDiff !== 0) return maxPlayDiff;
        
        // If same max play show, sort by category canonid
        const categoryDiff = metadata[a].categoryCanonId - metadata[b].categoryCanonId;
        if (categoryDiff !== 0) return categoryDiff;
        
        // Finally, alphabetically
        return a.localeCompare(b);
      });
    
    default:
      return songs;
  }
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

export const placementColors: Record<string, string> = {
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
