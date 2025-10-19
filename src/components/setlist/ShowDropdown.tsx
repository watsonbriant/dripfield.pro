import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ShowData } from '../../types/setlist';
import { formatDate } from '../../utils/setlistUtils';

interface ShowDropdownProps {
  shows: ShowData[];
  loading: boolean;
  loadingProgress: number;
  onShowSelect: (show: ShowData) => void;
}

export const ShowDropdown: React.FC<ShowDropdownProps> = ({
  shows,
  loading,
  loadingProgress,
  onShowSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter shows based on search term
  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const formattedDate = formatDate(show.show_date);
      const canonidText = show.show_canonid ? `[${show.show_canonid}]` : '';
      const displayText = `${formattedDate} ${canonidText} [${show.show_group} — ${show.show_venue_location}]`;
      return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [shows, searchTerm]);

  const handleShowSelect = (show: ShowData) => {
    onShowSelect(show);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
      >
        Select Show
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shows..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {loading && loadingProgress < 100 ? (
              <div className="flex flex-col justify-center items-center p-4 h-16">
                <div className="animate-spin rounded-lg h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                <p className="text-xs text-fifth/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
              </div>
            ) : (
              <>
                {filteredShows.map((show) => (
                  <button
                    key={show.show_id}
                    onClick={() => handleShowSelect(show)}
                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                  >
                    <span className="font-medium">
                      {formatDate(show.show_date)}
                    </span>
                      {show.show_canonid ? ` [${show.show_canonid}]` : ''} 
                      &nbsp;[{show.show_group} — {show.show_venue_location}]
                  </button>
                ))}
                {filteredShows.length === 0 && !loading && (
                  <div className="px-2 py-1 text-sm text-fifth/60 italic">
                    No shows found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
