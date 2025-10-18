import React from 'react';
import { CircleEllipsis, MoveRight } from 'lucide-react';

interface SegueSong {
    song_name: string;
    song_id: string;
    song_artwork?: string;
    category_canonid?: number;
}

interface SegueDestination {
    song_name: string;
    song_id: string;
    song_artwork?: string;
    count: number;
    category_canonid?: number;
}

interface Segue {
    songs: SegueSong[];
    count: number;
    category_canonid: number;
    category_artwork?: string;
    segue_key: string;
    sort_string: string;
    destinations?: SegueDestination[];
    instances?: Array<{
        entry_id: string;
        entry_show: string;
        entry_set: string;
        entry_setnum: number;
    }>;
    displayRank?: number | null;
    bgGroup?: number;
}

interface SegueTableRowProps {
    segue: Segue;
    index: number;
    rankedSegues: Segue[];
    isExpanded: boolean;
    onToggleExpanded: (segue: Segue) => void;
    onOpenSegueModal: (sourceSongName: string, destinationSongName: string) => void;
    cleanSongName: (songName: string) => string;
}

export function SegueTableRow({
    segue,
    index,
    rankedSegues,
    isExpanded,
    onToggleExpanded,
    onOpenSegueModal,
    cleanSongName
}: SegueTableRowProps) {
    const nextItem = rankedSegues[index + 1];
    const isTied = nextItem && segue.count === nextItem.count;

    return (
        <React.Fragment>
            <tr
                className={`${segue.bgGroup && segue.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                    } hover:bg-tertiary/40 transition-colors text-xs ${
                    !isTied && index < rankedSegues.length - 1 && !isExpanded ? 'border-b border-white/5' : ''
                }`}
            >
                <td className="pl-2 pr-1 w-[30px] text-center font-semibold text-[0.875rem] text-fifth">
                    {segue.displayRank !== null ? segue.displayRank : ''}
                </td>
                <td className="pl-2 text-fifth">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => onToggleExpanded(segue)}
                            className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                        >
                            {cleanSongName(segue.songs[0].song_name)}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onToggleExpanded(segue)}
                                className="text-fifth hover:text-tertiary transition-colors"
                            >
                                <CircleEllipsis className="w-4 h-4" />
                            </button>
                            {segue.songs[0].song_artwork && (
                                <img
                                    src={segue.songs[0].song_artwork}
                                    alt={`${segue.songs[0].song_name} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </td>
                <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                    {segue.count}
                </td>
            </tr>
            {isExpanded && (
                <tr className={`${segue.bgGroup && segue.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'} ${!isTied && index < rankedSegues.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <td colSpan={3} className="px-2 pb-2">
                        {segue.destinations && segue.destinations.length > 0 ? (
                            <div className="pl-8">
                                <table className="w-full">
                                    <tbody>
                                        {segue.destinations.map((dest) => {
                                            return (
                                                <tr
                                                    key={dest.song_id}
                                                    className="hover:bg-black/5 transition-colors"
                                                >
                                                    <td className="text-fifth pl-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <MoveRight className="text-red-500 w-3 h-3" />
                                                                <button
                                                                    onClick={() => onOpenSegueModal(
                                                                        segue.songs[0].song_name,
                                                                        dest.song_name
                                                                    )}
                                                                    className="font-trad text-fifth text-[0.875rem] leading-[0.75rem] hover:underline cursor-pointer"
                                                                >
                                                                    {cleanSongName(dest.song_name)}
                                                                </button>
                                                            </div>
                                                            {dest.song_artwork && (
                                                                <img
                                                                    src={dest.song_artwork}
                                                                    alt={`${dest.song_name} artwork`}
                                                                    className="w-4 h-4 rounded-full object-cover border border-secondary"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="w-[40px] text-center font-medium text-fifth text-[0.75rem] leading-[0.75rem] pr-2">
                                                        {dest.count}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-fifth text-xs pl-8 py-2">No destination data available</div>
                        )}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}

interface SegueTableProps {
    segues: Segue[];
    expandedRows: Set<string>;
    onToggleExpanded: (segue: Segue) => void;
    onOpenSegueModal: (sourceSongName: string, destinationSongName: string) => void;
    cleanSongName: (songName: string) => string;
}

export function SegueTable({
    segues,
    expandedRows,
    onToggleExpanded,
    onOpenSegueModal,
    cleanSongName
}: SegueTableProps) {
    // Calculate rankings with tie handling
    let currentRank = 1;
    let currentBgGroup = 0;
    const rankedSegues = segues.map((segue, index) => {
        let displayRank: number | null = null;

        if (index === 0 || segues[index - 1].count !== segue.count) {
            displayRank = currentRank;
            currentBgGroup++;
        }

        currentRank++;

        return { ...segue, displayRank, bgGroup: currentBgGroup };
    });

    return (
        <div className="overflow-x-auto relative">
            <table className="w-full border-collapse">
                <tbody>
                    {rankedSegues.map((segue, index) => {
                        const isExpanded = expandedRows.has(segue.segue_key);
                        
                        return (
                            <SegueTableRow
                                key={segue.segue_key}
                                segue={segue}
                                index={index}
                                rankedSegues={rankedSegues}
                                isExpanded={isExpanded}
                                onToggleExpanded={onToggleExpanded}
                                onOpenSegueModal={onOpenSegueModal}
                                cleanSongName={cleanSongName}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
