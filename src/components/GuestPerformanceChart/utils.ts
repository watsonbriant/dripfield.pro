import { formatInTimeZone } from 'date-fns-tz';
import { ChartPerformance, PerformanceWithFormattedDate } from './types';

// Text replacement function from Tours component
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

export const shouldHighlightForSong = (showId: string, selectedSong: string | null, songShowMap: { [songName: string]: string[] }) => {
  if (!selectedSong || !songShowMap[selectedSong]) return false;
  return songShowMap[selectedSong].includes(showId);
};

export const shouldHighlight = (performance: ChartPerformance, selectedGroup: string | null) => {
  if (!selectedGroup) return false;
  return performance.show_group === selectedGroup;
};

export const getYears = () => {
  return Array.from(
    { length: 2026 - 2012 + 1 },
    (_, i) => 2012 + i
  );
};

export const formatPerformanceDate = (showDate: string): string => {
  const [year, month, day] = showDate.split('-');
  return `${month}.${day}`;
};

export const groupPerformancesByYear = (performances: ChartPerformance[]): Record<number, PerformanceWithFormattedDate[]> => {
  return performances.reduce((acc, perf) => {
    if (!perf.show_date) return acc;
    
    const [year] = perf.show_date.split('-');
    const yearNum = parseInt(year);
    
    if (!acc[yearNum]) {
      acc[yearNum] = [];
    }

    const formattedDate = formatPerformanceDate(perf.show_date);
    const existingShowIndex = acc[yearNum].findIndex(existing => existing.show_id === perf.show_id);
    
    if (existingShowIndex === -1) {
      acc[yearNum].push({
        formattedDate,
        show_id: perf.show_id,
        fullData: perf
      });
    }
    
    return acc;
  }, {} as Record<number, PerformanceWithFormattedDate[]>);
};

export const formatDateForDisplay = (dateString: string): string => {
  return formatInTimeZone(new Date(dateString), 'UTC', 'MM.dd.yy');
};
