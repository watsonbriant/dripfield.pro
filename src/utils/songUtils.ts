import { supabase } from '../lib/supabase';

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

export const groupShowsByYear = (shows: Array<any>) => {
  if (!shows || shows.length === 0) return [];
  
  const yearGroups = [];
  let currentYear = '';
  let currentGroup = [];
  
  shows.forEach((show, index) => {
    const year = new Date(show.show_date).getFullYear().toString();
    
    if (year !== currentYear) {
      if (currentGroup.length > 0) {
        yearGroups.push({
          year: currentYear,
          shows: currentGroup,
          startIndex: index - currentGroup.length,
          endIndex: index - 1
        });
      }
      currentYear = year;
      currentGroup = [show];
    } else {
      currentGroup.push(show);
    }
  });
  
  // Add the last group
  if (currentGroup.length > 0) {
    yearGroups.push({
      year: currentYear,
      shows: currentGroup,
      startIndex: shows.length - currentGroup.length,
      endIndex: shows.length - 1
    });
  }
  
  return yearGroups;
};

// Song update functions for AdminSong component
export const transformSongForUpdate = (song: any) => {
  return {
    ...song,
    song_category: song.song_category === '' ? null : song.song_category,
    song_originalartist: song.song_originalartist === '' ? null : song.song_originalartist,
    song_coachnotes: song.song_coachnotes === '' ? null : song.song_coachnotes
  };
};

export const updateSong = async (songData: any) => {
  const { error } = await supabase.rpc('update_song', {
    song_id_param: songData.song_id,
    song_param: songData.song,
    song_category_param: songData.song_category,
    song_originalartist_param: songData.song_originalartist,
    song_categoryorder_param: songData.song_categoryorder,
    song_coachnotes_param: songData.song_coachnotes
  });
  
  if (error) throw error;
  
  // Return the updated song data
  return songData;
};

// Rarity color function for SongInfo component
export const getRarityColor = (percentage: string | null): string => {
  if (!percentage || percentage === '-') return 'transparent';

  const numericPercentage = parseFloat(percentage.replace('%', ''));

  if (isNaN(numericPercentage)) return 'transparent';

  const cappedPercentage = Math.min(numericPercentage, 100);

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
    if (cappedPercentage >= colorStops[i].percent && cappedPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (cappedPercentage - lowerStop.percent) / range : 0;

  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

  return `rgb(${r}, ${g}, ${b})`;
};