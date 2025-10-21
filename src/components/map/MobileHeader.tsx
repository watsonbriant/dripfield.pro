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
        <span className="text-sm text-fifth">{venueCount} venues</span>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="p-1 bg-red-600 hover:bg-red-600/70 text-primary rounded transition-colors focus:outline-none"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <button
        onClick={onOpenFilterModal}
        className="flex items-center gap-2 px-3 py-1 bg-tertiary hover:bg-tertiary/70 text-fifth text-sm font-medium rounded border border-secondary transition-colors focus:outline-none"
      >
        <Filter className="w-4 h-4" />
        Filter
      </button>
    </div>
  </div>
);
