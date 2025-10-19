import { supabase } from '../lib/supabase';

interface SongData {
  song: string;
  song_id: string;
  song_category: string | null;
  song_originalartist: string | null;
  song_categoryorder: number | null;
  song_coachnotes: string | null;
}

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

export const transformSongForUpdate = (editedSong: SongData) => {
  return {
    ...editedSong,
    song_category: editedSong.song_category === '' ? null : editedSong.song_category,
    song_originalartist: editedSong.song_originalartist === '' ? null : editedSong.song_originalartist,
    song_coachnotes: editedSong.song_coachnotes === '' ? null : editedSong.song_coachnotes
  };
};

export const updateSong = async (songToUpdate: SongData) => {
  const { error } = await supabase.rpc('update_song', {
    song_id_param: songToUpdate.song_id,
    song_param: songToUpdate.song,
    song_category_param: songToUpdate.song_category,
    song_originalartist_param: songToUpdate.song_originalartist,
    song_categoryorder_param: songToUpdate.song_categoryorder,
    song_coachnotes_param: songToUpdate.song_coachnotes
  });

  if (error) {
    console.error('Error updating song:', error);
    throw error;
  }

  return songToUpdate;
};