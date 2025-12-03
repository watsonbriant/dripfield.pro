// Format time for display
export const formatTime = (timeStr: string): string => {
  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  } else if (parts.length === 2) {
    return `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
  }
  
  return timeStr;
};

// Format date for display
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  
  return dateStr
    .split('-')
    .slice(1)
    .concat(dateStr.substring(2, 4))
    .join('.');
};

// Extract show count from last_count
export const extractShowCount = (lastCount: string | null): string => {
  if (!lastCount) return '';
  
  // Handle "Debut" case
  if (lastCount.trim().toLowerCase() === 'debut') {
    return '';
  }
  
  // Extract number from patterns like "86", "98, TD", "104, LIB"
  const match = lastCount.match(/^(\d+)/);
  return match ? match[1] : '';
};

// Helper functions for ranking text
export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
};

export const getRankingText = (rank: number): string => {
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

