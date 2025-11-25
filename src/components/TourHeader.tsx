import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { Tour } from '../types/tourTypes';

interface TourHeaderProps {
  currentTour: string;
  tours: Tour[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onTourSelect: (tour: Tour) => void;
}

export function TourHeader({
  currentTour,
  tours,
  isDropdownOpen,
  setIsDropdownOpen,
  isModalOpen,
  setIsModalOpen,
  onTourSelect
}: TourHeaderProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current tour when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && dropdownListRef.current) {
      const currentTourIndex = tours.findIndex(tour => tour.tour === currentTour);
      if (currentTourIndex !== -1) {
        const tourButtons = dropdownListRef.current.querySelectorAll('button');
        const currentTourButton = tourButtons[currentTourIndex];
        if (currentTourButton) {
          // Calculate the scroll position to center the current tour button
          const dropdownContainer = dropdownListRef.current;
          const buttonTop = currentTourButton.offsetTop;
          const buttonHeight = currentTourButton.offsetHeight;
          const containerHeight = dropdownContainer.clientHeight;
          const scrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
          
          // Scroll within the dropdown container only
          dropdownContainer.scrollTop = Math.max(0, scrollTop);
        }
      }
    }
  }, [isDropdownOpen, currentTour, tours]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  const handleTourSelect = (tour: Tour) => {
    onTourSelect(tour);
    navigate(`/tours/${tour.tour_id}`);
    setIsDropdownOpen(false);
    setIsModalOpen(false);
  };

  return (
    <div className="flex justify-between mb-6 items-center">
      <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-fourth">
        Tours
      </h1>
      <div className="relative" ref={dropdownRef}>
        <div className="md:hidden">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-lg bg-tertiary text-fifth hover:bg-primary transition-colors border border-fourth"
          >
            <Search className="w-6 h-6" />
          </button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Select Tour"
          >
            <div className="space-y-0">
              <div className="divide-y divide-white/10">
                {tours.map((tour) => (
                  <button
                    key={tour.tour}
                    onClick={() => handleTourSelect(tour)}
                    className="w-full text-left px-4 py-1 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    <span className="text-fifth">{tour.tour}</span>
                  </button>
                ))}
              </div>
            </div>
          </Modal>
        </div>
        <div className="hidden md:block">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-fourth hover:bg-primary transition-colors text-lg font-semibold"
          >
            {currentTour}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        {isDropdownOpen && (
          <div
            ref={dropdownListRef}
            className={`absolute py-1 bg-primary border border-fourth rounded-lg shadow-lg z-50 overflow-y-auto ${
              window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-80 max-h-96'
            }`}
          >
            {tours.map((tour) => (
              <button
                key={tour.tour}
                onClick={() => handleTourSelect(tour)}
                className={`w-full text-left px-4 py-1 text-sm font-medium hover:bg-secondary transition-colors ${
                  currentTour === tour.tour ? 'bg-tertiary' : ''
                }`}
              >
                {tour.tour}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
