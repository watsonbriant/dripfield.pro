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

export const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'rare':
      return 'text-red-500';
    case 'uncommon':
      return 'text-orange-500';
    case 'common':
      return 'text-green-500';
    case 'frequent':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};