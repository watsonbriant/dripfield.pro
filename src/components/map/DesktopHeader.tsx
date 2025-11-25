import React from 'react';

interface DesktopHeaderProps {
  venueCount: number;
  hasActiveFilters: boolean;
  selectedTour: string;
  selectedGroup: string;
  tours: Array<{ tour: string }>;
  groups: Array<{ group: string }>;
  isGroupDropdownDisabled: boolean;
  onClearFilters: () => void;
  onTourChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onGroupChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  venueCount,
  hasActiveFilters,
  selectedTour,
  selectedGroup,
  tours,
  groups,
  isGroupDropdownDisabled,
  onClearFilters,
  onTourChange,
  onGroupChange
}) => (
  <div className="mb-2 hidden xl:flex justify-between items-center">
    <div className="flex items-center gap-3">
      <div className="text-xs font-medium text-fifth">
        Showing {venueCount} venues
      </div>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-2 py-0.5 bg-red-600 hover:bg-red-600/70 text-white border border-fourth text-xs font-medium rounded transition-colors focus:outline-none"
        >
          Clear Filter
        </button>
      )}
    </div>
    <div className="flex items-center gap-4">
      {/* Tour Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="tour-filter" className="text-xs text-fifth font-medium">
          Filter by tour:
        </label>
        <select
          id="tour-filter"
          value={selectedTour}
          onChange={onTourChange}
          className="pl-1.5 pr-4 py-0.5 border border-fourth rounded bg-tertiary text-fifth text-xs font-normal focus:outline-none focus:ring-2 focus:ring-tertiary"
        >
          <option value="Show All">[Show All]</option>
          {tours.map((tour) => (
            <option key={tour.tour} value={tour.tour}>
              {tour.tour}
            </option>
          ))}
        </select>
      </div>

      {/* Group Filter Dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="group-filter" className="text-xs text-fifth font-medium">
          Filter by group:
        </label>
        <select
          id="group-filter"
          value={selectedGroup}
          onChange={onGroupChange}
          disabled={isGroupDropdownDisabled}
          className={`pl-1.5 pr-4 py-0.5 border border-fourth rounded text-fifth text-xs font-normal focus:outline-none focus:ring-2 focus:ring-tertiary ${
            isGroupDropdownDisabled 
              ? 'bg-gray-200 cursor-not-allowed opacity-50' 
              : 'bg-tertiary'
          }`}
        >
          <option value="Show All">[Show All]</option>
          {groups.map((group) => (
            <option key={group.group} value={group.group}>
              {group.group}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);
