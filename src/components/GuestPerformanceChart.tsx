import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GuestPerformanceChartProps, ViewMode, SortDirection, HoveredPerformance, PerformanceWithFormattedDate } from './GuestPerformanceChart/types';
import { getYears, groupPerformancesByYear } from './GuestPerformanceChart/utils';
import { tooltipStyles } from './GuestPerformanceChart/constants';
import TimelineView from './GuestPerformanceChart/TimelineView';
import TableView from './GuestPerformanceChart/TableView';
import Tooltip from './GuestPerformanceChart/Tooltip';
import ViewToggle from './GuestPerformanceChart/ViewToggle';
import FilterIndicators from './GuestPerformanceChart/FilterIndicators';

function GuestPerformanceChart({ performances, selectedGroup, selectedSong, songShowMap }: GuestPerformanceChartProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<HoveredPerformance | null>(null);
  
  // Initialize view mode from URL or default to 'timeline'
  const getViewModeFromUrl = (params: URLSearchParams): ViewMode => {
    const viewParam = params.get('guestView');
    return (viewParam === 'timeline' || viewParam === 'table') ? viewParam : 'timeline';
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => getViewModeFromUrl(searchParams));
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sync view mode with URL when URL changes
  useEffect(() => {
    const urlViewMode = getViewModeFromUrl(searchParams);
    if (urlViewMode !== viewMode) {
      setViewMode(urlViewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when view mode changes
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newViewMode === 'timeline') {
      // Remove guestView param if it's the default
      newSearchParams.delete('guestView');
    } else {
      newSearchParams.set('guestView', newViewMode);
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  const years = getYears();
  const performancesByYear = groupPerformancesByYear(performances);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleHover = (perf: PerformanceWithFormattedDate, e: React.MouseEvent) => {
    setHoveredPerformance(perf);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleTableHover = (perf: any, e: React.MouseEvent) => {
    setHoveredPerformance({
      formattedDate: '',
      show_id: perf.show_id,
      fullData: perf
    });
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredPerformance(null);
  };

  return (
    <>
      <style>{tooltipStyles}</style>
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
          <h3 className="text-sm font-semibold">Performances</h3>
          
          <FilterIndicators selectedGroup={selectedGroup} selectedSong={selectedSong} />
          
          <ViewToggle 
            viewMode={viewMode} 
            onToggle={() => handleViewModeChange(viewMode === 'timeline' ? 'table' : 'timeline')} 
          />
        </div>
        <div>
          {viewMode === 'timeline' ? (
            <TimelineView
              performancesByYear={performancesByYear}
              years={years}
              selectedGroup={selectedGroup}
              selectedSong={selectedSong}
              songShowMap={songShowMap}
              onHover={handleHover}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          ) : (
            <TableView
              performances={performances}
              selectedGroup={selectedGroup}
              selectedSong={selectedSong}
              songShowMap={songShowMap}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onHover={handleTableHover}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              hoveredPerformance={hoveredPerformance}
              mousePosition={mousePosition}
            />
          )}

          {viewMode === 'timeline' && hoveredPerformance && (
            <Tooltip 
              hoveredPerformance={hoveredPerformance} 
              mousePosition={mousePosition} 
            />
          )}
        </div>
      </div>
    </>
  );
}

export default GuestPerformanceChart;