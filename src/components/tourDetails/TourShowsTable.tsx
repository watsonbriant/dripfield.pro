import { Link } from 'react-router-dom';
import { GameShow } from '../../hooks/useTourDetails';
import { formatDate, getOverUnderTextColor, formatOverUnderValue } from '../../utils/tourDetailsUtils';

interface TourShowsTableProps {
    gameShows: GameShow[];
}

export function TourShowsTable({ gameShows }: TourShowsTableProps) {
    return (
        <div className="bg-primary border border-fourth shadow-xl">
            <div className="bg-tertiary text-fifth px-2 py-0.5">
                <h2 className="text-sm font-semibold">
                    Shows
                </h2>
            </div>

            {gameShows.length === 0 ? (
                <div className="px-2 py-1 text-center">
                    <p className="text-fifth text-[0.625rem]">No shows found for this tour.</p>
                </div>
            ) : (
                <div className="overflow-x-auto shadow-xl">
                    <table className="w-full border-collapse">
                        <colgroup>
                            <col className="w-16" />
                            <col />
                            <col className="min-w-[56px]" />
                            <col className="min-w-[56px]" />
                            <col className="min-w-[56px]" />
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
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Date</th>
                                <th className="px-2 py-0.5 text-left text-xs leading-[0.75rem] font-medium text-fifth">Location</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Players</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">High Score</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Score</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg +/- Picks</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Total Songs Correct</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Songs Correct</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Total Sets Correct</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Sets Correct</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Opener Picks</th>
                                <th className="px-2 py-0.5 text-center text-xs leading-[0.75rem] font-medium text-fifth">Closer Picks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gameShows.map((show) => {
                                return (
                                    <tr
                                        key={show.show_id}
                                        className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
                                    >
                                        <td className="w-16 px-2 text-center whitespace-nowrap">
                                            <span className="font-medium text-fifth">
                                                <Link
                                                    to={`/setlistgame/${show.show_id}`}
                                                    className="hover:underline transition-colors table-link"
                                                >
                                                    {formatDate(show.show_date)}
                                                </Link>
                                            </span>
                                        </td>
                                        <td className="px-2 text-fifth font-light whitespace-nowrap">
                                            {show.show_venue_location}
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.playerCount !== undefined ? show.playerCount : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fourth font-medium">
                                                {show.show_scored && show.highScore !== undefined ? show.highScore : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageScore !== undefined ? show.averageScore.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className={`font-light ${getOverUnderTextColor(show.averageOverUnder, show.show_scored || false)}`}>
                                                {formatOverUnderValue(show.averageOverUnder, show.show_scored || false)}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.totalCorrectSongs !== undefined ? show.totalCorrectSongs : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageCorrectSongs !== undefined ? show.averageCorrectSongs.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.totalCorrectSets !== undefined ? show.totalCorrectSets : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageCorrectSets !== undefined ? show.averageCorrectSets.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.usersPickedOpener !== undefined ? show.usersPickedOpener : '-'}
                                            </span>
                                        </td>
                                        <td className="min-w-[56px] px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.usersPickedCloser !== undefined ? show.usersPickedCloser : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
