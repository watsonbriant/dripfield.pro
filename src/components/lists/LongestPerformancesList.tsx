import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';

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

interface LongestPerformancesListProps {
    listId: string;
    onProgressUpdate: (progress: number) => void;
}

export function LongestPerformancesList({ listId, onProgressUpdate }: LongestPerformancesListProps) {
    const navigate = useNavigate();
    const [performances, setPerformances] = useState<LongestPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortColumn, setSortColumn] = useState<string>('song_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const isShortestList = listId === '3657a3a7-bcb4-483b-b8ef-e4ae28495a61';

    useEffect(() => {
        fetchPerformances();
    }, [listId]);

    async function fetchPerformances() {
        try {
            onProgressUpdate(15);
            
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

                const batchProgress = 15 + ((i + 1) / totalBatches) * 45;
                onProgressUpdate(Math.round(batchProgress));

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

            onProgressUpdate(65);

            // Group by song and find the longest OR shortest performance for each
            const songMap = new Map<string, any>();

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
                if (!entry.entry_length) return;
                
                const excludedShortTypes = ["aborted", "fake", "partial", "reprise", "tease"];
                if (entry.entry_short && excludedShortTypes.includes(entry.entry_short.toLowerCase())) {
                    return;
                }
                
                const songId = entry.entry_song;
                const currentLength = timeToSeconds(entry.entry_length);
                const existingEntry = songMap.get(songId);
                const existingLength = existingEntry ? timeToSeconds(existingEntry.entry_length) : (isShortestList ? Infinity : 0);

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

            onProgressUpdate(75);

            // Get unique song IDs
            const uniqueSongIds = Array.from(songMap.keys());

            // Fetch all songs with pagination
            let allSongData: any[] = [];
            const songBatchSize = 1000;
            let songOffset = 0;
            let hasMoreSongs = true;

            while (hasMoreSongs) {
                const { data: songBatch, error: songError } = await supabase
                    .from('songs')
                    .select('song, song_id')
                    .range(songOffset, songOffset + songBatchSize - 1);

                if (songError) throw songError;

                if (songBatch && songBatch.length > 0) {
                    allSongData = [...allSongData, ...songBatch];
                    songOffset += songBatchSize;
                    hasMoreSongs = songBatch.length === songBatchSize;
                } else {
                    hasMoreSongs = false;
                }
            }

            onProgressUpdate(85);

            const songDataMap = new Map(
                allSongData?.map(s => [s.song, { song_id: s.song_id, song_name: s.song }]) || []
            );

            const longestPerfs = Array.from(songMap.values()).map(perf => {
                const songData = songDataMap.get(perf.entry_song);
                
                return {
                    ...perf,
                    song_id: songData?.song_id || perf.entry_song,
                    song_name: songData?.song_name || perf.entry_song
                };
            });

            setPerformances(longestPerfs);
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching performances:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

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
        const sorted = [...performances];

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
            <div className="text-center py-12 bg-primary p-3">
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
                    <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                    <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
                <p className="text-fifth mt-4">Loading performances...</p>
            </div>
        );
    }

    if (performances.length === 0) {
        return (
            <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
                <p className="text-fifth">No performances found</p>
            </div>
        );
    }

    const sortedPerformances = getSortedPerformances();

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                    <thead>
                        <tr className="bg-fourth">
                            <th
                                className="pl-2 pr-3 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20 w-[250px] max-w-[250px]"
                                onClick={() => handleSort('song_name')}
                            >
                                Song
                            </th>
                            <th
                                className="px-2 py-0.5 text-center text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
                                onClick={() => handleSort('entry_length')}
                            >
                                Length
                            </th>
                            <th
                                className="px-2 py-0.5 text-center text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
                                onClick={() => handleSort('show_date')}
                            >
                                Show
                            </th>
                            <th
                                className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
                                onClick={() => handleSort('show_venue_location')}
                            >
                                Location
                            </th>
                            <th className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap w-[500px] max-w-[500px]">
                                Coach's Notes
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {sortedPerformances.map((perf, index) => (
                            <tr
                                key={perf.entry_id}
                                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                            >
                                <td className="pl-2 pr-3 text-fifth w-[250px] max-w-[250px]">
                                    <button
                                        onClick={() => navigate(`/song/${perf.song_id}`)}
                                        className="font-medium hover:underline transition-colors break-words text-left"
                                    >
                                        {perf.song_name}
                                    </button>
                                </td>
                                <td className="px-2 text-fifth font-light whitespace-nowrap text-center">
                                    {formatLength(perf.entry_length)}
                                </td>
                                <td className="px-2 text-fifth whitespace-nowrap text-center">
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
                                <td className="px-2 text-fifth font-light whitespace-nowrap">
                                    <button
                                        onClick={() => navigate(`/venue/${perf.venue_id}`)}
                                        className="hover:underline transition-colors"
                                    >
                                        {perf.show_venue_location}
                                    </button>
                                </td>
                                <td className="px-2 text-fifth leading-[0.75rem] font-light">
                                    {perf.entry_coachnotes ? (
                                        <div dangerouslySetInnerHTML={{ __html: perf.entry_coachnotes }} />
                                    ) : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}