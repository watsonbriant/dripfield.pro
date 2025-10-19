import { ChevronUp, ChevronDown } from 'lucide-react';
import { PlayerStats, SortField, SortDirection } from './types';

interface StandingsTableProps {
  standings: PlayerStats[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  user?: { id: string } | null;
}

export function StandingsTable({ 
  standings, 
  sortField, 
  sortDirection, 
  onSort, 
  user 
}: StandingsTableProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 inline-block ml-1 text-fifth" /> :
      <ChevronDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max table-fixed">
        <colgroup>
          <col className="w-12" /> {/* Rank column - narrow */}
          <col className="w-44" /> {/* User column - flexible but with minimum width */}
          <col className="w-[65px] min-w-[65px]" /> {/* Total Points */}
          <col className="w-[65px] min-w-[65px]" /> {/* Shows Played */}
 **<col className="w-[65px] min-w-[65px]" /> {/* Points Per Show */}
          <col className="w-[65px] min-w-[65px]" /> {/* Songs Correctly Picked */}
          <col className="w-[65px] min-w-[65px]" /> {/* Sets Correctly Picked */}
          <col className="w-[65px] min-w-[65px]" /> {/* Show Openers Picked */}
          <col className="w-[65px] min-w-[65px]" /> {/* Show Closers Picked */}
        </colgroup>
        <thead>
          <tr className="bg-canvas border-y border-secondary/10">
            <th className="px-1 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap text-center">
              Rank
            </th>
            <th className="px-3 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap">
              <button 
                className="flex items-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded"
                onClick={() => onSort('username')}
              >
                <span>User</span>
                {getSortIcon('username')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('totalPoints')}
              >
                <span>Total Points</span>
                {getSortIcon('totalPoints')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('showsPlayed')}
              >
                <span>Shows Played</span>
                {getSortIcon('showsPlayed')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('avgPointsPerShow')}
              >
                <span>Points Per Show</span>
                {getSortIcon('avgPointsPerShow')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('songsPicked')}
              >
                <span>Songs Picked</span>
                {getSortIcon('songsPicked')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('setsPicked')}
              >
                <span>Sets Picked</span>
                {getSortIcon('setsPicked')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('showOpenersPicked')}
              >
                <span>Openers Picked</span>
                {getSortIcon('showOpenersPicked')}
              </button>
            </th>
            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
              <button 
                className="flex items-center justify-center gap-1 cursor-pointer hover:bg-black/10 px-2 py-0.5 rounded mx-auto"
                onClick={() => onSort('showClosersPicked')}
              >
                <span>Closers Picked</span>
                {getSortIcon('showClosersPicked')}
              </button>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-black/5">
          {standings.map((player, index) => (
            <tr 
              key={player.userId} 
              className={`
                ${user && player.userId === user.id 
                  ? 'bg-tertiary/80' 
                  : index % 2 === 0 
                    ? 'bg-primary' 
                    : 'bg-canvas'
                } 
                hover:bg-tertiary/40 transition-colors
              `}
            >
              <td className="px-1 py-0.5 text-xs text-center font-medium text-fifth">
                {index + 1}
              </td>
              <td className="px-3 py-0.5 whitespace-normal font-medium text-xs text-fifth">
                {player.username}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-medium text-fourth">
                {player.totalPoints}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.showsPlayed}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.avgPointsPerShow.toFixed(2)}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.songsPicked}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.setsPicked}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.showOpenersPicked}
              </td>
              <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-light text-fifth">
                {player.showClosersPicked}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
