import React from 'react';
import { PlayerStats } from '../../hooks/useSetlistGameShowData';

interface StandingsTableProps {
  standings: PlayerStats[];
  user: any;
  onViewOtherUserSubmission: (userId: string, username: string) => void;
}

export function StandingsTable({ standings, user, onViewOtherUserSubmission }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-medium">
            Standings
          </h2>
        </div>
        <div className="px-2 py-1 text-center">
          <p className="text-fifth text-[0.625rem]">No standings available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-fourth">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-medium">
          Standings
        </h2>
      </div>

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
            <tr className="bg-canvas border-y border-white/10">
              <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">
                Rank
              </th>
              <th className="px-2 py-1 text-left text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">
                User
              </th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                Total Points
              </th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                Songs Picked
              </th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                Sets Picked
              </th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                Show Opener
              </th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                Show Closer
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr
                key={player.userId}
                className={`
                  ${user && player.userId === user.id
                    ? 'bg-tertiary/80'
                    : 'bg-primary'
                  } 
                  hover:bg-tertiary/40 transition-colors text-[0.625rem]
                `}
              >
                <td className="px-2 text-center font-medium text-fifth">
                  {index + 1}
                </td>
                <td className="px-2 whitespace-normal font-medium text-fifth">
                  <button
                    onClick={() => onViewOtherUserSubmission(player.userId, player.username)}
                    className="hover:underline transition-colors focus:outline-none text-left"
                  >
                    {player.username}
                  </button>
                </td>
                <td className="px-2 whitespace-nowrap text-center font-medium text-fourth">
                  {player.totalPoints}
                </td>
                <td className="px-2 whitespace-nowrap font-light text-center text-fifth">
                  {player.songsPicked}
                </td>
                <td className="px-2 whitespace-nowrap font-light text-center text-fifth">
                  {player.setsPicked}
                </td>
                <td className="px-2 whitespace-nowrap text-center">
                  {player.showOpenerPicked ? (
                    <div className="w-3 h-3 rounded-full bg-green-600 mx-auto" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-red-600 mx-auto" />
                  )}
                </td>
                <td className="px-2 whitespace-nowrap text-center">
                  {player.showCloserPicked ? (
                    <div className="w-3 h-3 rounded-full bg-green-600 mx-auto" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-red-600 mx-auto" />
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
