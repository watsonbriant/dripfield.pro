// Utility functions for tour-related operations

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

export const getGapColor = (value: string | null): string => {
  if (!value || value === '-') return 'transparent';

  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return 'transparent';

  const cappedValue = Math.min(numericValue, 100);

  const colorStops = [
    { percent: 0, color: { r: 13, g: 71, b: 161 } },
    { percent: 12, color: { r: 46, g: 125, b: 50 } },
    { percent: 24, color: { r: 179, g: 135, b: 0 } },
    { percent: 50, color: { r: 230, g: 81, b: 0 } },
    { percent: 100, color: { r: 156, g: 12, b: 12 } }
  ];

  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (cappedValue >= colorStops[i].percent && cappedValue <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (cappedValue - lowerStop.percent) / range : 0;

  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

  return `rgb(${r}, ${g}, ${b})`;
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

export const timeToSeconds = (timeStr: string | null): number => {
  if (!timeStr) return -1;
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};
