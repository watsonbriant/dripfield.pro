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

export const getColumnBackgroundColor = (column: string): string => {
  const colorMap: { [key: string]: string } = {
    'Set_1_Opener': '#047857',
    'Set_1_Closer': '#1e40af',
    'Set_2_Opener': '#10b981',
    'Set_3_Opener': '#10b981',
    'Set_4_Opener': '#10b981',
    'Set_5_Opener': '#10b981',
    'Set_2_Closer': '#3b82f6',
    'Set_3_Closer': '#3b82f6',
    'Set_4_Closer': '#3b82f6',
    'Set_5_Closer': '#3b82f6',
    'Encore_1': '#be123c',
    'Encore_2': '#f43f5e',
    'Encore_3': '#f43f5e'
  };
  return colorMap[column] || '';
};

export const formatColumnHeader = (column: string): string => {
  return column.split('_').map(word => 
    word === 'Op' ? 'Opener' :
    word === 'Cl' ? 'Closer' :
    word
  ).join(' ');
};

export const formatShowDate = (showDate: string): string => {
  return showDate
    .split('-')
    .slice(1)
    .concat(showDate.substring(2, 4))
    .join('.');
};
