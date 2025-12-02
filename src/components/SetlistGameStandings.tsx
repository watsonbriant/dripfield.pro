import { useState } from 'react';
import { SetlistGameStandingsProps, SortField, SortDirection } from './SetlistGameStandings/types';
import { useStandingsData } from './SetlistGameStandings/useStandingsData';
import { StandingsTable } from './SetlistGameStandings/StandingsTable';
import { LoadingState } from './SetlistGameStandings/LoadingState';
import { EmptyState } from './SetlistGameStandings/EmptyState';

export function SetlistGameStandings({ activeLeague, user }: SetlistGameStandingsProps) {
  const [sortField, setSortField] = useState<SortField>('totalPoints');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { standings, loading } = useStandingsData(activeLeague, sortField, sortDirection);
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5 flex gap-2 items-center">
        <h2 className="text-sm font-semibold">
          Standings
        </h2>
        <span className="text-fifth font-medium text-[0.625rem] bg-fourth text-white border border-fourth rounded px-1 whitespace-nowrap">
          {activeLeague}
        </span>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : standings.length === 0 ? (
        <EmptyState />
      ) : (
        <StandingsTable 
          standings={standings}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          user={user}
        />
      )}
    </div>
  );
}