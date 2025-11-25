import React from 'react';
import { Clock, Flame, Space } from 'lucide-react';

// Move color calculation functions outside component to prevent recreation on every render
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

// Move formatting functions outside component to prevent recreation on every render
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

const getRankingText = (rank: number): string => {
  if (rank === 1) return "Longest Goose show of all-time.";
  
  const wordMap: { [key: number]: string } = {
    2: "Second",
    3: "Third",
    4: "Fourth",
    5: "Fifth",
    6: "Sixth",
    7: "Seventh",
    8: "Eighth",
    9: "Ninth"
  };
  
  if (rank >= 2 && rank <= 9) {
    return `${wordMap[rank]}-longest Goose show of all-time.`;
  }
  
  return `${getOrdinalSuffix(rank)}-longest Goose show of all-time.`;
};

const formatTimeUnit = (value: number, unit: string): string | null => {
  if (value === 0) return null;
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
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
  show_length_rank?: number | null;
}

const ShowStats: React.FC<ShowStatsProps> = ({ 
  setlist, 
  show_canonid,
  show_rarity,
  show_gap,
  show_length_rank 
}) => {
  const [rankHovered, setRankHovered] = React.useState(false);
  
  // Calculate conditions for early return
  const hasLength = setlist.some(entry => entry.entry_length !== null);
  const shouldShowLength = hasLength;
  const shouldShowRarity = show_canonid && setlist.length > 0;
  const shouldShowGap = show_canonid && setlist.length > 0;

  const totalLength = React.useMemo(() => {
    if (!shouldShowLength) return null;
    
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
  }, [setlist, shouldShowLength]);

  const rarityStats = React.useMemo(() => {
    if (!shouldShowRarity || show_rarity === null || show_rarity === undefined) return null;
    
    return {
      percentage: show_rarity.toFixed(2)
    };
  }, [shouldShowRarity, show_rarity]);

  const averageShowGap = React.useMemo(() => {
    if (!shouldShowGap || show_gap === null || show_gap === undefined) return null;
    
    return {
      average: show_gap.toFixed(2)
    };
  }, [shouldShowGap, show_gap]);

  // Early return if no stats should be shown - must be after all hooks
  if (!shouldShowLength && !shouldShowRarity && !shouldShowGap) return null;

  return (
    <>
      {shouldShowLength && (
        <div>
          <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
            <h2 className="text-xs font-medium">Show Length</h2>
            <div className="flex items-center gap-2">
              {show_length_rank && (
                <div className="relative inline-flex items-center">
                  <a
                    href="https://dripfield.pro/lists/45a4b90e-adbe-4af5-9051-2f4d212069fc"
                    rel="noopener noreferrer"
                    className="text-fifth text-[0.625rem] font-medium px-1 py-[1px] rounded bg-yellow-500 inline-block"
                    onMouseEnter={() => setRankHovered(true)}
                    onMouseLeave={() => setRankHovered(false)}
                  >
                    #{show_length_rank}
                  </a>
                  {rankHovered && (
                    <div className="absolute left-0 top-full mt-1 text-[0.625rem] font-medium bg-canvas text-fifth px-2 py-0.5 rounded border border-fourth shadow-lg whitespace-nowrap z-[9999]">
                      {getRankingText(show_length_rank)}
                    </div>
                  )}
                </div>
              )}
              <Clock className="text-white w-3 h-3" />
            </div>
          </div>
          <p className="text-fifth font-light text-[0.625rem] px-1 py-0.5">
            {totalLength || 'The length of this show is unknown.'}
          </p>
        </div>
      )}
      
      {shouldShowRarity && (
        <div>
          <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
            <h2 className="text-xs font-medium">Show Rarity</h2>
            <div className="flex items-center gap-2">
              {rarityStats && (
                <span
                  className="text-white text-[0.625rem] font-medium px-1 py-[1px] rounded inline-block"
                  style={{
                    backgroundColor: getRarityColor(rarityStats.percentage + '%')
                  }}
                >
                  {rarityStats.percentage}%
                </span>
              )}
              <Flame className="text-white w-3 h-3" />
            </div>
          </div>
          {!rarityStats && (
            <p className="text-fifth text-[0.625rem] px-2 py-0.5">
              &nbsp;
            </p>
          )}
        </div>
      )}

      {shouldShowGap && (
        <div>
          <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
            <h2 className="text-xs font-medium">Average Show Gap</h2>
            <div className="flex items-center gap-2">
              {averageShowGap && (
                <span 
                  className="text-white text-[0.625rem] font-medium px-1 py-[1px] rounded inline-block"
                  style={{
                    backgroundColor: getGapColor(averageShowGap.average)
                  }}
                >
                  {averageShowGap.average}
                </span>
              )}
              <Space className="text-white w-3 h-3" />
            </div>
          </div>
          {!averageShowGap && (
            <p className="text-fifth text-[0.625rem] px-2 py-0.5">
              &nbsp;
            </p>
          )}
        </div>
      )}
    </>
  );
};

// Wrap component in React.memo to prevent unnecessary re-renders when props haven't changed
export default React.memo(ShowStats);