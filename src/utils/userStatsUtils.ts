import { StatData } from '../types/userStats';

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

export const formatTimeInterval = (interval: string) => {
  const parts = interval.split(':');
  if (parts.length === 3) {
    // Convert from HH:MM:SS format
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  return interval;
};

export const getStatBgColor = (type: string): string => {
  switch(type) {
    case 'topSongs':
      return 'bg-tertiary';
    case 'longestPerformances':
      return 'bg-tertiary';
    case 'notSeenSongs':
      return 'bg-[#CE1126]';
    case 'showOpeners':
      return 'bg-[#047857]';
    case 'setOpeners':
      return 'bg-[#10b981]';
    case 'setClosers':
      return 'bg-[#3b82f6]';
    case 'encoreSongs':
      return 'bg-[#be123c]';
    default:
      return 'bg-tertiary';
  }
};

export const getLoadingMessage = (isOwnProfile: boolean, username?: string | null) => {
  if (isOwnProfile) {
    return "Loading your stats...";
  } else {
    return `Loading ${username ? username + "'s" : "their"} stats...`;
  }
};

export const copyToClipboard = (
  data: any[], 
  songNameKey: string, 
  countKey: string, 
  showLength: boolean = false, 
  title: string = '', 
  type: string = ''
) => {
  const dataText = data
    .map(item => {
      const value = showLength ? formatTimeInterval(item.length) : item[countKey];
      
      // Special handling for longest performances
      if (type === 'longestPerformances') {
        return `${value} - ${item[songNameKey]} [${item.show_date} - ${item.venue_location || 'Unknown Venue'}]`;
      }
      
      return `${value} - ${item[songNameKey]}`;
    })
    .join('\n');
  
  // Include the title at the top of the copied text
  const text = title ? `${title}\n\n${dataText}` : dataText;
  
  navigator.clipboard.writeText(text).then(() => {
    // Optional: You could add a toast notification here
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

export const createStatColumns = (stats: StatData[], numColumns: number = 3) => {
  if (numColumns === 1) {
    // For single column, return all stats in one column
    return [stats];
  }
  
  const columns: StatData[][] = Array(numColumns).fill([]).map(() => []);
  const itemsPerColumn = Math.ceil(stats.length / numColumns);
  
  // Distribute items across columns
  stats.forEach((stat, index) => {
    const columnIndex = Math.floor(index / itemsPerColumn);
    columns[columnIndex] = [...columns[columnIndex], stat];
  });
  
  return columns;
};

export const skipShorts = ["fake", "tease", "reprise", "aborted"];
