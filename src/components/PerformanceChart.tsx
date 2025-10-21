import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ performances, selectedGroup }) => {
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<{
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [showOnlyAttended, setShowOnlyAttended] = useState(false);

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
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="text-fifth text-base font-medium">Performances</div>
            
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
              <span className="font-medium text-fifth border border-secondary bg-tertiary px-1 py-0.5 rounded">
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
            getSortIcon={getSortIcon}
            selectedGroup={selectedGroup}
            hoveredPerformance={hoveredPerformance}
            mousePosition={mousePosition}
            setHoveredPerformance={setHoveredPerformance}
            setMousePosition={setMousePosition}
          />
        )}

        <PerformanceTooltip
          hoveredPerformance={hoveredPerformance}
          mousePosition={mousePosition}
          viewMode={viewMode}
        />
      </div>
    </>
  );
};

export default PerformanceChart;