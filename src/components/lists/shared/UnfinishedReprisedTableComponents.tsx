import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveRight } from 'lucide-react';

interface PlaceholderItem {
    item_name: string;
    item_id: string;
    count: number;
    category_canonid?: number;
    category_artwork?: string;
    displayRank?: number | null;
    bgGroup?: number;
}

interface SandwichSong {
    song_name: string;
    song_id: string;
}

interface Sandwich {
    songs: SandwichSong[];
    count: number;
    category_canonid: number;
    category_artwork?: string;
    sandwich_key: string;
    sort_string: string;
    displayRank?: number | null;
    bgGroup?: number;
}

interface UnfinishedTableProps {
    items: PlaceholderItem[];
    cleanSongName: (songName: string) => string;
}

export function UnfinishedTable({ items, cleanSongName }: UnfinishedTableProps) {
    const navigate = useNavigate();

    // Calculate rankings with tie handling
    let currentRank = 1;
    let currentBgGroup = 0;
    const rankedItems = items.map((item, index) => {
        let displayRank: number | null = null;

        if (index === 0 || items[index - 1].count !== item.count) {
            displayRank = currentRank;
            currentBgGroup++;
        }

        currentRank++;

        return { ...item, displayRank, bgGroup: currentBgGroup };
    });

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full border-collapse">
                <tbody className="divide-y divide-white/5">
                    {rankedItems.map((item, index) => {
                        const nextItem = rankedItems[index + 1];
                        const showBorderBottom = nextItem && item.count === nextItem.count;
                        
                        return (
                            <tr
                                key={item.item_id}
                                className={`${item.bgGroup && item.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-xs ${
                                    showBorderBottom ? 'border-b border-white/10' : ''
                                }`}
                            >
                                <td className="pl-2 pr-1 w-[30px] text-center font-semibold text-[0.875rem] text-fifth">
                                    {item.displayRank !== null ? item.displayRank : ''}
                                </td>
                                <td className="pl-2 text-fifth">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => navigate(`/song/${item.item_id}`)}
                                            className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                        >
                                            {cleanSongName(item.item_name)}
                                        </button>
                                        {item.category_artwork && (
                                            <img
                                                src={item.category_artwork}
                                                alt={`${item.item_name} artwork`}
                                                className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                    {item.count}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

interface SandwichTableProps {
    sandwiches: Sandwich[];
    onOpenSandwichModal: (sandwichSongs: string[]) => void;
    cleanSongName: (songName: string) => string;
}

export function SandwichTable({ sandwiches, onOpenSandwichModal, cleanSongName }: SandwichTableProps) {
    // Calculate rankings with tie handling
    let currentRank = 1;
    let currentBgGroup = 0;
    const rankedSandwiches = sandwiches.map((sandwich, index) => {
        let displayRank: number | null = null;

        if (index === 0 || sandwiches[index - 1].count !== sandwich.count) {
            displayRank = currentRank;
            currentBgGroup++;
        }

        currentRank++;

        return { ...sandwich, displayRank, bgGroup: currentBgGroup };
    });

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full border-collapse">
                <tbody>
                    {rankedSandwiches.map((sandwich, index) => {
                        const nextItem = rankedSandwiches[index + 1];
                        const showBorderBottom = nextItem && sandwich.count === nextItem.count;
                        const showRegularBorder = !showBorderBottom && index < rankedSandwiches.length - 1;

                        return (
                            <tr
                                key={sandwich.sandwich_key}
                                className={`${sandwich.bgGroup && sandwich.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-xs ${
                                    showBorderBottom ? 'border-b border-black/20' : ''
                                    } ${showRegularBorder ? 'border-b border-white/5' : ''}`}
                            >
                                <td className="pl-2 pr-1 w-[30px] text-center font-semibold text-[0.875rem] text-fifth">
                                    {sandwich.displayRank !== null ? sandwich.displayRank : ''}
                                </td>
                                <td className="pl-2 text-fifth">
                                    <div
                                        className="w-full text-left pb-0.5 cursor-pointer"
                                        onClick={() => onOpenSandwichModal(sandwich.songs.map(s => s.song_name))}
                                        style={{
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'normal',
                                            whiteSpace: 'normal',
                                            hyphens: 'none'
                                        }}
                                    >
                                        {sandwich.songs.map((song, songIndex) => (
                                            <React.Fragment key={`${sandwich.sandwich_key}-${songIndex}`}>
                                                {songIndex > 0 && (
                                                    <MoveRight className="text-red-500 inline w-4 h-4 mr-1" style={{ verticalAlign: 'middle' }} />
                                                )}
                                                <span
                                                    className={`text-fifth text-[1rem] leading-[0.875rem] font-trad transition-colors table-link inline ${songIndex < sandwich.songs.length - 1 ? 'mr-1' : ''
                                                        }`}
                                                    style={{ verticalAlign: 'middle' }}
                                                >
                                                    {cleanSongName(song.song_name)}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </td>
                                <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                    {sandwich.count}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
