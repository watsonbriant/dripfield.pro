import React, { useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { VenueData } from '../hooks/useSubvenueData';

interface VenueFormDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filteredVenues: VenueData[];
    onVenueSelect: (venue: VenueData) => void;
    selectedVenue: string;
}

export const VenueFormDropdown: React.FC<VenueFormDropdownProps> = ({
    isOpen,
    onToggle,
    onClose,
    searchTerm,
    onSearchChange,
    filteredVenues,
    onVenueSelect,
    selectedVenue
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm text-left flex items-center justify-between"
            >
                <span className="truncate">
                    {selectedVenue || 'Select venue...'}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-full max-h-60 overflow-y-auto">
                    <div className="p-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search venues..."
                                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                        </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-black/10">
                        {filteredVenues.map((venue) => (
                            <button
                                key={venue.venue}
                                onClick={() => onVenueSelect(venue)}
                                className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                            >
                                <span className="font-medium">{venue.venue}</span>
                                <span>&nbsp;&nbsp;[{venue.venue_location}]</span>
                            </button>
                        ))}
                        {filteredVenues.length === 0 && (
                            <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                No venues found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
