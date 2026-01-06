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
    <div className="bg-primary border border-fourth pb-0.5 w-full shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5 flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          Filter by Group
        </h2>
        {selectedGroups.length > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 bg-white text-red-500 px-1 border border-fourth hover:bg-red-500 hover:text-white transition-colors text-xs font-medium"
          >
            <span>Clear</span>
            <Filter className="w-3 h-3" />
          </button>
        )}
      </div>
      <div>
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
          <div className="space-y-0.5">
            {groups.map((groupData) => (
              <div key={groupData.group} className="text-fifth text-xs flex items-center">
                <div className="flex-1 text-left leading-tight mx-2 font-light">
                  <button
                    onClick={() => onToggleGroup(groupData.group)}
                    className="font-medium hover:underline transition-colors"
                  >
                    {groupData.group}
                  </button>
                  {' '}
                  <span className="font-light ml-2 text-[0.625rem] leading-[0.75rem]">({groupData.count})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
