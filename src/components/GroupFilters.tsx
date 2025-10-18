import React from 'react';
import { Filter } from 'lucide-react';

interface GroupCount {
  group: string;
  count: number;
}

interface GroupFiltersProps {
  groups: GroupCount[];
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function GroupFilters({ 
  groups, 
  selectedGroups, 
  onToggleGroup, 
  onClearFilters, 
  loading 
}: GroupFiltersProps) {
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
          Filter by Group
        </h2>
        {selectedGroups.length > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-lg border border-secondary hover:bg-red-600 transition-colors text-xs font-semibold"
          >
            <span>Clear</span>
            <Filter className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {loading ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-fifth text-xs text-center py-2">No groups found</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((groupData) => (
              <button
                key={groupData.group}
                onClick={() => onToggleGroup(groupData.group)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                  selectedGroups.includes(groupData.group)
                    ? 'bg-tertiary text-fifth hover:underline border border-secondary'
                    : 'bg-canvas text-fifth hover:underline border border-secondary'
                }`}
              >
                {groupData.group} <span className="font-light">({groupData.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
