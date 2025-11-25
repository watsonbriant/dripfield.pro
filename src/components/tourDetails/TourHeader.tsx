import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Trophy } from 'lucide-react';

interface TourHeaderProps {
    tourName?: string;
    totalShows: number;
    totalPlayers: number;
    tourWinners: { username: string, score: number }[];
}

export function TourHeader({ tourName, totalShows, totalPlayers, tourWinners }: TourHeaderProps) {
    return (
        <div className="bg-primary border border-fourth">
            <div className="bg-fourth text-white px-2 py-0.5 flex justify-between items-center">
                <h2 className="text-sm font-medium flex items-center gap-2">
                    <Link to="/setlistgame" className="hover:underline transition-colors flex items-center bg-canvas border border-fourth text-fifth px-2 rounded">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        <span>Echo of a Show</span>
                    </Link>
                    {tourName && (
                        <>
                            <ChevronRight className="w-4 h-4 text-white" />
                            <span className="bg-primary border border-fourth text-fifth px-2 rounded">
                                {tourName}
                            </span>
                        </>
                    )}
                </h2>
            </div>
            <div className="px-2 py-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Left column: Tour stats */}
                <div>
                    <div className="flex gap-3 justify-center md:justify-start">
                        <div className="flex items-center">
                            <span className="text-fifth font-light text-xs">Shows:</span>
                            <span className="ml-1 text-xs font-medium text-fifth">{totalShows}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-fifth font-light text-xs">Players:</span>
                            <span className="ml-1 text-xs font-medium text-fifth">{totalPlayers}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right column: Tour winners */}
                <div className="flex flex-col items-center md:items-end">
                    {tourWinners.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-fifth" />
                            <span className="text-[0.625rem] font-light text-fifth">
                                <span className="font-medium">Tour Champion{tourWinners.length > 1 ? 's' : ''}:</span>
                                {' '}
                                {tourWinners.map((winner, idx) => (
                                    <span key={idx} className="text-fourth font-medium bg-tertiary px-1.5 py-0.5 rounded border border-fourth ml-2">
                                        {winner.username}
                                        {idx < tourWinners.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

