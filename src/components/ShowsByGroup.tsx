import React from 'react';

interface Performance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_tour: string | null;
  tour_id: string | null;
  venue_id: string;
}

interface ShowsByGroupProps {
  performances: Performance[];
  selectedGroup: string | null;
  onGroupClick: (group: string) => void;
}

export const ShowsByGroup: React.FC<ShowsByGroupProps> = ({
  performances,
  selectedGroup,
  onGroupClick
}) => {
  if (performances.length === 0) return null;

  return (
    <div className="h-full">
      <div className="bg-primary border border-fourth w-full h-full shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h3 className="text-sm font-semibold">Shows by Group</h3>
        </div>
        <div className="p-1 max-h-[350px] overflow-y-auto">
          <div>
            {Object.entries(
              performances.reduce((acc, show) => {
                const group = show.show_group || 'Unknown';
                acc[group] = (acc[group] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([groupA, countA], [groupB, countB]) => {
                // First sort by count (descending)
                if (countB !== countA) {
                  return countB - countA;
                }
                // Then by group name (alphabetically)
                return groupA.localeCompare(groupB);
              })
              .map(([group, count]) => (
                <div 
                  key={group} 
                  className={`text-[0.625rem] text-fifth px-2 flex justify-between cursor-pointer ${
                    selectedGroup === group ? 'bg-tertiary/40' : 'hover:bg-tertiary/40'
                  }`}
                  onClick={() => onGroupClick(group)}
                >
                  <span className='font-normal'>{group}</span>
                  <span className='font-medium'>{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
