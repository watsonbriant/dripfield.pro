// CircularProgress component copied from UserSongs
export const CircularProgress = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#dad0bc" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#8ec1b6" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-fifth">
        {Math.round(value)}%
      </div>
    </div>
  );
};

// Map category to color like in Home component
export const getCategoryColor = (category: string): string => {
  switch(category) {
    case 'Completionist':
    case 'Side Projects':
    case 'Song Debuts':
    case 'Goosemas':
    case 'Tour Stats':
    case 'Show Stats':
      return 'bg-fourth'; // Yellow
    default:
      return 'bg-fourth'; // Default yellow
  }
};

// Map category to text color
export const getCategoryTextColor = (category: string): string => {
  switch(category) {
    case 'Completionist':
    case 'Side Projects':
    case 'Song Debuts':
    case 'Goosemas':
    case 'Tour Stats':
    case 'Show Stats':
      return 'text-primary'; // White text on darker colors
    default:
      return 'text-primary'; // Default black text
  }
};
