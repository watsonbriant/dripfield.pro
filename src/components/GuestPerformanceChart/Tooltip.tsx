import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { ChartPerformance } from './types';

interface TooltipProps {
  hoveredPerformance: {
    formattedDate: string;
    show_id: string;
    fullData: ChartPerformance;
  };
  mousePosition: { x: number; y: number };
}

export default function Tooltip({ hoveredPerformance, mousePosition }: TooltipProps) {
  return (
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
      <div className="space-y-0.5">
        {/* Date */}
        <div className="hang">
          <span className='font-medium'>
            {formatInTimeZone(
              new Date(`${hoveredPerformance.fullData.show_date}T12:00:00Z`),
              'UTC',
              'MM.dd.yy'
            )}
          </span>
        </div>
        {/* Group and tour */}
        <div className="hang font-light">
          <span className='font-medium'>{hoveredPerformance.fullData.show_group}</span>
          {hoveredPerformance.fullData.show_tour && ` (${hoveredPerformance.fullData.show_tour})`}
        </div>
        {/* Venue */}
        <div className="hang font-light">
          {hoveredPerformance.fullData.show_subvenue} 
          {hoveredPerformance.fullData.show_venue_location && ` (${hoveredPerformance.fullData.show_venue_location})`}
        </div>
      </div>
    </div>
  );
}
