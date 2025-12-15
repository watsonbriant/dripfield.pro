import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Tour {
  tour: string;
  tour_canonid: number;
  tour_id: string;
}

interface TourDropdownProps {
  tours: Tour[];
  currentTour?: string;
  onTourSelect: (tourId: string) => void;
}

export const TourDropdown: React.FC<TourDropdownProps> = ({
  tours,
  currentTour,
  onTourSelect
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        dropdownListRef.current &&
        !dropdownListRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for auto-scrolling in the Tours dropdown and positioning
  useEffect(() => {
    if (isDropdownOpen) {
      const updatePosition = () => {
        // Calculate position for fixed positioning (viewport-relative, no scroll offset needed)
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const dropdownWidth = 256; // w-64 = 256px
          const viewportWidth = window.innerWidth;
          
          // Ensure dropdown stays within viewport bounds
          let left = rect.left;
          if (left + dropdownWidth > viewportWidth) {
            left = Math.max(0, viewportWidth - dropdownWidth);
          }
          
          setDropdownPosition({
            top: rect.bottom + 8, // 8px for mt-2 equivalent, fixed is viewport-relative
            left: left
          });
        }
      };

      updatePosition();
      
      // Scroll to the current tour when dropdown opens
      if (dropdownListRef.current && currentTour) {
        // Find the button for the current tour
        const buttons = dropdownListRef.current.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.trim() === currentTour) {
            button.scrollIntoView({ block: 'center' });
            break;
          }
        }
      }

      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isDropdownOpen, currentTour]);

  const handleTourSelect = (tourId: string) => {
    onTourSelect(tourId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-fourth text-white pl-2 pr-1 py-0.5 border border-fourth hover:bg-tertiary hover:text-fifth transition-colors text-sm font-semibold -mx-[1px]"
      >
        {currentTour || 'Tours'}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div 
          ref={dropdownListRef}
          className="fixed bg-canvas border border-fourth shadow-lg z-[10000] overflow-y-auto w-64 max-h-96 space-y-0 -mt-[9px] gap-0"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {tours.map((tour) => (
            <button
              key={tour.tour}
              onClick={() => handleTourSelect(tour.tour_id)}
              className={`w-full text-left px-2 py-1 text-xs leading-[0.75rem] font-medium hover:bg-black/10 transition-colors ${
                currentTour === tour.tour ? 'bg-tertiary' : ''
              }`}
            >
              <span className="text-fifth">{tour.tour}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
