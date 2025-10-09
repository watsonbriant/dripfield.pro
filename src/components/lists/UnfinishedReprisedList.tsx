import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlaceholderItem {
    item_name: string;
    item_id: string;
    count: number;
    category_canonid?: number;
    category_artwork?: string;
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
}

interface UnfinishedReprisedListProps {
    listId: string;
    onProgressUpdate: (progress: number) => void;
}

const cleanSongName = (songName: string): string => {
    return songName
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u')
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        .replace(/∆/g, 'a');
};

export function UnfinishedReprisedList({ listId, onProgressUpdate }: UnfinishedReprisedListProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [container1Data, setContainer1Data] = useState<PlaceholderItem[]>([]);
    const [container2Data, setContainer2Data] = useState<Sandwich[]>([]);
    const [container3Data, setContainer3Data] = useState<PlaceholderItem[]>([]);
    const [container4Data, setContainer4Data] = useState<PlaceholderItem[]>([]);

    useEffect(() => {
        fetchAllData();
    }, [listId]);

    async function fetchAllData() {
        try {
            onProgressUpdate(10);

            // Placeholder data for now
            await fetchContainer1Data();
            await fetchContainer2Data();
            await fetchContainer3Data();
            await fetchContainer4Data();

            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching data:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

    async function fetchContainer1Data() {
        try {
            const allData = [];
            let from = 0;
            const batchSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_song,
                        songs!inner(
                            song_id,
                            song_category,
                            categories!inner(
                                category_canonid,
                                category_artwork
                            )
                        ),
                        shows!inner(
                            show_group,
                            show_canonid
                        )
                    `)
                    .eq('shows.show_group', 'Goose')
                    .not('shows.show_canonid', 'is', null)
                    .eq('entry_short', 'unfinished')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            const unfinishedCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
                const songName = entry.entry_song;
                if (!acc[songName]) {
                    acc[songName] = {
                        item_name: songName,
                        item_id: entry.songs.song_id,
                        count: 1,
                        category_canonid: entry.songs.categories.category_canonid,
                        category_artwork: entry.songs.categories.category_artwork
                    };
                } else {
                    acc[songName].count++;
                }
                return acc;
            }, {});

            const processedUnfinished = Object.values(unfinishedCounts)
                .sort((a: any, b: any) => {
                    if (b.count !== a.count) {
                        return b.count - a.count;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.item_name.localeCompare(b.item_name);
                })
                .slice(0, 25);

            setContainer1Data(processedUnfinished);
        } catch (error) {
            console.error('Error fetching unfinished songs:', error);
        }
    }

    async function fetchContainer2Data() {
        try {
            const allData = [];
            let from = 0;
            const batchSize = 1000;
            let hasMore = true;

            // Fetch all setlist entries for shows with canonid
            while (hasMore) {
                const { data, error } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_id,
                        entry_song,
                        entry_show,
                        entry_set,
                        entry_setnum,
                        entry_short,
                        songs!inner(
                            song_id,
                            song_category,
                            categories!inner(
                                category_canonid,
                                category_artwork
                            )
                        ),
                        shows!inner(
                            show_group,
                            show_canonid
                        )
                    `)
                    .eq('shows.show_group', 'Goose')
                    .not('shows.show_canonid', 'is', null)
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            // Group entries by show and set
            const showSetMap: { [key: string]: any[] } = {};
            allData.forEach((entry: any) => {
                const key = `${entry.entry_show}_${entry.entry_set}`;
                if (!showSetMap[key]) {
                    showSetMap[key] = [];
                }
                showSetMap[key].push(entry);
            });

            // Find sandwiches
            const sandwiches: { [key: string]: Sandwich } = {};

            Object.values(showSetMap).forEach((entries: any[]) => {
                // Sort by entry_setnum
                entries.sort((a, b) => a.entry_setnum - b.entry_setnum);

                // Group by song name to find unfinished/reprise pairs
                const songGroups: { [songName: string]: any[] } = {};
                entries.forEach(entry => {
                    if (!songGroups[entry.entry_song]) {
                        songGroups[entry.entry_song] = [];
                    }
                    songGroups[entry.entry_song].push(entry);
                });

                // For each song, find unfinished/reprise pairs
                Object.entries(songGroups).forEach(([songName, songEntries]) => {
                    const unfinishedEntries = songEntries.filter(e => e.entry_short === 'unfinished');
                    const repriseEntries = songEntries.filter(e => e.entry_short === 'reprise');

                    if (unfinishedEntries.length > 0 && repriseEntries.length > 0) {
                        // Get first unfinished and last reprise
                        const firstUnfinished = unfinishedEntries[0];
                        const lastReprise = repriseEntries[repriseEntries.length - 1];

                        // Make sure reprise comes after unfinished
                        if (lastReprise.entry_setnum > firstUnfinished.entry_setnum) {
                            // Get all songs between them (inclusive)
                            const betweenSongs = entries.filter(
                                e => e.entry_setnum >= firstUnfinished.entry_setnum &&
                                    e.entry_setnum <= lastReprise.entry_setnum
                            );

                            // Build sandwich
                            const sandwichSongs: SandwichSong[] = betweenSongs.map(e => ({
                                song_name: e.entry_song,
                                song_id: e.songs.song_id
                            }));

                            // Create key for grouping identical sandwiches
                            const sandwichKey = sandwichSongs.map(s => s.song_id).join('|');
                            const sortString = sandwichSongs.map(s => cleanSongName(s.song_name)).join(' ');

                            if (!sandwiches[sandwichKey]) {
                                sandwiches[sandwichKey] = {
                                    songs: sandwichSongs,
                                    count: 1,
                                    category_canonid: firstUnfinished.songs.categories.category_canonid,
                                    category_artwork: firstUnfinished.songs.categories.category_artwork,
                                    sandwich_key: sandwichKey,
                                    sort_string: sortString
                                };
                            } else {
                                sandwiches[sandwichKey].count++;
                            }
                        }
                    }
                });
            });

            // Sort and take top 25
            const processedSandwiches = Object.values(sandwiches)
                .filter(sandwich => sandwich.count > 1) // Add this line
                .sort((a, b) => {
                    if (b.count !== a.count) {
                        return b.count - a.count;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.sort_string.localeCompare(b.sort_string);
                })
                .slice(0, 25);

            setContainer2Data(processedSandwiches);
        } catch (error) {
            console.error('Error fetching sandwich data:', error);
        }
    }

    async function fetchContainer3Data() {
        // Placeholder implementation
        const placeholderData: PlaceholderItem[] = [
            { item_name: 'Placeholder Item 1', item_id: '1', count: 88 },
            { item_name: 'Placeholder Item 2', item_id: '2', count: 83 },
            { item_name: 'Placeholder Item 3', item_id: '3', count: 79 },
            { item_name: 'Placeholder Item 4', item_id: '4', count: 74 },
            { item_name: 'Placeholder Item 5', item_id: '5', count: 69 },
        ];
        setContainer3Data(placeholderData);
    }

    async function fetchContainer4Data() {
        // Placeholder implementation
        const placeholderData: PlaceholderItem[] = [
            { item_name: 'Placeholder Item 1', item_id: '1', count: 86 },
            { item_name: 'Placeholder Item 2', item_id: '2', count: 81 },
            { item_name: 'Placeholder Item 3', item_id: '3', count: 77 },
            { item_name: 'Placeholder Item 4', item_id: '4', count: 72 },
            { item_name: 'Placeholder Item 5', item_id: '5', count: 67 },
        ];
        setContainer4Data(placeholderData);
    }

    const renderSandwichTable = (sandwiches: Sandwich[]) => {
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
                            // Check if next item has same count (meaning we're in a tied group and not last)
                            const nextItem = rankedSandwiches[index + 1];
                            const showBorderBottom = nextItem && sandwich.count === nextItem.count;
                            // Show regular border if not in a tie AND not the last item
                            const showRegularBorder = !showBorderBottom && index < rankedSandwiches.length - 1;

                            return (
                                <tr
                                    key={sandwich.sandwich_key}
                                    className={`${sandwich.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                                        } hover:bg-tertiary/40 transition-colors text-xs ${
                                        showBorderBottom ? 'border-b border-black/20' : ''
                                        } ${showRegularBorder ? 'border-b border-white/5' : ''}`}
                                >
                                    <td className="pl-2 pr-1 w-[30px] text-center font-semibold text-[0.875rem] text-fifth">
                                        {sandwich.displayRank !== null ? sandwich.displayRank : ''}
                                    </td>
                                    <td className="pl-2 text-fifth">
                                        <div
                                            className="w-full text-left pb-0.5"
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
                                                    <a
                                                        onClick={() => navigate(`/song/${song.song_id}`)}
                                                        className={`text-fifth text-[1rem] leading-[0.875rem] font-trad transition-colors table-link cursor-pointer inline ${songIndex < sandwich.songs.length - 1 ? 'mr-1' : ''
                                                            }`}
                                                        style={{ verticalAlign: 'middle' }}
                                                    >
                                                        {cleanSongName(song.song_name)}
                                                    </a>
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
    };

    const renderTable = (items: PlaceholderItem[], bgColor: string) => {
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
                            // Check if next item has same count (meaning we're in a tied group and not last)
                            const nextItem = rankedItems[index + 1];
                            const showBorderBottom = nextItem && item.count === nextItem.count;
                            
                            return (
                                <tr
                                    key={item.item_id}
                                    className={`${item.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
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
    };

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading data...</div>
        );
    }

    return (
        <div>
            {/* Desktop view - 2x2 grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* Container 1 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    {renderTable(container1Data, '#047857')}
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    {renderSandwichTable(container2Data)}
                </div>
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden space-y-6">
                {/* Container 1 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    {renderTable(container1Data, '#047857')}
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2 mt-1">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    {renderSandwichTable(container2Data)}
                </div>
            </div>
        </div>
    );
}