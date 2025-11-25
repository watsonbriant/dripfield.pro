import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartPerformance, PerformanceWithFormattedDate } from './types';
import { shouldHighlight, shouldHighlightForSong } from './utils';

interface TimelineViewProps {
  performancesByYear: Record<number, PerformanceWithFormattedDate[]>;
  years: number[];
  selectedGroup: string | null;
  selectedSong: string | null;
  songShowMap: { [songName: string]: string[] };
  onHover: (perf: PerformanceWithFormattedDate, e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export default function TimelineView({
  performancesByYear,
  years,
  selectedGroup,
  selectedSong,
  songShowMap,
  onHover,
  onMouseMove,
  onMouseLeave
}: TimelineViewProps) {
  const navigate = useNavigate();

  return (
    <div className="p-1">
      <div className="overflow-x-auto flex justify-start">
        <div className="flex flex-row min-w-max">
          {years.map((year, index) => (
            <div 
              key={year} 
              className={`w-14 px-1 ${
                index !== years.length - 1 ? 'border-r border-fourth/30' : ''
              }`}
            >
              <div className="text-fifth text-xs font-medium mb-1 text-center bg-secondary/30 rounded">
                {year}
              </div>
              <div className="space-y-[1px]">
                {performancesByYear[year]?.sort((a, b) => {
                  return a.formattedDate.localeCompare(b.formattedDate);
                }).map((perf, index) => {
                  const isHighlighted = shouldHighlight(perf.fullData, selectedGroup);
                  const isHighlightedForSong = shouldHighlightForSong(perf.show_id, selectedSong, songShowMap);
                  
                  return (
                    <button
                      key={`${year}-${perf.formattedDate}-${index}`}
                      onClick={() => navigate(`/setlist/${perf.show_id}`)}
                      onMouseEnter={(e) => onHover(perf, e)}
                      onMouseMove={onMouseMove}
                      onMouseLeave={onMouseLeave}
                      style={{
                        backgroundColor: isHighlightedForSong ? '#8ec1b6' : 'transparent'
                      }}
                      className={`w-full text-[0.625rem] ${isHighlightedForSong ? 'text-fifth' : 'text-fifth'} hover:underline transition-colors text-center block px-0.5 font-medium rounded ${
                        isHighlighted ? '' : ''
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
}
