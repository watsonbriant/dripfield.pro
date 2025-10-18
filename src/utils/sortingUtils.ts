import { Show } from '../types/tourTypes';
import { timeToSeconds } from './tourUtils';

export const sortData = (
  data: Show[],
  sortColumn: string,
  sortDirection: 'asc' | 'desc',
  showRatings: Record<string, number>,
  attendeeCounts: Record<string, number>
) => {
  return [...data].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortColumn === 'rating') {
      aValue = showRatings[a.show_id] || 0;
      bValue = showRatings[b.show_id] || 0;
    } else if (sortColumn === 'attendees') {
      aValue = attendeeCounts[a.show_id] || 0;
      bValue = attendeeCounts[b.show_id] || 0;
    } else {
      aValue = a[sortColumn as keyof Show];
      bValue = b[sortColumn as keyof Show];
    }

    if (sortColumn === 'show_rarity') {
      aValue = aValue && aValue !== '-' ? parseFloat(aValue.replace('%', '')) : -1;
      bValue = bValue && bValue !== '-' ? parseFloat(bValue.replace('%', '')) : -1;
    } else if (sortColumn === 'show_gap') {
      aValue = aValue ? parseFloat(aValue) : -1;
      bValue = bValue ? parseFloat(bValue) : -1;
    } else if (sortColumn === 'show_length') {
      aValue = timeToSeconds(aValue as string | null);
      bValue = timeToSeconds(bValue as string | null);
    } else if (sortColumn === 'show_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue === null) aValue = '';
    if (bValue === null) bValue = '';

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};
