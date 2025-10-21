import React from 'react';
import { useNavigate } from 'react-router-dom';
import { placementColors, years } from '../utils/performanceUtils';

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

interface PerformanceTimelineViewProps {
  performancesByYear: Record<number, Array<{
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  }>>;
  selectedGroup?: string | null;
  hoveredPerformance: {
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null;
  setHoveredPerformance: (perf: any) => void;
  setMousePosition: (pos: { x: number; y: number }) => void;
}

const PerformanceTimelineView: React.FC<PerformanceTimelineViewProps> = ({
  performancesByYear,
  selectedGroup,
  hoveredPerformance,
  setHoveredPerformance,
  setMousePosition
}) => {
  const navigate = useNavigate();

  const shouldHighlight = (performance: ChartPerformance) => {
    if (!selectedGroup) return false;
    return performance.show_group === selectedGroup;
  };

  return (
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
                  const dateComparison = a.formattedDate.localeCompare(b.formattedDate);
                  if (dateComparison !== 0) return dateComparison;
                  
                  const setA = a.fullData.entry_set || '';
                  const setB = b.fullData.entry_set || '';
                  if (setA !== setB) return setA.localeCompare(setB);
                  
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
};

export default PerformanceTimelineView;
