import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
}

export function UnfinishedTable({ items }: UnfinishedTableProps) {
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
                                className={`${item.bgGroup && item.bgGroup % 2 === 0 ? 'bg-primary' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-xs ${
                                    showBorderBottom ? 'border-b border-white/10' : ''
                                }`}
                            >
                                <td className="pl-2 pr-1 w-[24px] text-center font-semibold text-[0.625rem] text-fifth">
                                    {item.displayRank !== null ? item.displayRank : ''}
                                </td>
                                <td className="pl-2 text-fifth">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            to={`/song/${item.item_id}`}
                                            className="font-medium text-fifth hover:underline cursor-pointer text-[0.625rem] leading-[0.75rem] text-left"
                                        >
                                            {item.item_name}
                                        </Link>
                                        {item.category_artwork && (
                                            <img
                                                src={item.category_artwork}
                                                alt={`${item.item_name} artwork`}
                                                className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="pr-2 w-[30px] text-center text-[0.625rem] font-medium text-fifth">
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
}

export function SandwichTable({ sandwiches, onOpenSandwichModal }: SandwichTableProps) {
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
                                className={`${sandwich.bgGroup && sandwich.bgGroup % 2 === 0 ? 'bg-primary' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-xs ${
                                    showBorderBottom ? 'border-b border-black/20' : ''
                                    } ${showRegularBorder ? 'border-b border-white/5' : ''}`}
                            >
                                <td className="pl-2 pr-1 w-[24px] text-center font-semibold text-[0.625rem] text-fifth">
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
                                                    <MoveRight className="text-red-500 inline w-3.5 h-3.5 mr-1" style={{ verticalAlign: 'middle' }} />
                                                )}
                                                <span
                                                    className={`text-fifth font-medium hover:underline cursor-pointer text-[0.625rem] leading-[0.75rem] text-left transition-colors table-link inline ${songIndex < sandwich.songs.length - 1 ? 'mr-1' : ''
                                                        }`}
                                                    style={{ verticalAlign: 'middle' }}
                                                >
                                                    {song.song_name}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </td>
                                <td className="pr-2 w-[30px] text-center text-[0.625rem] font-medium text-fifth">
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
