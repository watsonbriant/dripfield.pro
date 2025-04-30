import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

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

  return (
    <>
      <style>{tooltipStyles}</style>
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white/90">Performances</h2>
          {(selectedGroup || selectedSong) && (
            <div className="text-xs text-[#fce7ca]/80 items-end tooltip-bubble">
              {selectedSong && (
                <span className="font-semibold text-[#fe6b01]">{selectedSong}</span>
              )}
              {selectedGroup && selectedSong && (
                <span>, </span>
              )}
              {selectedGroup && (
                <span className="font-semibold text-white border border-[#fce7ca]/30 bg-[#594e5f] px-1 py-0.5 rounded">
                  {selectedGroup}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="px-0">
          <div className="overflow-x-auto">
            <div className="flex flex-row min-w-max">
              {years.map((year, index) => (
                <div 
                  key={year} 
                  className={`w-16 px-1 ${
                    index !== years.length - 1 ? 'border-r border-white/10' : ''
                  }`}
                >
                  <div className="text-[#fce7ca]/90 font-semibold mb-2 text-center">
                    {year}
                  </div>
                  <div className="space-y-1">
                    {performancesByYear[year]?.sort((a, b) => {
                      return a.formattedDate.localeCompare(b.formattedDate);
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
                            backgroundColor: isHighlighted ? '#594e5f' : 'transparent',
                            transition: 'background-color 0.2s ease',
                            opacity: (selectedGroup && !isHighlighted) ? 0.3 : 1,
                            color: shouldHighlightForSong(perf.show_id) ? '#fe6b01' : 'white'
                          }}
                          className={`w-full text-xs hover:underline transition-colors text-center block px-1 font-semibold rounded ${
                            isHighlighted ? 'border border-[#fce7ca]/30' : ''
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

        {/* Tooltip */}
        {hoveredPerformance && (
          <div 
            className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble"
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