import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { ArrowUp, ArrowDown, ArrowUpDown, MoveRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import JOTYBadge from './JOTYBadge';

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
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string; // Added for venue navigation
  venue_id?: string; // Added for venue ID
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  joty_round?: string | null; 
}

interface PerformanceChartProps {
  performances: ChartPerformance[];
  selectedGroup?: string | null;
}

const placementColors: Record<string, string> = {
  'Set 1 Opener': '#006400',
  'Set 1 Closer': '#995905',
  'Set 2 Opener': '#019B7A',
  'Set 3 Opener': '#019B7A',
  'Set 4 Opener': '#019B7A',
  'Set 5 Opener': '#019B7A',
  'Set 2 Closer': '#E17401',
  'Set 3 Closer': '#E17401',
  'Set 4 Closer': '#E17401',
  'Set 5 Closer': '#E17401',
  'Encore 1': '#7C2128',
  'Encore 2': '#CE1126',
  'Encore 3': '#AF1E2D'
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({ performances, selectedGroup }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<{
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [showOnlyAttended, setShowOnlyAttended] = useState(false);
  const [attendedShowIds, setAttendedShowIds] = useState<Set<string>>(new Set());
  const [loadingAttended, setLoadingAttended] = useState(false);
  
  const years = Array.from(
    { length: 2026 - 2012 + 1 },
    (_, i) => 2012 + i
  );

  // Fetch attended shows when user is logged in
  useEffect(() => {
    async function fetchAttendedShows() {
      if (!user) {
        setAttendedShowIds(new Set());
        return;
      }

      setLoadingAttended(true);
      try {
        const { data, error } = await supabase
          .from('user_attended_shows')
          .select('show_id')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const showIds = new Set(data.map(record => record.show_id));
          setAttendedShowIds(showIds);
        }
      } catch (error) {
        console.error('Error fetching attended shows:', error);
      } finally {
        setLoadingAttended(false);
      }
    }

    fetchAttendedShows();
  }, [user]);

  // Filter performances based on attended shows
  const filteredPerformances = showOnlyAttended && user
    ? performances.filter(perf => attendedShowIds.has(perf.show_id))
    : performances;

  const performancesByYear = filteredPerformances.reduce((acc, perf) => {
    if (!perf.show_date) return acc;
    
    const [year, month, day] = perf.show_date.split('-');
    
    if (!acc[parseInt(year)]) {
      acc[parseInt(year)] = [];
    }

    // Format as MM.DD
    const formattedDate = `${month}.${day}`;

    acc[parseInt(year)].push({
      formattedDate,
      show_id: perf.show_id,
      entry_placement: perf.entry_placement,
      fullData: perf
    });
    return acc;
  }, {} as Record<number, Array<{
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  }>>);

  // Helper function to determine if a performance should be highlighted
  const shouldHighlight = (performance: ChartPerformance) => {
    if (!selectedGroup) return false;
    return performance.show_group === selectedGroup;
  };

  // Helper function to navigate to venue pages
  const navigateToVenue = (perf: ChartPerformance) => {
    if (perf.venue_id) {
      navigate(`/venue/${perf.venue_id}`);
    } else if (perf.show_subvenue_venue) {
      // If we don't have venue_id but have the venue name, use that
      navigate(`/venue/${encodeURIComponent(perf.show_subvenue_venue)}`);
    } else {
      // If we don't have either, we can use the venue location and subvenue
      // to help construct a search that might match the venue
      const venueSearchTerm = perf.show_subvenue || perf.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  const formatLength = (length: string | null): string => {
    if (!length) return '';
    const parts = length.split(':').map(part => parseInt(part));
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      if (hours === 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return length;
  };

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
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />
    );
  };

  const renderTimelineView = () => (
    <div className="px-0">
      <div className="overflow-x-auto flex justify-center">
        <div className="flex flex-row min-w-max mx-auto">
          {years.map((year, index) => (
            <div 
              key={year} 
              className={`w-16 px-1 ${
                index !== years.length - 1 ? 'border-r border-secondary' : ''
              }`}
            >
              <div className="text-fifth text-sm font-medium mb-2 text-center bg-secondary/50 rounded-lg">
                {year}
              </div>
              <div className="space-y-1">
                {performancesByYear[year]?.sort((a, b) => {
                  // First sort by date
                  const dateComparison = a.formattedDate.localeCompare(b.formattedDate);
                  if (dateComparison !== 0) return dateComparison;
                  
                  // Then by entry_set
                  const setA = a.fullData.entry_set || '';
                  const setB = b.fullData.entry_set || '';
                  if (setA !== setB) return setA.localeCompare(setB);
                  
                  // Finally by entry_setnum
                  return (parseInt(a.fullData.entry_setnum) || 0) - (parseInt(b.fullData.entry_setnum) || 0);
                }).map((perf, index) => {
                  const isHighlighted = shouldHighlight(perf.fullData);
                  
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
                        backgroundColor: placementColors[perf.entry_placement] || 'transparent'
                      }}
                      className={`w-full text-xs ${placementColors[perf.entry_placement] ? 'text-primary' : 'text-fifth'} hover:underline transition-colors text-center block px-0.5 font-medium rounded ${
                        isHighlighted ? '' : ''
                      } ${
                        selectedGroup && !isHighlighted ? 'opacity-10' : 'opacity-100'
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
    // Apply default sorting if no column is selected
    let sortedPerformances = [...filteredPerformances];
    
    // Sort by the selected column
    sortedPerformances.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Extract the values based on the sort column
      switch (sortColumn) {
        case 'show_date':
          // First compare by date
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
          }
          
          // If dates are equal, compare by entry_set
          const setA = a.entry_set || '';
          const setB = b.entry_set || '';
          const setComparison = setA.localeCompare(setB);
          if (setComparison !== 0) {
            return sortDirection === 'asc' ? setComparison : -setComparison;
          }
          
          // If sets are equal too, compare by entry_setnum
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
        case 'entry_length':
          // Convert time strings to seconds for comparison
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
        case 'entry_coachnotes':
          valueA = a.entry_coachnotes || '';
          valueB = b.entry_coachnotes || '';
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
            <tr className="bg-canvas border-y border-secondary">
              <th 
                className="pl-4 pr-5 py-2 text-center text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_date')}
              >
                <div className="flex justify-center gap-1">
                  Show
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_group')}
              >
                <div className="flex items-center gap-1">
                  Group
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('show_venue_location')}
              >
                <div className="flex items-center gap-1">
                  Location
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('entry_song')}
              >
                <div className="flex items-center gap-1">
                  Song
                </div>
              </th>
              <th className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap">
                JOTY
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('entry_length')}
              >
                <div className="flex items-center gap-1">
                  Length
                </div>
              </th>
              <th 
                className="px-4 py-2 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                onClick={() => handleSort('entry_coachnotes')}
              >
                <div className="flex items-center gap-1">
                  Coach's Notes
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {sortedPerformances.map((perf, index) => {
              const isHighlighted = shouldHighlight(perf);
              
              return (
                <tr 
                  key={`${perf.show_id}-${index}`}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs ${
                    isHighlighted ? 'border border-secondary bg-tertiary/40' : ''
                  } ${
                    selectedGroup && !isHighlighted ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <td 
                    className="pl-4 pr-5 py-1 text-fifth whitespace-nowrap"
                    style={{
                      boxShadow: placementColors[perf.entry_placement] 
                        ? `inset -4px 0 0 ${placementColors[perf.entry_placement]}` 
                        : 'none'
                    }}
                  >
                    <span className="font-medium">
                      <button
                        onClick={() => navigate(`/setlist/${perf.show_id}`)}
                        className="hover:underline transition-colors table-link"
                      >
                        {formatInTimeZone(
                          new Date(perf.show_date),
                          'UTC',
                          'MM.dd.yy'
                        )}
                      </button>
                    </span>
                  </td>
                  <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">{perf.show_group}</td>
                  <td 
                    className="px-4 py-1 text-fifth whitespace-nowrap font-light"
                    onMouseEnter={(e) => {
                      if (perf.show_subvenue) {
                        setHoveredPerformance({
                          formattedDate: '',
                          show_id: perf.show_id,
                          entry_placement: '',
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
                      className="hover:underline transition-colors"
                    >
                      {perf.show_venue_location}
                    </button>
                    {hoveredPerformance?.show_id === perf.show_id && (
                    <div 
                      className="fixed bg-tertiary text-fifth px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-secondary"
                      style={{
                          left: `${mousePosition.x + 10}px`,
                          top: `${mousePosition.y - 10}px`,
                          maxWidth: '250px',
                          wordWrap: 'break-word',
                          whiteSpace: 'normal'
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: perf.show_subvenue || '' }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-1 text-fifth">
                    {(perf.entry_song && perf.entry_song !== '>') ? (
                      <span className="font-medium">
                        <span className="mr-2">{perf.entry_song}</span>
                        {perf.entry_short && <span className="text-red-600 mr-2">[{perf.entry_short}]</span>}
                        {perf.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/setlist/${perf.show_id}`)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        &gt;
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-1 text-fifth font-light whitespace-nowrap text-center">
                    {perf.joty_round && (
                      <JOTYBadge 
                        round={perf.joty_round} 
                        compact={true}
                        onClick={() => {
                          // Extract year from the show date
                          const year = new Date(perf.show_date).getFullYear();
                          navigate(`/joty/${year}`);
                        }}
                      />
                    )}
                  </td>
                  <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">
                    {perf.entry_length ? formatLength(perf.entry_length) : ''}
                  </td>
                  <td className="px-4 py-1 text-fifth font-light">
                    {perf.entry_coachnotes ? (
                      <div dangerouslySetInnerHTML={{ __html: perf.entry_coachnotes }} />
                    ) : ''}
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
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="text-fifth text-base font-medium">Performances</div>
            
            {/* Add My Shows pill */}
            {user && (
              <button
                onClick={() => setShowOnlyAttended(!showOnlyAttended)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border border-secondary text-sm font-medium transition-colors ${
                  showOnlyAttended 
                    ? 'bg-canvas text-fifth hover:bg-secondary/50' 
                    : 'bg-canvas text-fifth hover:bg-secondary/50'
                } ${loadingAttended ? 'opacity-50 cursor-wait' : ''}`}
                disabled={loadingAttended}
              >
                <div className="relative w-4 h-4">
                  <input
                    type="checkbox"
                    checked={showOnlyAttended}
                    onChange={() => {}}
                    className="sr-only"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={`w-4 h-4 rounded border border-secondary transition-all duration-200 flex items-center justify-center ${
                    showOnlyAttended ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {showOnlyAttended ? (
                      // Checkmark when active
                      <svg 
                        className="w-3 h-3 text-fifth" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      // X when inactive
                      <svg 
                        className="w-3 h-3 text-fifth" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span>My Shows</span>
              </button>
            )}
          </div>
          
          {/* Add selectedGroup indicator if present */}
          {selectedGroup && (
            <div className="text-xs text-fifth items-end tooltip-bubble">
              <span className="font-medium text-fifth border border-secondary bg-tertiary px-1 py-0.5 rounded">
                {selectedGroup}
              </span>
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
                className={`lucide lucide-columns-3 ${viewMode === 'timeline' ? 'text-fifth' : 'text-secondary'}`}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
              
              <button
                role="switch"
                aria-checked={viewMode === 'table'}
                onClick={() => setViewMode(viewMode === 'timeline' ? 'table' : 'timeline')}
                className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary bg-canvas border border-secondary"
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-tertiary transition-transform duration-200 ${
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
                className={`lucide lucide-rows-3 ${viewMode === 'table' ? 'text-fifth' : 'text-secondary'}`}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
              </svg>
            </div>
          </div>
        </div>
        
        {viewMode === 'timeline' ? renderTimelineView() : renderTableView()}

        {/* Tooltip (only shown in timeline view) */}
        {viewMode === 'timeline' && hoveredPerformance && (
          <div 
            className="fixed bg-tertiary text-fifth px-3 py-1.5 rounded shadow-lg z-[9999] font-light text-xs tooltip-bubble border border-secondary"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              maxWidth: '250px',
              wordWrap: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            <div>
              {/* Date and short */}
              <div className="hang font-medium">
                {formatInTimeZone(
                  new Date(hoveredPerformance.fullData.show_date),
                  'UTC',
                  'MM.dd.yy'
                )}
                {hoveredPerformance.fullData.entry_short && (
                  <span className="text-red-700 ml-1">&nbsp;&nbsp;[{hoveredPerformance.fullData.entry_short}]</span>
                )}
              </div>
              {/* Group and tour */}
              <div className="hang">
                <span className='font-medium'>{hoveredPerformance.fullData.show_group}</span>
                {hoveredPerformance.fullData.show_tour && ` (${hoveredPerformance.fullData.show_tour})`}
              </div>
              {/* Venue */}
              <div className="hang">
                {hoveredPerformance.fullData.show_subvenue} 
                {hoveredPerformance.fullData.show_venue_location && ` (${hoveredPerformance.fullData.show_venue_location})`}
              </div>
              {/* Placement and length */}
              <div className="hang">
                {hoveredPerformance.fullData.entry_placement}
                {hoveredPerformance.fullData.entry_length && ` (${formatLength(hoveredPerformance.fullData.entry_length)})`}
              </div>
              {/* Coach notes */}
              {hoveredPerformance.fullData.entry_coachnotes && (
                <div 
                  className="hang italic"
                  dangerouslySetInnerHTML={{ __html: hoveredPerformance.fullData.entry_coachnotes }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PerformanceChart;