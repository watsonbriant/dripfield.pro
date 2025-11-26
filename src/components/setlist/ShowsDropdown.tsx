import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const showDatesDropdownRef = useRef<HTMLDivElement>(null);
  const showDatesDropdownListRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showDatesDropdownRef.current && 
        !showDatesDropdownRef.current.contains(target) &&
        showDatesDropdownListRef.current &&
        !showDatesDropdownListRef.current.contains(target)
      ) {
        setIsShowDatesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for auto-scrolling in the Shows dropdown and positioning
  useEffect(() => {
    if (isShowDatesDropdownOpen) {
      // Calculate position for fixed positioning
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // 8px for mt-2 equivalent
          left: rect.left + window.scrollX
        });
      }
      
      // Scroll to the current show when dropdown opens
      if (showDatesDropdownListRef.current && currentShowId) {
        // Find the button for the current show
        const buttons = showDatesDropdownListRef.current.querySelectorAll('button');
        for (const button of buttons) {
          if (button.getAttribute('data-show-id') === currentShowId) {
            button.scrollIntoView({ block: 'center' });
            break;
          }
        }
      }
    }
  }, [isShowDatesDropdownOpen, currentShowId]);

  const handleShowSelect = (showId: string) => {
    onShowSelect(showId);
    setIsShowDatesDropdownOpen(false);
  };

  // Find current show to display its date
  const currentShow = showDates.find(sd => sd.show_id === currentShowId);
  const currentShowDate = currentShow 
    ? formatInTimeZone(new Date(currentShow.show_date), 'UTC', 'MM.dd.yy')
    : 'Shows';

  return (
    <div className="relative" ref={showDatesDropdownRef}>
      <div className="md:block">
        <button
          ref={buttonRef}
          onClick={() => setIsShowDatesDropdownOpen(!isShowDatesDropdownOpen)}
          className="flex items-center gap-2 bg-fourth text-white pl-2 pr-1 py-0.5 border border-fourth hover:bg-tertiary hover:text-fifth transition-colors text-sm font-semibold"
        >
          {currentShowDate}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isShowDatesDropdownOpen && (
        <div 
          ref={showDatesDropdownListRef}
          className="fixed bg-canvas border border-fourth shadow-lg z-[10000] overflow-y-auto w-64 max-h-96 space-y-0 gap-0"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {showDates.map((showDate) => (
            <button
              key={showDate.show_id}
              data-show-id={showDate.show_id}
              onClick={() => handleShowSelect(showDate.show_id)}
              className={`w-full text-left px-2 py-0.5 text-xs font-semibold hover:bg-black/10 transition-colors ${
                currentShowId === showDate.show_id ? 'bg-tertiary' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="truncate text-fifth">
                  <span className="font-medium">
                    {showDate.formatted_show_date} 
                    {showDate.show_venue_location && (
                      <span className="font-light">
                        {' '}({showDate.show_venue_location})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  {showDate.show_rarity_percentage && (
                    <span className="px-2 py-0.5 bg-canvas rounded border border-fourth/20 text-fifth">
                      {showDate.show_rarity_percentage}
                    </span>
                  )}
                  {showDate.total_entry_length && (
                    <span className="px-2 py-0.5 bg-canvas rounded border border-fourth/20 text-fifth">
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
