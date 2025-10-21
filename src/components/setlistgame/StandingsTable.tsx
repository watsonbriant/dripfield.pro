import React from 'react';
import { Award } from 'lucide-react';
import { PlayerStats } from '../../hooks/useSetlistGameShowData';

interface StandingsTableProps {
  standings: PlayerStats[];
  user: any;
  onViewOtherUserSubmission: (userId: string, username: string) => void;
}

export function StandingsTable({ standings, user, onViewOtherUserSubmission }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-3 gap-2">
          <Award className="w-5 h-5 text-fifth" />
          <span>Standings</span>
        </h2>
        <div className="text-center py-8">
          <p className="text-fifth">No standings available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-3 gap-2">
        <Award className="w-5 h-5 text-fifth" />
        <span>Standings</span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max table-fixed"> 
          <colgroup>
            <col className="w-12" />
            <col className="w-44" />
            <col className="w-[65px] min-w-[65px]" />
            <col className="w-[65px] min-w-[65px]" />
            <col className="w-[65px] min-w-[65px]" />
            <col className="w-[65px] min-w-[65px]" />
            <col className="w-[65px] min-w-[65px]" />
          </colgroup>
          <thead>
            <tr className="bg-canvas border-y border-secondary/10">
              <th className="px-1 py-2 text-left text-xs font-semibold text-fifth whitespace-nowrap text-center">
                Rank
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-fifth whitespace-nowrap">
                User
              </th>
              <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                Total Points
              </th>
              <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                Songs Picked
              </th>
              <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                Sets Picked
              </th>
              <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                Show Opener
              </th>
              <th className="px-0.5 py-2 text-center text-xs font-semibold text-fifth">
                Show Closer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {standings.map((player, index) => (
              <tr
                key={player.userId}
                className={`
                  ${user && player.userId === user.id
                    ? 'bg-tertiary/80 text-fifth'
                    : index % 2 === 0
                      ? 'bg-primary'
                      : 'bg-canvas'
                  } 
                  hover:bg-tertiary/40 transition-colors
                `}
              >
                <td className="px-1 py-0.5 text-xs text-center font-medium"
                  style={{ color: 'black' }}>
                  {index + 1}
                </td>
                <td className="px-3 py-0.5 whitespace-normal font-medium text-xs"
                  style={{ color: 'black' }}>
                  <button
                    onClick={() => onViewOtherUserSubmission(player.userId, player.username)}
                    className="hover:underline transition-colors focus:outline-none"
                  >
                    {player.username}
                  </button>
                </td>
                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-medium"
                  style={{ color: '#8e6c7a' }}>
                  {player.totalPoints}
                </td>
                <td className="px-0.5 py-0.5 whitespace-nowrap font-light text-xs text-center"
                  style={{ color: 'black' }}>
                  {player.songsPicked}
                </td>
                <td className="px-0.5 py-0.5 whitespace-nowrap font-light text-xs text-center"
                  style={{ color: 'black' }}>
                  {player.setsPicked}
                </td>
                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center">
                  {player.showOpenerPicked ? (
                    <div className="w-4 h-4 rounded-full bg-green-600 mx-auto" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-red-600 mx-auto" />
                  )}
                </td>
                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center">
                  {player.showCloserPicked ? (
                    <div className="w-4 h-4 rounded-full bg-green-600 mx-auto" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-red-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
