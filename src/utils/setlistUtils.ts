// Format date as MM.DD.YY
export const formatDate = (dateString: string): string => {
  try {
    return dateString
      .split('-')
      .slice(1)
      .concat(dateString.substring(2, 4))
      .join('.');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format time display from interval
export const formatTimeDisplay = (interval: string | null) => {
  if (!interval) return "";
  
  if (interval.includes(":")) {
    return interval;
  }
  
  return interval;
};

// Get background color for placement
export const getPlacementColor = (placement: string | null): string => {
  if (!placement) return 'transparent';
  
  const colorMap: { [key: string]: string } = {
    'Set 1 Opener': '#006400',
    'Set 1 Closer': '#995905',
    'Set 2 Opener': '#019B7A',
    'Set 3 Opener': '#019B7A',
    'Set 4 Opener': '#019B7A',
    'Set 5 Opener': '#019B7A',
    'Set 2 Closer': '#E17401',
    'Set 3 Closer': '#E17401',
    'Set 4 Closer': '#E17401',
    'Set 5 Closer': '#E17401',
    'Encore 1': '#7C2128',
    'Encore 2': '#CE1126',
    'Encore 3': '#AF1E2D'
  };
  
  if (placement.startsWith('Main Set')) {
    return 'transparent';
  }
  
  return colorMap[placement] || '#0c1d27';
};

// Get header styling based on save status
export const getHeaderStyle = (saveStatus: 'idle' | 'processing' | 'done' | 'error') => {
  switch (saveStatus) {
    case 'processing':
      return 'bg-black text-primary';
    case 'done':
      return 'bg-green-600 text-primary';
    case 'error':
      return 'bg-red-600 text-primary';
    default:
      return 'bg-fourth text-primary';
  }
};

// Get header text based on save status
export const getHeaderText = (saveStatus: 'idle' | 'processing' | 'done' | 'error') => {
  switch (saveStatus) {
    case 'processing':
      return 'Processing...';
    case 'done':
      return 'Done!';
    case 'error':
      return 'Error.';
    default:
      return 'Setlist Management';
  }
};
