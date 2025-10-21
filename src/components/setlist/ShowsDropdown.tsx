import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string | null;
  show_detail: string | null;
  show_alert: string | null;
  show_rarity_percentage: string | null;
  total_entry_length: string | null;
  show_canonid: number | null;
}

interface ShowsDropdownProps {
  showDates: ShowDate[];
  currentShowId?: string;
  onShowSelect: (showId: string) => void;
}

export const ShowsDropdown: React.FC<ShowsDropdownProps> = ({
  showDates,
  currentShowId,
  onShowSelect
}) => {
  const [isShowDatesDropdownOpen, setIsShowDatesDropdownOpen] = useState(false);
  const showDatesDropdownRef = useRef<HTMLDivElement>(null);
  const showDatesDropdownListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatesDropdownRef.current && !showDatesDropdownRef.current.contains(event.target as Node)) {
        setIsShowDatesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for auto-scrolling in the Shows dropdown
  useEffect(() => {
    // Scroll to the current show when dropdown opens
    if (isShowDatesDropdownOpen && showDatesDropdownListRef.current && currentShowId) {
      // Find the button for the current show
      const buttons = showDatesDropdownListRef.current.querySelectorAll('button');
      for (const button of buttons) {
        if (button.getAttribute('data-show-id') === currentShowId) {
          button.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }
  }, [isShowDatesDropdownOpen, currentShowId]);

  const handleShowSelect = (showId: string) => {
    onShowSelect(showId);
    setIsShowDatesDropdownOpen(false);
  };

  return (
    <div className="relative" ref={showDatesDropdownRef}>
      <div className="md:block">
        <button
          onClick={() => setIsShowDatesDropdownOpen(!isShowDatesDropdownOpen)}
          className="flex items-center gap- growth-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
        >
          Shows
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isShowDatesDropdownOpen && (
        <div 
          ref={showDatesDropdownListRef}
          className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto w-64 max-h-96"
        >
          {showDates.map((showDate) => (
            <button
              key={showDate.show_id}
              data-show-id={showDate.show_id}
              onClick={() => handleShowSelect(showDate.show_id)}
              className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${
                currentShowId === showDate.show_id ? 'bg-tertiary' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="truncate text-fifth">
                  <span className="font-semibold">
                    {showDate.formatted_show_date} 
                    {showDate.show_venue_location && (
                      <span className="font-normal">
                        {' '}({showDate.show_venue_location})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  {showDate.show_rarity_percentage && (
                    <span className="px-2 py-0.5 bg-canvas rounded border border-secondary/20 text-fifth">
                      {showDate.show_rarity_percentage}
                    </span>
                  )}
                  {showDate.total_entry_length && (
                    <span className="px-2 py-0.5 bg-canvas rounded border border-secondary/20 text-fifth">
                      {showDate.total_entry_length}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
