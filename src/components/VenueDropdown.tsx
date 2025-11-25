import React, { useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { VenueData } from '../hooks/useVenueData';

interface VenueDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filteredVenues: VenueData[];
    onVenueSelect: (venue: VenueData) => void;
    loading: boolean;
    loadingProgress: number;
}

const getVenueDisplayText = (venue: VenueData) => {
    return (
        <>
            <span className="font-medium">{venue.venue}</span>
            <span>&nbsp;&nbsp;[{venue.venue_location}]</span>
        </>
    );
};

export const VenueDropdown: React.FC<VenueDropdownProps> = ({
    isOpen,
    onToggle,
    onClose,
    searchTerm,
    onSearchChange,
    filteredVenues,
    onVenueSelect,
    loading,
    loadingProgress
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
                className="flex items-center gap-2 bg-fourth text-white px-4 py-1.5 rounded-md border border-fourth hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
            >
                Venue
                <ChevronDown className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 py-1 bg-primary border border-fourth rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
                    <div className="p-2">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Search venues..."
                                className="w-full px-3 py-1.5 pr-8 rounded-md border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                            />
                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                        {loading && loadingProgress < 100 ? (
                            <div className="flex flex-col justify-center items-center p-3 h-16">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-fourth"></div>
                                <p className="text-xs text-fifth/70 mt-2">Loading venues ({Math.round(loadingProgress)}%)</p>
                            </div>
                        ) : (
                            <>
                                {filteredVenues.map((venue) => (
                                    <button
                                        key={`${venue.venue}-${venue.venue_location}`}
                                        onClick={() => onVenueSelect(venue)}
                                        className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                    >
                                        {getVenueDisplayText(venue)}
                                    </button>
                                ))}
                                {filteredVenues.length === 0 && !loading && (
                                    <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                        No venues found
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
