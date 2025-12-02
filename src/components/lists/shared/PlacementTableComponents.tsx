import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface PlacementSong {
    song_name: string;
    song_id: string;
    times_played: number;
    category_canonid: number;
    category_artwork?: string;
    displayRank?: number | null;
    bgGroup?: number;
}

interface PlacementTableProps {
    songs: PlacementSong[];
}

export function PlacementTable({ songs }: PlacementTableProps) {
    const navigate = useNavigate();

    // Calculate rankings with tie handling
    let currentRank = 1;
    let currentBgGroup = 0;
    const rankedSongs = songs.map((song, index) => {
        let displayRank: number | null = null;
        
        // Show rank if it's the first song or if the count is different from previous
        if (index === 0 || songs[index - 1].times_played !== song.times_played) {
            displayRank = currentRank;
            currentBgGroup++; // Change background group when rank changes
        }
        
        currentRank++;
        
        return { ...song, displayRank, bgGroup: currentBgGroup };
    });

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full border-collapse">
                <tbody className="divide-y divide-white/5">
                    {rankedSongs.map((song) => (
                        <tr
                            key={song.song_id}
                            className={`${song.bgGroup && song.bgGroup % 2 === 0 ? 'bg-primary' : 'bg-primary'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                        >
                            <td className="pl-2 pr-1 w-[24px] text-center font-semibold text-[0.625rem] text-fifth">
                                {song.displayRank !== null ? song.displayRank : ''}
                            </td>
                            <td className="pl-2 text-fifth">
                                <div className="flex items-center justify-between">
                                    <Link
                                        to={`/song/${song.song_id}`}
                                        className="font-medium text-fifth hover:underline cursor-pointer text-[0.625rem] leading-[0.75rem] text-left"
                                    >
                                        {song.song_name}
                                    </Link>
                                    {song.category_artwork && (
                                        <img
                                            src={song.category_artwork}
                                            alt={`${song.song_name} artwork`}
                                            className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </td>
                            <td className="pr-2 w-[30px] text-center text-[0.625rem] font-medium text-fifth">
                                {song.times_played}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface PlacementSectionProps {
    title: string;
    bgColor: string;
    songs: PlacementSong[];
}

export function PlacementSection({ title, bgColor, songs }: PlacementSectionProps) {
    return (
        <div>
            <h3 className="text-sm font-medium text-white px-2 py-0.5" style={{ backgroundColor: bgColor }}>
                {title}
            </h3>
            <PlacementTable songs={songs} />
        </div>
    );
}
