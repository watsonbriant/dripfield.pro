import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TableHeader } from './TableHeader';
import { ShowRow } from './ShowRow';

interface Show {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  venue_location: string | null;
  show_venue_location: string;
  show_subvenue_venue: string;
  venue_id?: string;
  attended?: boolean;
  show_wl_link?: string | null;
}

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

interface ShowsTableProps {
  shows: Show[];
  tours: TourCount[];
  attendeeCounts: Record<string, number>;
  showRatings: Record<string, number>;
  showsWithSetlists: Set<string>;
  showsWithReleases: Set<string>;
  currentYear: string;
  selectedGroups: string[];
  onClearFilters: () => void;
  loading: boolean;
}

export function ShowsTable({
  shows,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  currentYear,
  selectedGroups,
  onClearFilters,
  loading
}: ShowsTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rating' ? 'desc' : 'asc');
    }
  };

  const sortData = (data: Show[]) => {
    return [...data].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortColumn) {
        case 'show_date':
          valueA = new Date(a.show_date).getTime();
          valueB = new Date(b.show_date).getTime();
          break;
        case 'rating':
          valueA = showRatings[a.show_id] || 0;
          valueB = showRatings[b.show_id] || 0;
          break;
        case 'show_group':
          valueA = a.show_group || '';
          valueB = b.show_group || '';
          break;
        case 'show_subvenue':
          valueA = a.show_subvenue || '';
          valueB = b.show_subvenue || '';
          break;
        case 'show_venue_location':
          valueA = a.show_venue_location || '';
          valueB = b.show_venue_location || '';
          break;
        case 'show_detail':
          valueA = a.show_detail || '';
          valueB = b.show_detail || '';
          break;
        case 'attendee_count':
          valueA = attendeeCounts[a.show_id] || 0;
          valueB = attendeeCounts[b.show_id] || 0;
          break;
        default:
          valueA = new Date(a.show_date).getTime();
          valueB = new Date(b.show_date).getTime();
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        if (comparison !== 0) {
          return sortDirection === 'asc' ? comparison : -comparison;
        }
      } else {
        if (valueA !== valueB) {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
      }

      if (sortColumn !== 'show_date') {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) {
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
      const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
      if (canonIdA !== canonIdB) {
        return sortDirection === 'asc' ? canonIdA - canonIdB : canonIdB - canonIdA;
      }

      const groupA = a.show_group || '';
      const groupB = b.show_group || '';
      return groupA.localeCompare(groupB);
    });
  };


  if (loading) {
    return (
      <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
          <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
        </div>
        <p className="text-fifth mt-4">Loading shows...</p>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
        <p className="text-fifth">
          {selectedGroups.length === 0 
            ? `No shows found for ${currentYear}` 
            : `No shows match the selected filters. ${" "}
              <button 
                className="text-[#a9682e] underline hover:text-[#7b4e23]"
                onClick={onClearFilters}
              >
                Clear filters
              </button>`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-fourth">
      <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          {currentYear} Shows
        </h2>
        {selectedGroups.length > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 bg-white text-red-500 px-1 border border-fourth hover:bg-red-500 hover:text-white transition-colors text-xs font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="shadow-xl">
        <table className="w-full border-collapse min-w-max">
          <TableHeader 
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <tbody>
            {sortData(shows).map((show, index) => (
              <ShowRow
                key={show.show_id}
                show={show}
                index={index}
                tours={tours}
                attendeeCounts={attendeeCounts}
                showRatings={showRatings}
                showsWithSetlists={showsWithSetlists}
                showsWithReleases={showsWithReleases}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
