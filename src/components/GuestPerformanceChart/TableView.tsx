import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { ChartPerformance, HoveredPerformance, SortDirection } from './types';
import { shouldHighlight, shouldHighlightForSong, formatDateForDisplay } from './utils';

interface TableViewProps {
  performances: ChartPerformance[];
  selectedGroup: string | null;
  selectedSong: string | null;
  songShowMap: { [songName: string]: string[] };
  sortColumn: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  onHover: (perf: ChartPerformance, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  hoveredPerformance: HoveredPerformance | null;
  mousePosition: { x: number; y: number };
}

export default function TableView({
  performances,
  selectedGroup,
  selectedSong,
  songShowMap,
  sortColumn,
  sortDirection,
  onSort,
  onHover,
  onMouseMove,
  onMouseLeave,
  hoveredPerformance,
  mousePosition
}: TableViewProps) {
  const navigate = useNavigate();

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />
    );
  };

  const navigateToVenue = (perf: ChartPerformance) => {
    if (perf.venue_id) {
      const venueUrl = `/venue/${perf.venue_id}`;
      navigate(venueUrl);
    } else {
      console.warn('No venue_id found for performance:', perf);
    }
  };

  // Apply sorting to performances
  let sortedPerformances = [...performances];
  
  sortedPerformances.sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    switch (sortColumn) {
      case 'show_date':
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      case 'show_group':
        valueA = a.show_group || '';
        valueB = b.show_group || '';
        break;
      case 'show_tour':
        valueA = a.show_tour || '';
        valueB = b.show_tour || '';
        break;
      case 'show_venue_location':
        valueA = a.show_venue_location || '';
        valueB = b.show_venue_location || '';
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-secondary">
            <th 
              className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
              onClick={() => onSort('show_date')}
            >
              <div className="flex items-center gap-1">
                Date
                {getSortIcon('show_date')}
              </div>
            </th>
            <th 
              className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
              onClick={() => onSort('show_group')}
            >
              <div className="flex items-center gap-1">
                Group
                {getSortIcon('show_group')}
              </div>
            </th>
            <th 
              className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
              onClick={() => onSort('show_tour')}
            >
              <div className="flex items-center gap-1">
                Tour
                {getSortIcon('show_tour')}
              </div>
            </th>
            <th 
              className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
              onClick={() => onSort('show_venue_location')}
            >
              <div className="flex items-center gap-1">
                Location
                {getSortIcon('show_venue_location')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {sortedPerformances.map((perf, index) => {
            const isHighlighted = shouldHighlight(perf, selectedGroup);
            const isHighlightedForSong = shouldHighlightForSong(perf.show_id, selectedSong, songShowMap);
            
            return (
              <tr 
                key={`${perf.show_id}-${index}`}
                className={`${
                  index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                } hover:bg-tertiary/40 transition-colors text-xs ${
                  isHighlighted ? 'border border-secondary bg-tertiary/40' : ''
                } ${
                  isHighlightedForSong ? 'bg-tertiary/40' : ''
                } ${
                  (selectedGroup && !isHighlighted) || (selectedSong && !isHighlightedForSong) ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <td className="px-4 py-1 text-fifth whitespace-nowrap">
                  <span className="font-medium">
                    <button
                      onClick={() => navigate(`/setlist/${perf.show_id}`)}
                      className="hover:underline transition-colors table-link"
                    >
                      {formatDateForDisplay(perf.show_date)}
                    </button>
                  </span>
                </td>
                <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">{perf.show_group}</td>
                <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">
                  {perf.show_tour ? (
                    <button
                      onClick={() => {
                        if (perf.tour_id) {
                          navigate(`/tours/${perf.tour_id}`);
                        }
                      }}
                      className="hover:underline transition-colors"
                    >
                      {perf.show_tour}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td 
                  className="px-4 py-1 text-fifth font-light whitespace-nowrap"
                  onMouseEnter={(e) => {
                    if (perf.show_subvenue) {
                      onHover(perf, e);
                    }
                  }}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                >
                  <button
                    onClick={() => navigateToVenue(perf)}
                    className="hover:underline transition-colors"
                  >
                    {perf.show_venue_location}
                  </button>
                  {hoveredPerformance?.show_id === perf.show_id && (
                  <div 
                    className="fixed bg-tertiary font-medium text-fifth px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-secondary"
                    style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`,
                        maxWidth: '250px',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}
                    >
                      <div>{perf.show_subvenue || ''}</div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
