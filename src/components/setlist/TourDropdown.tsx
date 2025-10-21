import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { Modal } from '../Modal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for auto-scrolling in the Tours dropdown
  useEffect(() => {
    // Scroll to the current tour when dropdown opens
    if (isDropdownOpen && dropdownListRef.current && currentTour) {
      // Find the button for the current tour
      const buttons = dropdownListRef.current.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.trim() === currentTour) {
          button.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }
  }, [isDropdownOpen, currentTour]);

  const handleTourSelect = (tourId: string) => {
    onTourSelect(tourId);
    setIsDropdownOpen(false);
    setIsModalOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile Modal */}
      <div className="md:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-lg bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
        >
          <MapPin className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Tour"
        >
          <div className="space-y-0">
            <div className="divide-y divide-black/10">
              {tours.map((tour) => (
                <button
                  key={tour.tour}
                  onClick={() => handleTourSelect(tour.tour_id)}
                  className="w-full text-left px-4 py-1 text-sm rounded-lg hover:bg-black/10 transition-colors font-semibold"
                >
                  <span className="text-fifth">{tour.tour}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </div>

      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
        >
          Tours
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isDropdownOpen && (
        <div 
          ref={dropdownListRef}
          className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto w-64 max-h-96"
        >
          {tours.map((tour) => (
            <button
              key={tour.tour}
              onClick={() => handleTourSelect(tour.tour_id)}
              className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${
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
