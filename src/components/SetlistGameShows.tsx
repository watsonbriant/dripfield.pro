import React from 'react';
import { Link } from 'react-router-dom';
import { ListMusic } from 'lucide-react';

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
            <div className="bg-primary border border-black rounded-lg p-3">
                <div className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-black mt-4">Loading show statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-primary border border-black rounded-lg p-3">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-flex items-center px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                    <ListMusic className="w-5 h-5 mr-2" />
                    <span>Show Statistics</span>
                </h2>
            </div>

            {gameShows.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-black">No shows found for this tour.</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full border-collapse min-w-max table-fixed">
                        <colgroup>
                            <col className="w-28" />
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
                            <tr className="bg-canvas border-y border-black/10">
                                <th className="px-4 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">Date</th>
                                <th className="px-4 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">Location</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Players</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">High Score</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Score</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg +/- Picks</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Total Songs Correct</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Songs Correct</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Total Sets Correct</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Sets Correct</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Opener Picks</th>
                                <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Closer Picks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {gameShows.map((show) => {
                                let bgColor = show.show_scored ? 'bg-canvas' : 'bg-primary';

                                return (
                                    <tr
                                        key={show.show_id}
                                        className={`${bgColor} hover:bg-black/10 transition-colors text-xs`}
                                    >
                                        <td className="px-4 py-0.5 text-black whitespace-nowrap">
                                            <span className="font-semibold">
                                                <Link
                                                    to={`/setlistgame/${show.show_id}`}
                                                    className="hover:text-[#a9682e] transition-colors table-link"
                                                >
                                                    {formatDate(show.show_date)}
                                                </Link>
                                            </span>
                                        </td>
                                        <td className="px-4 py-0.5 text-black/70 whitespace-nowrap">
                                            {show.show_venue_location}
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.playerCount !== undefined ? show.playerCount : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black font-semibold text-xs">
                                                {show.show_scored && show.highScore !== undefined ? show.highScore : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.averageScore !== undefined ? show.averageScore.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className={`text-xs ${show.show_scored && show.averageOverUnder > 0 ? 'text-red-600' : show.show_scored && show.averageOverUnder < 0 ? 'text-green-600' : 'text-black/70'}`}>
                                                {show.show_scored && show.averageOverUnder !== undefined ? (show.averageOverUnder.toFixed(2) > 0 ? '+' : '') + show.averageOverUnder.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.totalCorrectSongs !== undefined ? show.totalCorrectSongs : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.averageCorrectSongs !== undefined ? show.averageCorrectSongs.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.totalCorrectSets !== undefined ? show.totalCorrectSets : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.averageCorrectSets !== undefined ? show.averageCorrectSets.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
                                                {show.show_scored && show.usersPickedOpener !== undefined ? show.usersPickedOpener : '-'}
                                            </span>
                                        </td>
                                        <td className="px-0.5 py-0.5 text-center">
                                            <span className="text-black/70 text-xs">
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