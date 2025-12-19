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
      const searchLower = searchTerm.toLowerCase();
      const dateStr = formatDate(show.show_date);
      return (
        dateStr.includes(searchLower) ||
        show.show_canonid?.toString().includes(searchLower) ||
        show.show_group.toLowerCase().includes(searchLower) ||
        show.show_venue_location?.toLowerCase().includes(searchLower)
      );
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
        className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
      >
        Select Show
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 bg-primary border border-fourth shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
          <div className="p-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shows..."
                className="w-full px-2 py-0.5 pr-8 border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {loading && loadingProgress < 100 ? (
              <div className="flex flex-col justify-center items-center p-3 h-16">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
                <p className="text-xs text-fifth mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
              </div>
            ) : (
              <>
                {filteredShows.map((show) => (
                  <button
                    key={show.show_id}
                    onClick={() => handleShowSelect(show)}
                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors"
                  >
                    <span className="font-medium">
                      {formatDate(show.show_date)}
                    </span>
                    {show.show_canonid ? ` [${show.show_canonid}]` : ''} 
                    &nbsp;[{show.show_group} – {show.show_venue_location}]
                  </button>
                ))}
                {filteredShows.length === 0 && !loading && (
                  <div className="px-2 py-0.5 text-xs text-fifth text-center">
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
