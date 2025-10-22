import { SongPick, SetlistEntry, TimeRemainingResult } from './types';

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

export const calculateTimeRemaining = (showTime: string): TimeRemainingResult => {
  const now = new Date();
  const showDateTime = new Date(showTime);
  const oneHourBefore = new Date(showDateTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  
  const isSelectionClosed = now >= oneHourBefore;
  
  // Calculate time remaining
  let timeRemaining = '';
  if (!isSelectionClosed) {
    const timeDiff = oneHourBefore.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      timeRemaining = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = `${minutes}m`;
    }
  }
  
  return { timeRemaining, isSelectionClosed };
};

export const getSetDisplayName = (set: string): string => {
  if (set === 'E1') return 'Encore';
  if (set === 'E2') return '2nd Encore';
  if (set === 'E3') return '3rd Encore';
  return `Set ${set}`;
};

export const getPlacementColor = (placement: string | undefined): string => {
  if (!placement) return 'transparent';
  
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
  
  return colorMap[placement] || '#000000';
};

export const getPlacement = (set: string, songs: SongPick[], currentSong: SongPick): string => {
  // Sort the songs in this set by setnum
  const sortedSongs = [...songs].sort((a, b) => a.setnum - b.setnum);
  
  // If this is an encore set, return the encore designation
  if (set.startsWith('E')) {
    return `Encore ${set.substring(1)}`;
  }
  
  // Find the index of the current song in the sorted array
  const songIndex = sortedSongs.findIndex(s => s.id === currentSong.id);
  
  // If only one song in the set, it's the opener
  if (sortedSongs.length === 1) {
    return `Set ${set} Opener`;
  }
  
  // First song is opener
  if (songIndex === 0) {
    return `Set ${set} Opener`;
  }
  
  // Last song is closer
  if (songIndex === sortedSongs.length - 1) {
    return `Set ${set} Closer`;
  }
  
  // Regular song in the middle gets "Main Set X" designation
  return `Main Set ${set}`;
};

export const getUniqueSets = (songPicks: SongPick[]): string[] => {
  const setsWithPicks = new Set(songPicks.map(pick => pick.set));
  
  // Order them correctly (numeric sets first, then encore sets)
  const numericSets = Array.from(setsWithPicks)
    .filter(set => !set.startsWith('E'))
    .sort((a, b) => parseInt(a) - parseInt(b));
    
  const encoreSets = Array.from(setsWithPicks)
    .filter(set => set.startsWith('E'))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
    
  return [...numericSets, ...encoreSets];
};

export const getAllUniqueSets = (songPicks: SongPick[], actualSetlist: SetlistEntry[]): string[] => {
  // Get sets from user picks
  const userSets = new Set(songPicks.map(pick => pick.set));
  
  // Get sets from actual setlist
  const actualSets = new Set(actualSetlist.map(entry => entry.entry_set));
  
  // Combine both sets
  const allSets = new Set([...userSets, ...actualSets]);
  
  // Order them correctly (numeric sets first, then encore sets)
  const numericSets = Array.from(allSets)
    .filter(set => !set.startsWith('E'))
    .sort((a, b) => parseInt(a) - parseInt(b));
    
  const encoreSets = Array.from(allSets)
    .filter(set => set.startsWith('E'))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
    
  return [...numericSets, ...encoreSets];
};

export const getSongsForSet = (songPicks: SongPick[], set: string): SongPick[] => {
  return songPicks
    .filter(pick => pick.set === set && !pick.isBreak)
    .sort((a, b) => a.setnum - b.setnum); // Ensure they're ordered by setnum
};

export const getSongsForActualSet = (actualSetlist: SetlistEntry[], set: string): SetlistEntry[] => {
  return actualSetlist
    .filter(entry => entry.entry_set === set)
    .sort((a, b) => a.entry_setnum - b.entry_setnum);
};

export const generatePickId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const formatDate = (dateString: string): string => {
  return dateString
    .split('-')
    .slice(1)
    .concat(dateString.substring(2, 4))
    .join('.');
};

export const getResultDescription = (
  result: string | undefined, 
  showcloser_correct?: boolean, 
  showopener_correct?: boolean
): string => {
  if (!result) return '';
  
  let description = '';
  
  switch (result) {
    case 'not_played':
      return '❌&nbsp;&nbsp;Song Not Played';
    
    case 'correct_song':
      description = '✅&nbsp;&nbsp;Song';
      break;
    
    case 'correct_song_set':
      description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Set';
      break;
    
    case 'correct_song_set_setnum':
      description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Set<br>✅&nbsp;&nbsp;Set Position';
      break;
    
    case 'correct_song_openercloserencore':
      description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>❌&nbsp;&nbsp;Set';
      break;
    
    case 'correct_song_set_openercloserencore':
      description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>✅&nbsp;&nbsp;Set';
      break;
    
    case 'correct_song_set_setnum_openercloserencore':
      description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>✅&nbsp;&nbsp;Set<br>✅&nbsp;&nbsp;Set Position';
      break;
    
    default:
      return result;
  }
  
  // Add Show Opener info if the showopener_correct flag is true
  if (showopener_correct === true) {
    description += '<br>✅&nbsp;&nbsp;Show Opener';
  }
  
  // Add Show Closer info if the showcloser_correct flag is true
  if (showcloser_correct === true) {
    description += '<br>✅&nbsp;&nbsp;Show Closer';
  }
  
  return description;
};

export const getOrderedSets = (picks: SongPick[]): string[] => {
  const setsWithPicks = new Set(picks.map(pick => pick.set));
  
  // Order them correctly (numeric sets first, then encore sets)
  const numericSets = Array.from(setsWithPicks)
    .filter(set => !set.startsWith('E'))
    .sort((a, b) => parseInt(a) - parseInt(b));
    
  const encoreSets = Array.from(setsWithPicks)
    .filter(set => set.startsWith('E'))
    .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
    
  return [...numericSets, ...encoreSets];
};
