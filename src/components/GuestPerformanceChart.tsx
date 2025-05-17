import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const tooltipStyles = `
  .hang {
    padding-left: 20px;
    text-indent: -20px;
    word-wrap: break-word;
  }
  
  @media (max-width: 768px) {
    .tooltip-bubble {
      display: none !important;
    }
  }
`;

interface ChartPerformance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_tour: string | null;
  show_subvenue: string;
  show_venue_location: string;
}

interface GuestPerformanceChartProps {
  performances: ChartPerformance[];
  selectedGroup: string | null;
  selectedSong: string | null;
  songShowMap: {
    [songName: string]: string[];
  };
}

function GuestPerformanceChart({ performances, selectedGroup, selectedSong, songShowMap }: GuestPerformanceChartProps) {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<{
    formattedDate: string;
    show_id: string;
    fullData: ChartPerformance;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const shouldHighlightForSong = (showId: string) => {
    if (!selectedSong || !songShowMap[selectedSong]) return false;
    return songShowMap[selectedSong].includes(showId);
  };
  
  // Always display years starting from 2012 like the song performance chart
  const years = Array.from(
    { length: currentYear - 2012 + 1 },
    (_, i) => 2012 + i
  );

  const performancesByYear = performances.reduce((acc, perf) => {
    if (!perf.show_date) return acc;
    
    // Direct string parsing without using Date object to avoid timezone issues
    const [year, month, day] = perf.show_date.split('-');
    const yearNum = parseInt(year);
    
    if (!acc[yearNum]) {
      acc[yearNum] = [];
    }

    // Format as MM.DD - consistent with song performance chart
    const formattedDate = `${month}.${day}`;

    // Check if the show is already in the array for this year
    const existingShowIndex = acc[yearNum].findIndex(existing => existing.show_id === perf.show_id);
    
    if (existingShowIndex === -1) {
      // Add new show
      acc[yearNum].push({
        formattedDate,
        show_id: perf.show_id,
        fullData: perf
      });
    }
    
    return acc;
  }, {} as Record<number, Array<{
    formattedDate: string;
    show_id: string;
    fullData: ChartPerformance;
  }>>);

  // Determine if a performance should be highlighted
  const shouldHighlight = (performance: ChartPerformance) => {
    if (!selectedGroup) return false;
    return performance.show_group === selectedGroup;
  };

  // Handle sorting for table view
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // If clicking the same column, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new column, set it as sort column with ascending direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-black" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-black" />
    );
  };

  // Function to navigate to venue pages
  const navigateToVenue = (perf: ChartPerformance) => {
    // If we have the venue location, use that
    if (perf.show_venue_location) {
      navigate(`/venue/${encodeURIComponent(perf.show_venue_location)}`);
    }
  };

  const renderTimelineView = () => (
    <div className="px-0">
      <div className="overflow-x-auto">
        <div className="flex flex-row min-w-max">
          {years.map((year, index) => (
            <div 
              key={year} 
              className={`w-16 px-1 ${
                index !== years.length - 1 ? 'border-r border-black/10' : ''
              }`}
            >
              <div className="text-black font-semibold mb-2 text-center">
                {year}
              </div>
              <div className="space-y-1">
                {performancesByYear[year]?.sort((a, b) => {
                  return a.formattedDate.localeCompare(b.formattedDate);
                }).map((perf, index) => {
                  const isHighlighted = shouldHighlight(perf.fullData);
                  const isHighlightedForSong = shouldHighlightForSong(perf.show_id);
                  
                  return (
                    <button
                      key={`${year}-${perf.formattedDate}-${index}`}
                      onClick={() => navigate(`/setlist/${perf.show_id}`)}
                      onMouseEnter={(e) => {
                        setHoveredPerformance(perf);
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseMove={(e) => {
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredPerformance(null)}
                      style={{
                        backgroundColor: isHighlightedForSong ? '#f9ae37' : 'transparent'
                      }}
                      className={`w-full text-xs ${isHighlightedForSong ? 'text-black' : 'text-black'} hover:underline transition-colors text-center block px-0.5 font-semibold rounded ${
                        isHighlighted ? 'border border-black' : ''
                      } ${
                        (selectedGroup && !isHighlighted) || (selectedSong && !isHighlightedForSong) ? 'opacity-10' : 'opacity-100'
                      }`}
                    >
                      {perf.formattedDate}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTableView = () => {
    // Apply sorting to performances
    let sortedPerformances = [...performances];
    
    // Sort by the selected column
    sortedPerformances.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Extract the values based on the sort column
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
      
      // Handle string comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Handle numeric comparison
      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-canvas border-y border-black/10">
              <th 
                className="px-4 py-2 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('show_date')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_group')}
              >
                <div className="flex items-center gap-1">
                  Group
                  {getSortIcon('show_group')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_tour')}
              >
                <div className="flex items-center gap-1">
                  Tour
                  {getSortIcon('show_tour')}
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_venue_location')}
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
              const isHighlighted = shouldHighlight(perf);
              const isHighlightedForSong = shouldHighlightForSong(perf.show_id);
              
              return (
                <tr 
                  key={`${perf.show_id}-${index}`}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-black/10 transition-colors text-xs ${
                    isHighlighted ? 'border border-[#f9ae37] bg-[#f9ae37]/10' : ''
                  } ${
                    isHighlightedForSong ? 'bg-[#f9ae37]/30' : ''
                  } ${
                    (selectedGroup && !isHighlighted) || (selectedSong && !isHighlightedForSong) ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <td className="px-4 py-1 text-black whitespace-nowrap">
                    <span className="font-semibold">
                      <button
                        onClick={() => navigate(`/setlist/${perf.show_id}`)}
                        className="hover:text-[#a9682e] transition-colors table-link"
                      >
                        {formatInTimeZone(
                          new Date(perf.show_date),
                          'UTC',
                          'MM.dd.yy'
                        )}
                      </button>
                    </span>
                  </td>
                  <td className="px-4 py-1 text-black whitespace-nowrap">{perf.show_group}</td>
                  <td className="px-4 py-1 text-black whitespace-nowrap">{perf.show_tour || '-'}</td>
                  <td 
                    className="px-4 py-1 text-black whitespace-nowrap relative"
                    onMouseEnter={(e) => {
                      if (perf.show_subvenue) {
                        setHoveredPerformance({
                          formattedDate: '',
                          show_id: perf.show_id,
                          fullData: perf
                        });
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseMove={(e) => {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredPerformance(null);
                    }}
                  >
                    <button
                      onClick={() => navigateToVenue(perf)}
                      className="hover:text-[#a9682e] hover:underline transition-colors"
                    >
                      {perf.show_venue_location}
                    </button>
                    {hoveredPerformance?.show_id === perf.show_id && (
                    <div 
                      className="fixed bg-[#f9ae37] text-black px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-black"
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
  };

  return (
    <>
      <style>{tooltipStyles}</style>
      <div className="bg-primary border border-black rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Performances</h2>
          
          {/* Selected filters indicators */}
          {(selectedGroup || selectedSong) && (
            <div className="text-xs text-black items-end tooltip-bubble">
              {selectedSong && (
                <span className="font-semibold text-black border border-black bg-[#f9ae37] px-1 py-0.5 rounded mr-2">
                  {selectedSong}
                </span>
              )}
              {selectedGroup && (
                <span className="font-semibold text-black border border-black bg-[#f9ae37] px-1 py-0.5 rounded">
                  {selectedGroup}
                </span>
              )}
            </div>
          )}
          
          {/* View toggle switch */}
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`lucide lucide-columns-3 ${viewMode === 'timeline' ? 'text-black' : 'text-black/60'}`}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
              
              <button
                role="switch"
                aria-checked={viewMode === 'table'}
                onClick={() => setViewMode(viewMode === 'timeline' ? 'table' : 'timeline')}
                className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#a9682e]/50 bg-canvas border border-black"
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-[#f9ae37] transition-transform duration-200 ${
                    viewMode === 'table' ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
              
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`lucide lucide-rows-3 ${viewMode === 'table' ? 'text-black' : 'text-black/60'}`}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
              </svg>
            </div>
          </div>
        </div>
        
        {viewMode === 'timeline' ? renderTimelineView() : renderTableView()}

        {/* Tooltip */}
        {viewMode === 'timeline' && hoveredPerformance && (
          <div 
            className="fixed bg-[#f9ae37] text-black px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-black"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              maxWidth: '250px',
              wordWrap: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            <div className="space-y-0.5">
              {/* Date */}
              <div className="hang">
                <strong>
                  {formatInTimeZone(
                    new Date(`${hoveredPerformance.fullData.show_date}T12:00:00Z`),
                    'UTC',
                    'MM.dd.yy'
                  )}
                </strong>
              </div>
              {/* Group and tour */}
              <div className="hang">
                <strong>{hoveredPerformance.fullData.show_group}</strong>
                {hoveredPerformance.fullData.show_tour && ` (${hoveredPerformance.fullData.show_tour})`}
              </div>
              {/* Venue */}
              <div className="hang">
                {hoveredPerformance.fullData.show_subvenue} 
                {hoveredPerformance.fullData.show_venue_location && ` (${hoveredPerformance.fullData.show_venue_location})`}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GuestPerformanceChart;