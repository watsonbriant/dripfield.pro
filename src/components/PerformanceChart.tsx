import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePerformanceData } from '../hooks/usePerformanceData';
import { usePerformanceSorting } from '../hooks/usePerformanceSorting';
import PerformanceTableView from './PerformanceTableView';
import PerformanceTimelineView from './PerformanceTimelineView';
import PerformanceTooltip from './PerformanceTooltip';

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
  entry_id?: string;
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

interface PerformanceChartProps {
  performances: ChartPerformance[];
  selectedGroup?: string | null;
  onJOTYClick?: (year: number, entryId: string | null) => void;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ performances, selectedGroup, onJOTYClick }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<{
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null>(null);
  
  // Initialize view mode from URL or default to 'timeline'
  const getViewModeFromUrl = (params: URLSearchParams): 'timeline' | 'table' => {
    const viewParam = params.get('view');
    return (viewParam === 'table' || viewParam === 'timeline') ? viewParam : 'timeline';
  };
  
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>(() => getViewModeFromUrl(searchParams));
  const [showOnlyAttended, setShowOnlyAttended] = useState(false);

  // Sync view mode with URL when URL changes (but not when we update it ourselves)
  useEffect(() => {
    const urlViewMode = getViewModeFromUrl(searchParams);
    if (urlViewMode !== viewMode) {
      setViewMode(urlViewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when view mode changes
  const handleViewModeChange = (newViewMode: 'timeline' | 'table') => {
    setViewMode(newViewMode);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newViewMode === 'timeline') {
      // Remove view param if it's the default
      newSearchParams.delete('view');
    } else {
      newSearchParams.set('view', newViewMode);
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  const { performancesWithGaps, attendedShowIds, loadingAttended } = usePerformanceData(performances);
  const { sortColumn, sortDirection, handleSort, sortPerformances } = usePerformanceSorting();

  // Filter performances based on attended shows
  const filteredPerformances = showOnlyAttended && user
    ? performancesWithGaps.filter(perf => attendedShowIds.has(perf.show_id))
    : performancesWithGaps;

  const performancesByYear = filteredPerformances.reduce((acc, perf) => {
    if (!perf.show_date) return acc;
    
    const [year, month, day] = perf.show_date.split('-');
    
    if (!acc[parseInt(year)]) {
      acc[parseInt(year)] = [];
    }

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


  const sortedPerformances = sortPerformances(filteredPerformances);

  return (
    <>
      <style>{tooltipStyles}</style>
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">Performances</h3>
            {user && (
              <button
                onClick={() => setShowOnlyAttended(!showOnlyAttended)}
                className={`flex items-center gap-2 pr-1 pl-0.5 py-0.5 rounded border border-fourth text-[0.625rem] font-medium transition-colors ${
                  showOnlyAttended 
                    ? 'bg-canvas text-fifth hover:bg-primary' 
                    : 'bg-canvas text-fifth hover:bg-primary'
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
                  <div className={`w-4 h-4 rounded border border-fourth transition-all duration-200 flex items-center justify-center ${
                    showOnlyAttended ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {showOnlyAttended ? (
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

          {selectedGroup && (
              <div className="text-xs text-fifth items-end tooltip-bubble">
                <span className="font-medium text-white border border-fourth bg-fourth px-1 rounded text-[0.625rem]">
                  {selectedGroup}
                </span>
              </div>
            )}
          
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
                onClick={() => handleViewModeChange(viewMode === 'timeline' ? 'table' : 'timeline')}
                className="relative inline-flex h-4 w-[47px] items-center rounded-full border border-fourth transition-colors bg-primary"
              >
                <span
                  className={`absolute h-[10px] w-[10px] rounded-lg bg-black transition-transform duration-200 ${
                    viewMode === 'table' ? 'left-[33px]' : 'left-[2px]'
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
        <div>
          {viewMode === 'timeline' ? (
          <PerformanceTimelineView
            performancesByYear={performancesByYear}
            selectedGroup={selectedGroup}
            hoveredPerformance={hoveredPerformance}
            setHoveredPerformance={setHoveredPerformance}
            setMousePosition={setMousePosition}
          />
        ) : (
          <PerformanceTableView
            performances={sortedPerformances}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={handleSort}
            selectedGroup={selectedGroup}
            hoveredPerformance={hoveredPerformance}
            mousePosition={mousePosition}
            setHoveredPerformance={setHoveredPerformance}
            setMousePosition={setMousePosition}
            onJOTYClick={onJOTYClick}
          />
        )}

        <PerformanceTooltip
          hoveredPerformance={hoveredPerformance}
          mousePosition={mousePosition}
          viewMode={viewMode}
        />
        </div>
      </div>
    </>
  );
};

export default PerformanceChart;