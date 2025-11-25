import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SongPick } from './types';
import { getResultDescription } from './utils';

interface TooltipContainerProps {
  result: string | undefined;
  score: number | undefined;
  pick?: SongPick;
}

export const TooltipContainer: React.FC<TooltipContainerProps> = React.memo(({ 
  result, 
  score, 
  pick 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Calculate tooltip position when it becomes visible
  useEffect(() => {
    if (showTooltip && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Get actual tooltip dimensions
      const tooltipWidth = tooltipRect.width || tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRect.height || tooltipRef.current.offsetHeight;
      
      // Position tooltip so its RIGHT edge is 8px (2 Tailwind units) to the LEFT of the container
      let x = containerRect.left - tooltipWidth - 8; // 8px = 2 Tailwind units
      let y = containerRect.top + (containerRect.height / 2) - (tooltipHeight / 2); // Center vertically
      
      // Keep tooltip within viewport bounds
      if (x < 8) {
        // If no space on left, show on right side instead
        x = containerRect.right + 8;
      }
      if (y < 8) {
        y = 8;
      }
      if (y + tooltipHeight > window.innerHeight - 8) {
        y = window.innerHeight - tooltipHeight - 8;
      }
      
      setTooltipPosition({ x, y });
    }
  }, [showTooltip]); // Remove tooltipRef dependency to avoid infinite loops
  
  // Create the tooltip content using React Portal
  const tooltipContent = showTooltip ? createPortal(
    <div 
      ref={tooltipRef}
      className="bg-canvas border border-fourth text-fifth font-medium px-2 py-1 rounded shadow-lg text-[0.625rem] leading-[0.75rem] whitespace-nowrap pointer-events-none"
      style={{
        position: 'fixed',
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        zIndex: 999999,
        // Initially invisible to measure dimensions
        visibility: tooltipPosition.x === 0 && tooltipPosition.y === 0 ? 'hidden' : 'visible',
      }}
      dangerouslySetInnerHTML={{ 
        __html: getResultDescription(result, pick?.showcloser_correct ?? false, pick?.showopener_correct ?? false)
      }}
    />,
    document.body
  ) : null;
  
  return (
    <>
      <div 
        className="flex items-center justify-center cursor-pointer relative"
        ref={containerRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {result === 'not_played' ? (
          <X className="w-5 h-5 text-white p-0.5 bg-red-600 rounded" />
        ) : (
          <span className="font-medium text-xs text-white bg-green-600 rounded px-1 py-0.5">
            +{score}
          </span>
        )}
      </div>
      {tooltipContent}
    </>
  );
});
