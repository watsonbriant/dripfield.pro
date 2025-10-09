import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowUp, ArrowDown, MoveRight } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

interface List {
    id: number;
    list_id: string;
    list_name: string;
    list_category: string;
    list_description: string | null;
    list_order: number;
}

interface ListItem {
    id: number;
    list_item_name: string;
    list_item_order: number;
    list_item_id: string;
}

interface LongestPerformance {
    entry_id: string;
    entry_song: string;
    song_id: string;
    song_name: string;
    entry_length: string;
    entry_short: string | null;
    entry_segue: string | null;
    entry_coachnotes: string | null;
    show_id: string;
    show_date: string;
    show_group: string;
    show_venue_location: string;
    show_subvenue: string;
    entry_placement: string;
    venue_id: string;
}

// CircularProgress component matching SongsPlayed
const CircularProgress = ({ value }: { value: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - value / 100);

    return (
        <div className="relative inline-flex justify-center items-center">
            <svg className="w-16 h-16" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#b4b2b2"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                />
                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#8ec1b6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-300 ease-in-out"
                />
            </svg>
            <div className="absolute text-sm font-bold text-fifth">
                {Math.round(value)}%
            </div>
        </div>
    );
};

export function ListInd() {
    const { listId } = useParams<{ listId: string }>();
    const navigate = useNavigate();
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [longestPerformances, setLongestPerformances] = useState<LongestPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [sortColumn, setSortColumn] = useState<string>('song_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        if (listId) {
            fetchListData();
        }
    }, [listId]);

    async function fetchListData() {
        try {
            setLoadingProgress(5);

            // Fetch list details
            const { data: listData, error: listError } = await supabase
                .from('lists')
                .select('*')
                .eq('list_id', listId)
                .single();

            if (listError) throw listError;
            setList(listData);

            setLoadingProgress(10);

            // Check if this is the longest or shortest performances list
            if (listId === '1fdc862c-bef0-4a7c-92f7-f6686b7efbd8' || listId === '3657a3a7-bcb4-483b-b8ef-e4ae28495a61') {
                await fetchLongestPerformances();
            } else {
                // Fetch regular list items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('list_items')
                    .select('*')
                    .eq('list_id', listId)
                    .order('list_item_order', { ascending: true });

                if (itemsError) throw itemsError;
                setItems(itemsData || []);
                setLoadingProgress(100);
            }
        } catch (error) {
            console.error('Error fetching list data:', error);
            setLoadingProgress(100);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }

    async function fetchLongestPerformances() {
        try {
            setLoadingProgress(15);
            
            // Determine if we're looking for longest or shortest
            const isShortestList = listId === '3657a3a7-bcb4-483b-b8ef-e4ae28495a61';

            // First get the total count of entries with canonid
            const { count, error: countError } = await supabase
                .from('setlist_entries')
                .select('*, shows!inner(*)', { count: 'exact', head: true })
                .not('shows.show_canonid', 'is', null);

            if (countError) throw countError;

            // Fetch in batches of 1000
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allEntries: any[] = [];

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);

                // Calculate progress: 15-60% for this section
                const batchProgress = 15 + ((i + 1) / totalBatches) * 45;
                setLoadingProgress(Math.round(batchProgress));

                const { data: entries, error: entriesError } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_id,
                        entry_song,
                        entry_length,
                        entry_short,
                        entry_segue,
                        entry_coachnotes,
                        entry_placement,
                        shows!inner (
                        show_id,
                        show_date,
                        show_group,
                        show_venue_location,
                        show_subvenue,
                        show_subvenue_venue,
                        show_canonid
                        )
                    `)
                    .not('shows.show_canonid', 'is', null)
                    .range(start, end);

                if (entriesError) throw entriesError;

                if (entries) {
                    allEntries = [...allEntries, ...entries];
                }
            }

            setLoadingProgress(65);

            // Group by song and find the longest OR shortest performance for each
            const songMap = new Map<string, any>();

            // Convert entry_length to seconds for comparison
            const timeToSeconds = (timeStr: string | null) => {
                if (!timeStr) return 0;
                const parts = timeStr.split(':').map(Number);
                if (parts.length === 3) {
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                    return parts[0] * 60 + parts[1];
                }
                return 0;
            };

            allEntries.forEach((entry: any) => {
                // Skip entries without entry_length
                if (!entry.entry_length) return;
                
                // Skip entries with excluded entry_short values
                const excludedShortTypes = ["aborted", "fake", "partial", "reprise", "tease"];
                if (entry.entry_short && excludedShortTypes.includes(entry.entry_short.toLowerCase())) {
                    return;
                }
                
                const songId = entry.entry_song;
                const currentLength = timeToSeconds(entry.entry_length);
                const existingEntry = songMap.get(songId);
                const existingLength = existingEntry ? timeToSeconds(existingEntry.entry_length) : (isShortestList ? Infinity : 0);

                // For shortest: update if current is shorter
                // For longest: update if current is longer
                const shouldUpdate = isShortestList 
                    ? (!existingEntry || currentLength < existingLength)
                    : (!existingEntry || currentLength > existingLength);

                if (shouldUpdate) {
                    songMap.set(songId, {
                        entry_id: entry.entry_id,
                        entry_song: entry.entry_song,
                        entry_length: entry.entry_length,
                        entry_short: entry.entry_short,
                        entry_segue: entry.entry_segue,
                        entry_coachnotes: entry.entry_coachnotes,
                        show_id: entry.shows.show_id,
                        show_date: entry.shows.show_date,
                        show_group: entry.shows.show_group,
                        show_venue_location: entry.shows.show_venue_location,
                        show_subvenue: entry.shows.show_subvenue,
                        entry_placement: entry.entry_placement,
                        venue_id: entry.shows.show_subvenue_venue
                    });
                }
            });

            // Rest of the function remains the same...
            setLoadingProgress(75);

            // Get unique song IDs
            const uniqueSongIds = Array.from(songMap.keys());

            // Fetch all songs at once
            const { data: allSongData, error: songError } = await supabase
                .from('songs')
                .select('song, song_id');

            if (songError) throw songError;

            setLoadingProgress(85);

            // Create a map of song_id to song name for quick lookup
            const songDataMap = new Map(
                allSongData?.map(s => [s.song, { song_id: s.song_id, song_name: s.song }]) || []
            );

            // Map song names to performances
            const longestPerfs = Array.from(songMap.values()).map(perf => {
                const songData = songDataMap.get(perf.entry_song);
                return {
                    ...perf,
                    song_id: songData?.song_id || perf.entry_song, // Use the UUID for navigation
                    song_name: songData?.song_name || perf.entry_song // Display the song name
                };
            });

            setLongestPerformances(longestPerfs);
            setLoadingProgress(100);
        } catch (error) {
            console.error('Error fetching longest performances:', error);
            setLoadingProgress(100);
        }
    }

    const handleItemClick = (itemId: string, category: string) => {
        if (category === 'songs') {
            navigate(`/song/${itemId}`);
        } else if (category === 'shows') {
            navigate(`/setlist/${itemId}`);
        }
    };

    const formatLength = (length: string | null): string => {
        if (!length) return '';
        const parts = length.split(':').map(part => parseInt(part));
        if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            if (hours === 0) {
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else if (parts.length === 2) {
            const [minutes, seconds] = parts;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return length;
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortedPerformances = () => {
        const sorted = [...longestPerformances];

        sorted.sort((a, b) => {
            let valueA: any;
            let valueB: any;

            switch (sortColumn) {
                case 'song_name':
                    valueA = a.song_name || '';
                    valueB = b.song_name || '';
                    break;
                case 'entry_length':
                    const timeToSeconds = (timeStr: string | null) => {
                        if (!timeStr) return 0;
                        const parts = timeStr.split(':').map(Number);
                        if (parts.length === 3) {
                            return parts[0] * 3600 + parts[1] * 60 + parts[2];
                        } else if (parts.length === 2) {
                            return parts[0] * 60 + parts[1];
                        }
                        return 0;
                    };
                    valueA = timeToSeconds(a.entry_length);
                    valueB = timeToSeconds(b.entry_length);
                    break;
                case 'show_date':
                    valueA = new Date(a.show_date).getTime();
                    valueB = new Date(b.show_date).getTime();
                    break;
                case 'show_group':
                    valueA = a.show_group || '';
                    valueB = b.show_group || '';
                    break;
                case 'show_venue_location':
                    valueA = a.show_venue_location || '';
                    valueB = b.show_venue_location || '';
                    break;
                default:
                    valueA = '';
                    valueB = '';
            }

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                const comparison = valueA.localeCompare(valueB);
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted;
    };

    if (loading) {
        return (
            <div className="max-w-[936px] mx-auto">
                <div className="max-h-[320px] overflow-y-auto">
                    <div className="flex items-center justify-center py-6">
                        <CircularProgress value={loadingProgress} />
                    </div>
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="max-w-[936px] mx-auto">
                <div className="text-fifth text-center py-8">List not found</div>
            </div>
        );
    }

    const renderLongestPerformancesTable = () => {
        const sortedPerformances = getSortedPerformances();

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr className="bg-canvas border-y border-secondary">
                            <th
                                className="px-3 py-1 text-left text-s font-medium text-fifth cursor-pointer hover:bg-black/5 w-[250px] max-w-[250px]"
                                onClick={() => handleSort('song_name')}
                            >
                                Song
                            </th>
                            <th
                                className="px-3 py-1 text-center text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                                onClick={() => handleSort('entry_length')}
                            >
                                Length
                            </th>
                            <th
                                className="px-3 py-1 text-center text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                                onClick={() => handleSort('show_date')}
                            >
                                <div className="flex justify-center gap-1">
                                    Show
                                </div>
                            </th>
                            <th
                                className="px-3 py-1 text-left text-s font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/5"
                                onClick={() => handleSort('show_venue_location')}
                            >
                                <div className="flex items-center gap-1">
                                    Location
                                </div>
                            </th>
                            <th className="px-3 py-1 text-left text-s font-medium text-fifth whitespace-nowrap w-[350px] max-w-[350px]">
                                Coach's Notes
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {sortedPerformances.map((perf, index) => (
                            <tr
                                key={perf.entry_id}
                                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                    } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                                <td className="px-3 py-0.5 text-fifth w-[250px] max-w-[250px]">
                                    <button
                                        onClick={() => navigate(`/song/${perf.song_id}`)}
                                        className="font-medium hover:underline transition-colors break-words text-left"
                                    >
                                        {perf.song_name}
                                    </button>
                                </td>
                                <td className="px-3 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                                    {formatLength(perf.entry_length)}
                                </td>
                                <td className="px-3 py-0.5 text-fifth whitespace-nowrap text-center">
                                    <button
                                        onClick={() => navigate(`/setlist/${perf.show_id}`)}
                                        className="font-medium hover:underline transition-colors"
                                    >
                                        {formatInTimeZone(
                                            new Date(perf.show_date),
                                            'UTC',
                                            'MM.dd.yy'
                                        )}
                                    </button>
                                </td>
                                <td className="px-3 py-0.5 text-fifth font-light whitespace-nowrap">
                                    <button
                                        onClick={() => navigate(`/venue/${perf.venue_id}`)}
                                        className="hover:underline transition-colors"
                                    >
                                        {perf.show_venue_location}
                                    </button>
                                </td>
                                <td className="px-3 py-0.5 text-fifth font-light">
                                    {perf.entry_coachnotes ? (
                                        <div dangerouslySetInnerHTML={{ __html: perf.entry_coachnotes }} />
                                    ) : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="max-w-[936px] mx-auto">
            <button
                onClick={() => navigate('/lists')}
                className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-secondary hover:underline transition-colors font-medium text-sm text-fifth mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lists
            </button>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
                        {list.list_name}
                    </h1>
                    {list.list_description && (
                        <p className="text-fifth font-light text-xs mt-2 bg-[#e3e3e3] rounded-lg px-2 py-1 border border-secondary">{list.list_description}</p>
                    )}
                </div>
            </div>

            <div className="bg-primary border border-secondary rounded-lg p-4">
                {(listId === '1fdc862c-bef0-4a7c-92f7-f6686b7efbd8' || listId === '3657a3a7-bcb4-483b-b8ef-e4ae28495a61') ? (
                    longestPerformances.length > 0 ? (
                        renderLongestPerformancesTable()
                    ) : (
                        <div className="text-fifth text-center py-8">No performances found</div>
                    )
                ) : (
                    <div className="space-y-2">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.list_item_id, list.list_category)}
                                    className="block w-full text-left px-3 py-2 bg-canvas hover:bg-tertiary hover:text-fifth transition-colors rounded border border-secondary text-fourth"
                                >
                                    <span className="font-medium mr-2">{index + 1}.</span>
                                    {item.list_item_name}
                                </button>
                            ))
                        ) : (
                            <div className="text-fifth text-center py-8">No items in this list</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}