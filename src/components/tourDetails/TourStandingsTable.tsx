import { PlayerStats } from '../../hooks/useTourDetails';

interface TourStandingsTableProps {
    standings: PlayerStats[];
    currentUserId?: string;
}

export function TourStandingsTable({ standings, currentUserId }: TourStandingsTableProps) {
    if (standings.length === 0) {
        return (
            <div className="bg-primary border border-fourth">
                <div className="bg-tertiary text-fifth px-2 py-0.5">
                    <h2 className="text-sm font-semibold">
                        Standings
                    </h2>
                </div>
                <div className="px-2 py-1 text-center">
                    <p className="text-fifth text-[0.625rem]">No standings available yet for this tour.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-primary border border-fourth">
            <div className="bg-tertiary text-fifth px-2 py-0.5">
                <h2 className="text-sm font-semibold">
                    Standings
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <colgroup>
                        <col className="w-12" />
                        <col />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                        <col className="min-w-[56px]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-canvas border-y border-white/10">
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Rank
                            </th>
                            <th className="px-2 py-0.5 text-left text-xs leading-[0.75rem] font-medium text-fifth">
                                User
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Total Points
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Shows Played
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Points Per Show
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Songs Picked
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Sets Picked
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Openers
                            </th>
                            <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">
                                Closers
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((player, index) => (
                            <tr
                                key={player.userId}
                                className={`
                                    ${currentUserId && player.userId === currentUserId
                                    ? 'bg-tertiary/80'
                                    : 'bg-primary'
                                    } 
                                    hover:bg-tertiary/40 transition-colors text-[0.625rem]
                                `}
                            >
                                <td className="w-12 px-2 text-center font-medium text-fifth whitespace-nowrap">
                                    {index + 1}
                                </td>
                                <td className="px-2 whitespace-normal font-medium text-fifth">
                                    {player.username}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-medium text-fourth">
                                    {player.totalPoints}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.showsPlayed}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.avgPointsPerShow.toFixed(2)}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.songsPicked}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.setsPicked}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.showOpenersPicked}
                                </td>
                                <td className="min-w-[56px] px-2 whitespace-nowrap text-center font-light text-fifth">
                                    {player.showClosersPicked}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
