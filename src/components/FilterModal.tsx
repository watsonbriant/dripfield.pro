import React from 'react';
import { X } from 'lucide-react';

interface Group {
  group: string;
}

interface Tour {
  tour: string;
  tour_venuemap: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: Group[];
  tours: Tour[];
  selectedGroup: string;
  selectedTour: string;
  onGroupChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onTourChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterModal({ 
  isOpen, 
  onClose, 
  groups, 
  tours, 
  selectedGroup, 
  selectedTour, 
  onGroupChange, 
  onTourChange, 
  onClearFilters,
  hasActiveFilters 
}: FilterModalProps) {
  if (!isOpen) return null;

  const isGroupDropdownDisabled = selectedTour !== 'Show All';
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[9999]"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-[72px] max-h-[calc(100vh-88px)] z-[9999] bg-primary rounded-lg border border-fourth shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-fourth/10">
          <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-fourth">
            Venue Map Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-fourth bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tour Filter */}
          <div className="space-y-2">
            <label htmlFor="tour-filter-modal" className="block text-sm text-fifth font-medium">
              Filter by Tour:
            </label>
            <select
              id="tour-filter-modal"
              value={selectedTour}
              onChange={(e) => {
                onTourChange(e);
                onClose();
              }}
              className="w-full px-3 py-2 border border-fourth rounded bg-tertiary text-fifth text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tertiary"
            >
              <option value="Show All">[Show All]</option>
              {tours.map((tour) => (
                <option key={tour.tour} value={tour.tour}>
                  {tour.tour}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="space-y-2">
            <label htmlFor="group-filter-modal" className="block text-sm text-fifth font-medium">
              Filter by Group:
            </label>
            <select
              id="group-filter-modal"
              value={selectedGroup}
              onChange={(e) => {
                onGroupChange(e);
                onClose();
              }}
              disabled={isGroupDropdownDisabled}
              className={`w-full px-3 py-2 border border-fourth rounded text-fifth text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tertiary ${
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

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-fourth/20">
              <button
                onClick={() => {
                  onClearFilters();
                  onClose();
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-600/70 text-white text-sm font-medium rounded transition-colors focus:outline-none"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}