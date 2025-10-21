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

export const formatDate = (dateString: string) => {
  return dateString
    .split('-')
    .slice(1)
    .concat(dateString.substring(2, 4))
    .join('.');
};
