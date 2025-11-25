import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ArrowUp, ArrowDown, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JOTYBadge from './JOTYBadge';
import { placementColors, formatLength } from '../utils/performanceUtils';

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

interface PerformanceTooltipProps {
  hoveredPerformance: {
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null;
  mousePosition: { x: number; y: number };
  viewMode: 'timeline' | 'table';
}

const PerformanceTooltip: React.FC<PerformanceTooltipProps> = ({ 
  hoveredPerformance, 
  mousePosition, 
  viewMode 
}) => {
  if (!hoveredPerformance) return null;

  return (
    <div 
      className="fixed bg-canvas text-fifth px-1.5 py-1 rounded shadow-lg z-[9999] font-light text-[0.625rem] leading-[0.75rem] tooltip-bubble border border-fourth"
      style={{
        left: `${mousePosition.x + 10}px`,
        top: `${mousePosition.y - 10}px`,
        maxWidth: '250px',
        wordWrap: 'break-word',
        whiteSpace: 'normal'
      }}
    >
      <div>
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
        <div className="hang">
          <span className='font-medium pr-2'>{hoveredPerformance.fullData.show_group}</span>
          {hoveredPerformance.fullData.show_tour && ` (${hoveredPerformance.fullData.show_tour})`}
        </div>
        <div className="hang">
          <span className='pr-1'>{hoveredPerformance.fullData.show_subvenue}</span> 
          {hoveredPerformance.fullData.show_venue_location && ` (${hoveredPerformance.fullData.show_venue_location})`}
        </div>
        <div className="hang">
          <span className='pr-2'>{hoveredPerformance.fullData.entry_placement}</span>
          {hoveredPerformance.fullData.entry_length && ` (${formatLength(hoveredPerformance.fullData.entry_length)})`}
        </div>
        {hoveredPerformance.fullData.entry_coachnotes && (
          <div 
            className="hang italic"
            dangerouslySetInnerHTML={{ __html: hoveredPerformance.fullData.entry_coachnotes }}
          />
        )}
      </div>
    </div>
  );
};

export default PerformanceTooltip;
