import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    cleanSongName: (songName: string) => string;
}

export function PlacementTable({ songs, cleanSongName }: PlacementTableProps) {
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
                            className={`${song.bgGroup && song.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                        >
                            <td className="pl-2 pr-1 w-[30px] text-center font-semibold text-[0.875rem] text-fifth">
                                {song.displayRank !== null ? song.displayRank : ''}
                            </td>
                            <td className="pl-2 text-fifth">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => navigate(`/song/${song.song_id}`)}
                                        className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                    >
                                        {cleanSongName(song.song_name)}
                                    </button>
                                    {song.category_artwork && (
                                        <img
                                            src={song.category_artwork}
                                            alt={`${song.song_name} artwork`}
                                            className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
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
    cleanSongName: (songName: string) => string;
}

export function PlacementSection({ title, bgColor, songs, cleanSongName }: PlacementSectionProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#047857]">
                {title}
            </h3>
            <PlacementTable songs={songs} cleanSongName={cleanSongName} />
        </div>
    );
}
