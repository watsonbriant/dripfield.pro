import React from 'react';
import { Trophy } from 'lucide-react';
import { PlayerStats } from '../../hooks/useTourDetails';

interface TourStandingsTableProps {
    standings: PlayerStats[];
    currentUserId?: string;
}

export function TourStandingsTable({ standings, currentUserId }: TourStandingsTableProps) {
    return (
        <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex items-center gap-2">
                <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
                    <Trophy className="w-5 h-5 mr-2" />
                    <span>Standings</span>
                </h2>
            </div>

            {standings.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-fifth">No standings available yet for this tour.</p>
                </div>
            ) : (
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
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                        </colgroup>
                        <thead>
                            <tr className="bg-canvas border-y border-secondary/10">
                                <th className="px-1 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap text-center">
                                    Rank
                                </th>
                                <th className="px-3 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap">
                                    User
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Total Points
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Shows Played
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Points Per Show
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Songs Picked
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Sets Picked
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Openers
                                </th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                    Closers
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {standings.map((player, index) => (
                                <tr
                                    key={player.userId}
                                    className={`
                                        ${currentUserId && player.userId === currentUserId
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
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.showsPlayed}
                                    </td>
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.avgPointsPerShow.toFixed(2)}
                                    </td>
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.songsPicked}
                                    </td>
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.setsPicked}
                                    </td>
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.showOpenersPicked}
                                    </td>
                                    <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                        {player.showClosersPicked}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
