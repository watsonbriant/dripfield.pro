import { useState } from 'react';
import { Trophy } from 'lucide-react';
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
    <div className="bg-primary border border-secondary rounded-lg p-3 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
          <Trophy className="w-5 h-5 mr-2" />
          <span>Standings</span>
        </h2>
        <span className="px-3 py-1 text-sm font-medium rounded-lg bg-secondary text-fifth border border-secondary">
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