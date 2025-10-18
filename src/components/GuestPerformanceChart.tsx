import React, { useState } from 'react';
import { GuestPerformanceChartProps, ViewMode, SortDirection, HoveredPerformance, PerformanceWithFormattedDate } from './GuestPerformanceChart/types';
import { getYears, groupPerformancesByYear } from './GuestPerformanceChart/utils';
import { tooltipStyles } from './GuestPerformanceChart/constants';
import TimelineView from './GuestPerformanceChart/TimelineView';
import TableView from './GuestPerformanceChart/TableView';
import Tooltip from './GuestPerformanceChart/Tooltip';
import ViewToggle from './GuestPerformanceChart/ViewToggle';
import FilterIndicators from './GuestPerformanceChart/FilterIndicators';

function GuestPerformanceChart({ performances, selectedGroup, selectedSong, songShowMap }: GuestPerformanceChartProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredPerformance, setHoveredPerformance] = useState<HoveredPerformance | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex justify-between items-center mb-4">
          <div className="text-fifth text-base font-medium">Performances</div>
          
          <FilterIndicators selectedGroup={selectedGroup} selectedSong={selectedSong} />
          
          <ViewToggle 
            viewMode={viewMode} 
            onToggle={() => setViewMode(viewMode === 'timeline' ? 'table' : 'timeline')} 
          />
        </div>
        
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
    </>
  );
}

export default GuestPerformanceChart;