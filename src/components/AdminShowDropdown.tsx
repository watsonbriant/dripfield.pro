import React, { useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ShowData } from '../types/showTypes';
import { getShowDisplayData } from '../utils/showUtils';

interface AdminShowDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    filteredShows: ShowData[];
    onShowSelect: (show: ShowData) => void;
    loading: boolean;
    loadingProgress: number;
}

export const AdminShowDropdown: React.FC<AdminShowDropdownProps> = ({
    isOpen,
    onToggle,
    searchTerm,
    onSearchChange,
    filteredShows,
    onShowSelect,
    loading,
    loadingProgress
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onToggle();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onToggle]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
            >
                Show
                <ChevronDown className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 bg-primary border border-fourth shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
                    <div className="p-1">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
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
                                        onClick={() => onShowSelect(show)}
                                        className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors"
                                    >
                                        {(() => {
                                            const { dateStr, canonIdStr, locationStr } = getShowDisplayData(show);
                                            return (
                                                <>
                                                    <span className="font-medium">{dateStr}</span>
                                                    {canonIdStr}
                                                    {locationStr}
                                                </>
                                            );
                                        })()}
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
