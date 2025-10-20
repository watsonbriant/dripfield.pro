import { useState, useRef, useEffect } from 'react';

interface SparkleState {
  show: boolean;
  x: number;
  y: number;
  itemId: string;
}

export const useSparkleEffect = () => {
  const [sparkle, setSparkle] = useState<SparkleState>({ show: false, x: 0, y: 0, itemId: '' });
  const sparkleTimeoutRef = useRef<number | null>(null);

  const handleItemClick = (e: React.MouseEvent, itemName: string, action?: () => void) => {
    // Get click position relative to the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Show sparkle with item name
    setSparkle({ show: true, x, y, itemId: itemName });
    
    // Hide sparkle after animation completes
    if (sparkleTimeoutRef.current) {
      window.clearTimeout(sparkleTimeoutRef.current);
    }
    
    sparkleTimeoutRef.current = window.setTimeout(() => {
      setSparkle({ show: false, x: 0, y: 0, itemId: '' });
    }, 500); // Animation duration
    
    // Execute the action if provided
    if (action) {
      action();
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (sparkleTimeoutRef.current) {
        window.clearTimeout(sparkleTimeoutRef.current);
      }
    };
  }, []);

  return { sparkle, handleItemClick };
};
