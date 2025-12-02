import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface YearFilterProps {
  years: string[];
  yearFilter: string;
  setYearFilter: (year: string) => void;
}

export const YearFilter: React.FC<YearFilterProps> = ({ years, yearFilter, setYearFilter }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-1/4 lg:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-1 px-3 py-1 bg-canvas font-medium text-fifth border border-fourth rounded text-sm hover:bg-canvas/80 transition-colors w-full justify-between"
      >
        <span>{yearFilter || 'Select Year'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {dropdownOpen && (
        <div className="absolute right-0 mt-1 max-h-64 overflow-y-auto bg-canvas border border-fourth rounded shadow-lg z-10 w-full lg:w-32">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                setYearFilter(year);
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-1 text-sm ${
                yearFilter === year
                  ? 'bg-tertiary text-fifth font-medium'
                  : 'text-fifth hover:bg-black/10'
              } transition-colors`}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
