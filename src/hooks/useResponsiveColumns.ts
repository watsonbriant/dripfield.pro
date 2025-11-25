import { useState, useEffect } from 'react';

export const useResponsiveColumns = () => {
  const [columnCount, setColumnCount] = useState(1);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setColumnCount(4); // xl breakpoint - 4 columns for original/other
      } else if (width >= 640) {
        setColumnCount(3); // lg breakpoint - 3 columns for original/other
      } else if (width >= 320) {
        setColumnCount(2); // sm breakpoint - 2 columns for all sections
      } else {
        setColumnCount(1); // mobile - 1 column
      }
    };
    
    // Initial calculation
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return columnCount;
};
