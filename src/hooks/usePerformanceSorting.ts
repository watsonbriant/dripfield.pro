import { useState } from 'react';

interface ChartPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  joty_round?: string | null;
  shows_since_debut_num?: number | null;
  gap?: number | string | null;
}

export const usePerformanceSorting = () => {
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortPerformances = (performances: ChartPerformance[]) => {
    return [...performances].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (sortColumn) {
        case 'show_date':
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
          }
          
          const setA = a.entry_set || '';
          const setB = b.entry_set || '';
          const setComparison = setA.localeCompare(setB);
          if (setComparison !== 0) {
            return sortDirection === 'asc' ? setComparison : -setComparison;
          }
          
          const setnumA = parseInt(a.entry_setnum || '0');
          const setnumB = parseInt(b.entry_setnum || '0');
          return sortDirection === 'asc' ? setnumA - setnumB : setnumB - setnumA;
        case 'show_group':
          valueA = a.show_group || '';
          valueB = b.show_group || '';
          break;
        case 'show_venue_location':
          valueA = a.show_venue_location || '';
          valueB = b.show_venue_location || '';
          break;
        case 'entry_song':
          valueA = a.entry_song || '';
          valueB = b.entry_song || '';
          break;
        case 'entry_set':
          valueA = a.entry_set || '';
          valueB = b.entry_set || '';
          break;
        case 'entry_length':
          const timeToSeconds = (timeStr: string | null) => {
            if (!timeStr) return 0;
            const parts = timeStr.split(':').map(Number);
            if (parts.length === 3) {
              return parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              return parts[0] * 60 + parts[1];
            }
            return 0;
          };
          valueA = timeToSeconds(a.entry_length);
          valueB = timeToSeconds(b.entry_length);
          break;
        case 'gap':
          const gapA = a.gap;
          const gapB = b.gap;
          
          if (gapA === null && gapB === null) return 0;
          if (gapA === null) return sortDirection === 'asc' ? 1 : -1;
          if (gapB === null) return sortDirection === 'asc' ? -1 : 1;
          
          if (gapA === 'Debut' && gapB === 'Debut') return 0;
          if (gapA === 'Debut') return sortDirection === 'asc' ? -1 : 1;
          if (gapB === 'Debut') return sortDirection === 'asc' ? 1 : -1;
          
          valueA = typeof gapA === 'number' ? gapA : 0;
          valueB = typeof gapB === 'number' ? gapB : 0;
          break;
        case 'entry_coachnotes':
          valueA = a.entry_coachnotes || '';
          valueB = b.entry_coachnotes || '';
          break;
        default:
          valueA = (a as any)[sortColumn] || '';
          valueB = (b as any)[sortColumn] || '';
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortPerformances
  };
};
