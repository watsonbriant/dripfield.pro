import React from 'react';

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

interface Entry {
  entry_length: string | null;
  times_played_num: string | null;
  shows_since_debut_num: string | null;
  entry_song: string;
}

interface ShowStatsProps {
  setlist: Entry[];
  show_canonid: number | null;
}

const ShowStats: React.FC<ShowStatsProps> = ({ setlist, show_canonid }) => {
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
    if (!show_canonid || !setlist.length) return null;
    try {
      const uniqueSongs = new Map();
      
      setlist.forEach(entry => {
        if (!uniqueSongs.has(entry.entry_song)) {
          uniqueSongs.set(entry.entry_song, {
            times_played_num: entry.times_played_num,
            shows_since_debut_num: entry.shows_since_debut_num
          });
        }
      });

      const totalPlays = Array.from(uniqueSongs.values()).reduce((sum, entry) => 
        sum + (entry.times_played_num ? parseInt(entry.times_played_num, 10) : 0), 0);
      
      const totalShows = Array.from(uniqueSongs.values()).reduce((sum, entry) => 
        sum + (entry.shows_since_debut_num ? parseInt(entry.shows_since_debut_num, 10) : 0), 0);
      
      if (totalShows === 0) return null;
      const percentage = (totalPlays * 100.0) / totalShows;
      
      return {
        percentage: percentage.toFixed(2),
        plays: totalPlays,
        shows: totalShows
      };
    } catch (error) {
      console.error('Error calculating rarity:', error);
      return null;
    }
  }, [setlist, show_canonid]);

  // Check if we should show any stats at all
  const shouldShowLength = hasLength;
  const shouldShowRarity = show_canonid && setlist.length > 0;
  
  if (!shouldShowLength && !shouldShowRarity) return null;

  return (
    <div className="bg-primary border border-black rounded-lg p-3 mb-6">
      {shouldShowLength && (
        <div>
          <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-2">Show Length</h2>
          <p className="text-black text-sm">
            {totalLength || 'The length of this show is unknown.'}
          </p>
        </div>
      )}
      
      {shouldShowRarity && (
        <div className={shouldShowLength ? "mt-4" : ""}>
          <div className="flex items-center">
            <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Show Rarity</h2>
            {rarityStats && (
              <span 
                className="text-white text-sm font-medium px-2 py-0.5 rounded-md inline-block ml-3"
                style={{ 
                  backgroundColor: getRarityColor(rarityStats.percentage + '%'),
                  border: '1px solid black'
                }}
              >
                {rarityStats.percentage}%
              </span>
            )}
          </div>
          {!rarityStats && (
            <p className="text-black text-sm">
              Error calculating show rarity
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowStats;