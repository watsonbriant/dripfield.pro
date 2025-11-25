import React from 'react';
import { X, Filter } from 'lucide-react';
import { FilterModal } from '../FilterModal';

interface MobileHeaderProps {
  venueCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onOpenFilterModal: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  venueCount,
  hasActiveFilters,
  onClearFilters,
  onOpenFilterModal
}) => (
  <div className="mb-2 xl:hidden">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-fifth">{venueCount} venues</span>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="p-0.5 bg-red-600 hover:bg-red-600/70 text-white border border-fourth rounded transition-colors focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button
        onClick={onOpenFilterModal}
        className="flex items-center gap-2 px-1.5 py-0.5 bg-tertiary hover:bg-tertiary/70 text-fifth text-xs font-medium rounded border border-fourth transition-colors focus:outline-none"
      >
        <Filter className="w-4 h-4" />
        Filter
      </button>
    </div>
  </div>
);
