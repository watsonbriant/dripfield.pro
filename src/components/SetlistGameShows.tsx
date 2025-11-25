import React from 'react';
import { Link } from 'react-router-dom';

interface GameShow {
    show_id: string;
    show_date: string;
    show_subvenue: string;
    show_venue_location: string;
    show_time: string;
    show_tour: string;
    show_canonid: string;
    show_subvenue_venue: string;
    show_detail?: string | null;
    show_scored?: boolean;
    playerCount?: number;
    highScore?: number;
    averageScore?: number;
    averageOverUnder?: number;
    totalCorrectSongs?: number;
    averageCorrectSongs?: number;
    totalCorrectSets?: number;
    averageCorrectSets?: number;
    usersPickedOpener?: number;
    usersPickedCloser?: number;
}

interface SetlistGameShowsProps {
    gameShows: GameShow[];
    loading: boolean;
}

export function SetlistGameShows({ gameShows, loading }: SetlistGameShowsProps) {
    // Format date for display (MM.DD.YY)
    const formatDate = (dateString: string) => {
        return dateString
            .split('-')
            .slice(1)
            .concat(dateString.substring(2, 4))
            .join('.');
    };

    if (loading) {
        return (
            <div className="bg-primary border border-fourth rounded-lg p-3">
                <div className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-fifth mt-4">Loading show statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-primary border border-fourth">
            <div className="bg-tertiary text-fifth px-2 py-0.5">
                <h2 className="text-sm font-semibold">
                    Show Statistics
                </h2>
            </div>

            {gameShows.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-fifth">No shows found for this tour.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-max table-fixed">
                        <colgroup>
                            <col className="w-20" />
                            <col className="w-44" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                            <col className="w-[65px] min-w-[65px]" />
                        </colgroup>
                        <thead>
                            <tr className="bg-canvas border-y border-white/10">
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Date</th>
                                <th className="px-2 py-1 text-left text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Location</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Players</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">High Score</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Score</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg +/- Picks</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Total Songs Correct</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Songs Correct</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Total Sets Correct</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Avg Sets Correct</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Opener Picks</th>
                                <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth">Closer Picks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gameShows.map((show) => {
                                let bgColor = show.show_scored ? 'bg-canvas' : 'bg-primary';

                                return (
                                    <tr
                                        key={show.show_id}
                                        className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
                                    >
                                        <td className="px-2 text-center whitespace-nowrap">
                                            <span className="font-medium text-fifth">
                                                <Link
                                                    to={`/setlistgame/${show.show_id}`}
                                                    className="transition-colors table-link"
                                                >
                                                    {formatDate(show.show_date)}
                                                </Link>
                                            </span>
                                        </td>
                                        <td className="px-2 text-fifth font-light whitespace-nowrap">
                                            {show.show_venue_location}
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.playerCount !== undefined ? show.playerCount : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fourth font-medium">
                                                {show.show_scored && show.highScore !== undefined ? show.highScore : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageScore !== undefined ? show.averageScore.toFixed(2) : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className={`font-light ${show.show_scored && show.averageOverUnder > 0 ? 'text-red-600' : show.show_scored && show.averageOverUnder < 0 ? 'text-green-600' : 'text-fifth'}`}>
                                                {show.show_scored && show.averageOverUnder !== undefined ? (show.averageOverUnder.toFixed(2) > 0 ? '+' : '') + show.averageOverUnder.toFixed(2) : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.totalCorrectSongs !== undefined ? show.totalCorrectSongs : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageCorrectSongs !== undefined ? show.averageCorrectSongs.toFixed(2) : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.totalCorrectSets !== undefined ? show.totalCorrectSets : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.averageCorrectSets !== undefined ? show.averageCorrectSets.toFixed(2) : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.usersPickedOpener !== undefined ? show.usersPickedOpener : ''}
                                            </span>
                                        </td>
                                        <td className="px-2 text-center">
                                            <span className="text-fifth font-light">
                                                {show.show_scored && show.usersPickedCloser !== undefined ? show.usersPickedCloser : ''}
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