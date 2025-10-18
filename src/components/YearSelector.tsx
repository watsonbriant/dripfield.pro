import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';

interface Year {
  year: string;
  year_id: string;
}

interface YearSelectorProps {
  years: Year[];
  currentYear: string;
  onYearChange: (yearId: string, year: string) => void;
}

export function YearSelector({ years, currentYear, onYearChange }: YearSelectorProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  const handleYearSelect = (yearId: string, year: string) => {
    onYearChange(yearId, year);
    navigate(`/years/${yearId}`);
    setIsDropdownOpen(false);
    setIsModalOpen(false);
  };

  // Effect to handle dropdown opening/closing and scrolling to current year
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    if (isDropdownOpen && dropdownListRef.current) {
      const currentYearButton = dropdownListRef.current.querySelector(`button[key="${currentYear}"]`);
      let targetButton = currentYearButton;
      
      if (!targetButton) {
        const buttons = dropdownListRef.current.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.trim() === currentYear) {
            targetButton = button;
            break;
          }
        }
      }
      
      if (targetButton) {
        // Calculate the scroll position to center the current year button
        const dropdownContainer = dropdownListRef.current;
        const buttonElement = targetButton as HTMLElement;
        const buttonTop = buttonElement.offsetTop;
        const buttonHeight = buttonElement.offsetHeight;
        const containerHeight = dropdownContainer.clientHeight;
        const scrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
        
        // Scroll within the dropdown container only
        dropdownContainer.scrollTop = Math.max(0, scrollTop);
      }
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, currentYear]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile Modal */}
      <div className="md:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-lg bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Year"
        >
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-2">
              {years.map((year) => (
                <button
                  key={year.year}
                  onClick={() => handleYearSelect(year.year_id, year.year)}
                  className="w-full text-center px-3 py-1 text-lg rounded-lg hover:bg-primary bg-tertiary transition-colors font-semibold border border-secondary"
                >
                  <span className="text-fifth">{year.year}</span>
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
          {currentYear || 'Select Year'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isDropdownOpen && (
        <div 
          ref={dropdownListRef}
          className={`absolute py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto ${
            window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-24 max-h-96'
          }`}
        >
          {years.map((year) => (
            <button
              key={year.year}
              onClick={() => handleYearSelect(year.year_id, year.year)}
              className={`w-full text-left px-4 py-1 text-sm font-medium hover:bg-secondary transition-colors ${
                currentYear === year.year ? 'bg-tertiary' : ''
              }`}
            >
              {year.year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
