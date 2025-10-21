import React from 'react';
import { Trophy } from 'lucide-react';

interface TourInfoCardProps {
    tourName?: string;
    totalShows: number;
    totalPlayers: number;
    tourWinners: { username: string, score: number }[];
}

export function TourInfoCard({ tourName, totalShows, totalPlayers, tourWinners }: TourInfoCardProps) {
    return (
        <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                    <h1 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
                        {tourName}
                    </h1>
                    <div className="flex gap-3">
                        <div className="flex items-center">
                            <span className="text-fifth font-light text-sm">Shows:</span>
                            <span className="ml-1 mr-1 text-sm font-medium text-fifth">{totalShows}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-fifth font-light text-sm">Players:</span>
                            <span className="ml-1 text-sm font-medium text-fifth">{totalPlayers}</span>
                        </div>
                    </div>
                </div>

                {tourWinners.length > 0 && (
                    <div className="mt-4 md:mt-0">
                        <div className="bg-tertiary/40 rounded-md p-3 border border-tertiary">
                            <div className="flex items-center">
                                <Trophy className="w-5 h-5 text-fifth mr-2" />
                                <span className="font-semibold text-fifth mr-2">
                                    Tour Champion{tourWinners.length > 1 ? 's' : ''}: 
                                </span>
                                <div className="ml-1 flex flex-wrap">
                                    {tourWinners.map((winner, idx) => (
                                        <span key={idx} className="text-fourth font-semibold">
                                            {winner.username}
                                            {idx < tourWinners.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
