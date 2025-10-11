import React from 'react';
import { Clock, Flame, Space } from 'lucide-react';

// Add the getRarityColor function
const getRarityColor = (percentage: string | null): string => {
  // If percentage is null or not a valid percentage string, return transparent
  if (!percentage || percentage === '-') return 'transparent';
  
  // Convert percentage string to number
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  // Define our 4 color stops with breakpoints at 0, 15, 50, 100
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },     // #9C0C0C (Even Darker Red)
    { percent: 12, color: { r: 230, g: 81, b: 0 } },     // #E65100 (Darker Orange)
    { percent: 24, color: { r: 179, g: 135, b: 0 } },    // #D3A304 (Dark Yellow)
    { percent: 50, color: { r: 46, g: 125, b: 50 } },    // #2E7D32 (Darker Green)
    { percent: 100, color: { r: 13, g: 71, b: 161 } }    // #0D47A1 (Darker Blue)
  ];
  
  // Find the color stops to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
  // Interpolate RGB values
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

const getGapColor = (value: string | null): string => {
  // If value is null or not a valid number string, return transparent
  if (!value || value === '-') return 'transparent';

  // Convert string to number
  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return 'transparent';

  // Cap the value at 100 for color calculation (values > 100 use the 100 color)
  const cappedValue = Math.min(numericValue, 100);

  // Define color stops with REVERSED scale (0 = blue, 100 = red)
  const colorStops = [
    { percent: 0, color: { r: 13, g: 71, b: 161 } },      // #0D47A1 (Darker Blue) - Best
    { percent: 12, color: { r: 46, g: 125, b: 50 } },     // #2E7D32 (Darker Green)
    { percent: 24, color: { r: 179, g: 135, b: 0 } },     // #B38700 (Dark Yellow)
    { percent: 50, color: { r: 230, g: 81, b: 0 } },      // #E65100 (Darker Orange)
    { percent: 100, color: { r: 156, g: 12, b: 12 } }     // #9C0C0C (Even Darker Red) - Worst
  ];

  // Find the color stops to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (cappedValue >= colorStops[i].percent && cappedValue <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (cappedValue - lowerStop.percent) / range : 0;

  // Interpolate RGB values
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

  return `rgb(${r}, ${g}, ${b})`;
};

interface Entry {
  entry_length: string | null;
  times_played_num: string | null;
  shows_since_debut_num: string | null;
  entry_song: string;
  last_count: string | null;
  entry_short?: string | null;
}

interface ShowStatsProps {
  setlist: Entry[];
  show_canonid: number | null;
  show_rarity?: number | null;
  show_gap?: number | null;
}

const ShowStats: React.FC<ShowStatsProps> = ({ 
  setlist, 
  show_canonid,
  show_rarity,
  show_gap
}) => {
  const hasLength = setlist.some(entry => entry.entry_length !== null);
  
  const formatTimeUnit = (value: number, unit: string): string | null => {
    if (value === 0) return null;
    return `${value} ${unit}${value === 1 ? '' : 's'}`;
  };

  const totalLength = React.useMemo(() => {
    if (!hasLength) return null;
    
    let totalSeconds = 0;
    
    setlist.forEach(entry => {
      if (entry.entry_length) {
        const parts = entry.entry_length.split(':').map(Number);
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
        } else if (parts.length === 2) {
          const [minutes, seconds] = parts;
          totalSeconds += (minutes * 60) + seconds;
        }
      }
    });
    
    if (totalSeconds === 0) return null;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const timeComponents = [
      formatTimeUnit(hours, 'hour'),
      formatTimeUnit(minutes, 'minute'),
      formatTimeUnit(seconds, 'second')
    ].filter(Boolean);
    
    return timeComponents.join(' ');
  }, [setlist, hasLength]);

  const rarityStats = React.useMemo(() => {
    if (!show_canonid || show_rarity === null || show_rarity === undefined) return null;
    
    return {
      percentage: show_rarity.toFixed(2)
    };
  }, [show_canonid, show_rarity]);

  const averageShowGap = React.useMemo(() => {
    if (!show_canonid || show_gap === null || show_gap === undefined) return null;
    
    return {
      average: show_gap.toFixed(2)
    };
  }, [show_canonid, show_gap]);

  // Check if we should show any stats at all
  const shouldShowLength = hasLength;
  const shouldShowRarity = show_canonid && setlist.length > 0;
  const shouldShowGap = show_canonid && setlist.length > 0;
  
  if (!shouldShowLength && !shouldShowRarity && !shouldShowGap) return null;

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 mb-4">
      {shouldShowLength && (
        <div>
          <div className="flex justify-between items-center">
            <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth">Show Length</h2>
            <Clock className="text-fifth w-[1rem] h-[1rem]" />
          </div>
          <p className="text-fifth font-light text-xs">
            {totalLength || 'The length of this show is unknown.'}
          </p>
        </div>
      )}
      
      {shouldShowRarity && (
        <div className={shouldShowLength ? "mt-1.5" : ""}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="text-base font-medium text-fifth">Show Rarity</h2>
              {rarityStats && (
                <span
                  className="text-primary text-xs font-normal px-1.5 py-0.5 rounded-md inline-block ml-3"
                  style={{
                    backgroundColor: getRarityColor(rarityStats.percentage + '%')
                  }}
                >
                  {rarityStats.percentage}%
                </span>
              )}
            </div>
            <Flame className="text-fifth w-[1rem] h-[1rem]" />
          </div>
          {!rarityStats && (
            <p className="text-fifth text-xs">
              &nbsp;
            </p>
          )}
        </div>
      )}

      {shouldShowGap && (
        <div className={(shouldShowLength || shouldShowRarity) ? "mt-1.5" : ""}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="text-base font-medium text-fifth">Average Show Gap</h2>
              {averageShowGap && (
                <span 
                  className="text-white text-xs font-normal px-1.5 py-0.5 rounded-md inline-block ml-3"
                  style={{
                    backgroundColor: getGapColor(averageShowGap.average)
                  }}
                >
                  {averageShowGap.average}
                </span>
              )}
            </div>
            <Space className="text-fifth w-[1rem] h-[1rem]" />
          </div>
          {!averageShowGap && (
            <p className="text-fifth text-xs">
              &nbsp;
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowStats;