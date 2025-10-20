import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Show } from '../hooks/useShowsData';

export type SortColumn = 'show_date' | 'show_group' | 'show_subvenue' | 'show_venue_location';
export type SortDirection = 'asc' | 'desc';

export const useTableSort = () => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('show_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Function to handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Function to get sort icon
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  return {
    sortColumn,
    sortDirection,
    handleSort,
    getSortIcon
  };
};

// Function to filter and sort shows for display
export const getFilteredAndSortedShows = (
  shows: Show[],
  searchQuery: string,
  sortColumn: SortColumn,
  sortDirection: SortDirection
) => {
  // Filter shows based on search query
  let filteredShows = shows;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredShows = shows.filter(show => 
      show.show_subvenue.toLowerCase().includes(query) ||
      show.show_venue_location.toLowerCase().includes(query) ||
      show.show_group.toLowerCase().includes(query) ||
      (show.show_detail && show.show_detail.toLowerCase().includes(query))
    );
  }
  
  // Sort shows
  return [...filteredShows].sort((a, b) => {
    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];
    
    // For dates, compare as dates
    if (sortColumn === 'show_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle null values
    if (aValue === null) aValue = '';
    if (bValue === null) bValue = '';

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'desc' ? comparison : -comparison;
  });
};
