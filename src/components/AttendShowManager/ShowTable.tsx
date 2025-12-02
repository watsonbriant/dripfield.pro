import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AttendShow } from '../../hooks/useAttendShowData';
import { SortColumn, SortDirection } from '../../hooks/useTableSort';
import { formatDate } from '../../utils/dateUtils';

interface ShowTableProps {
  shows: AttendShow[];
  loading: boolean;
  searchQuery: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  getSortIcon: (column: SortColumn) => React.ReactNode;
  onAttendanceToggle: (show: AttendShow) => void;
}

export const ShowTable: React.FC<ShowTableProps> = ({
  shows,
  loading,
  searchQuery,
  onSort,
  onAttendanceToggle
}) => {

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse delay-300"></div>
        </div>
        <p className="text-fifth mt-4">Loading shows...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-white/10">
            <th className="px-2 py-2 text-center justify-center text-xs font-semibold text-fifth">
              <Check size={16} className="text-fifth mx-auto" strokeWidth={2.5} />
            </th>
            <th 
              className="px-2 py-1 text-center text-sm font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
              onClick={() => onSort('show_date')}
            >
              Date
            </th>
            <th 
              className="px-2 py-1 text-left text-sm font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
              onClick={() => onSort('show_group')}
            >
              Group
            </th>
            <th 
              className="px-2 py-1 text-left text-sm font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
              onClick={() => onSort('show_subvenue')}
            >
              Venue
            </th>
            <th 
              className="px-2 py-1 text-left text-sm font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
              onClick={() => onSort('show_venue_location')}
            >
              Location
            </th>
            <th 
              className="px-2 py-1 text-left text-sm font-semibold text-fifth whitespace-nowrap"
            >
              Detail
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {shows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-4 text-center text-fifth">
                {searchQuery ? 'No shows matching your search' : 'No shows found for this year'}
              </td>
            </tr>
          ) : (
            shows.map((show, index) => (
              <tr
                key={show.show_id}
                className={`${
                  index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
              >
                <td className="text-center">
                  <button
                    onClick={() => onAttendanceToggle(show)}
                    className={`p-0.5 rounded-md transition-all ${
                      show.attended
                        ? 'bg-green-600 hover:bg-red-600 text-white'
                        : 'text-white border-fourth/80 hover:bg-green-600 hover:text-white'
                    }`}
                    title={show.attended ? "Remove from attended shows" : "Mark as attended"}
                  >
                    <Check size={12} className={show.attended ? "text-white" : "text-fifth/60"} />
                  </button>
                </td>
                <td className="px-2 text-center text-fifth whitespace-nowrap">
                  <Link
                    to={`/setlist/${show.show_id}`}
                    className="font-medium hover:underline transition-colors table-link"
                  >
                    {formatDate(show.show_date)}
                  </Link>
                </td>
                <td className="px-2 font-light text-fifth whitespace-nowrap">
                  {show.show_group}
                </td>
                <td className="px-2 font-light text-fifth whitespace-nowrap">
                  <Link
                    to={`/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
                    className="hover:underline transition-colors"
                  >
                    {show.show_subvenue}
                  </Link>
                </td>
                <td className="px-2 font-light text-fifth whitespace-nowrap">
                  {show.show_venue_location}
                </td>
                <td className="px-2 font-light text-fifth whitespace-nowrap">
                  {show.show_detail || (show.show_alert && 
                    <span className="text-red-600 font-medium">
                      [{show.show_alert}]
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
