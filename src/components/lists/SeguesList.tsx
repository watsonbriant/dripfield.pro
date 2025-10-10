import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleEllipsis, MoveRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlaceholderItem {
    item_name: string;
    item_id: string;
    count: number;
    category_canonid?: number;
    category_artwork?: string;
}

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
}

interface SeguesListProps {
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

export function SeguesList({ listId, onProgressUpdate }: SeguesListProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [container1Data, setContainer1Data] = useState<Segue[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        console.log('SeguesList mounted with listId:', listId);
        fetchAllData();
    }, [listId]);

    async function fetchAllData() {
        try {
            console.log('Starting fetchAllData...');
            onProgressUpdate(10);
            await fetchContainer1Data();
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
            console.log('Starting fetchContainer1Data...');
            onProgressUpdate(15);

            // First get the total count of entries with canonid and segue containing ">"
            console.log('Fetching count of entries with segue containing ">"...');
            const { count, error: countError } = await supabase
                .from('setlist_entries')
                .select('*, shows!inner(*)', { count: 'exact', head: true })
                .not('shows.show_canonid', 'is', null)
                .like('entry_segue', '%>%');

            if (countError) {
                console.error('Count error:', countError);
                throw countError;
            }

            console.log('Total entries with segues:', count);

            // Fetch in batches of 1000
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            console.log('Total batches to fetch:', totalBatches);
            let allEntries: any[] = [];

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);

                console.log(`Fetching batch ${i + 1}/${totalBatches} (${start}-${end})...`);

                const batchProgress = 15 + ((i + 1) / totalBatches) * 30; // Reduced from 45 to 30
                onProgressUpdate(Math.round(batchProgress));

                const { data: entries, error: entriesError } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_id,
                        entry_song,
                        entry_segue,
                        entry_show,
                        entry_set,
                        entry_setnum,
                        shows!inner (
                            show_canonid
                        )
                    `)
                    .not('shows.show_canonid', 'is', null)
                    .like('entry_segue', '%>%')
                    .range(start, end);

                if (entriesError) {
                    console.error(`Batch ${i + 1} error:`, entriesError);
                    throw entriesError;
                }

                console.log(`Batch ${i + 1} fetched:`, entries?.length, 'entries');
                if (i === 0 && entries && entries.length > 0) {
                    console.log('Sample entry from first batch:', entries[0]);
                }

                if (entries) {
                    allEntries = [...allEntries, ...entries];
                }
            }

            console.log('Total entries fetched:', allEntries.length);
            onProgressUpdate(50);

            // Count occurrences of each song that has a segue and store instances
            const songDataMap = new Map<string, {
                count: number;
                instances: Array<{
                    entry_id: string;
                    entry_show: string;
                    entry_set: string;
                    entry_setnum: number;
                }>;
            }>();

            allEntries.forEach((entry: any, index: number) => {
                const songName = entry.entry_song;
                
                if (index < 5) {
                    console.log(`Processing entry ${index}: ${songName} with segue: ${entry.entry_segue}`);
                }

                const existing = songDataMap.get(songName);
                if (existing) {
                    existing.count++;
                    existing.instances.push({
                        entry_id: entry.entry_id,
                        entry_show: entry.entry_show,
                        entry_set: entry.entry_set,
                        entry_setnum: entry.entry_setnum
                    });
                } else {
                    songDataMap.set(songName, {
                        count: 1,
                        instances: [{
                            entry_id: entry.entry_id,
                            entry_show: entry.entry_show,
                            entry_set: entry.entry_set,
                            entry_setnum: entry.entry_setnum
                        }]
                    });
                }
            });

            console.log('Unique songs with segues found:', songDataMap.size);
            console.log('First 5 songs:', Array.from(songDataMap.entries()).slice(0, 5));
            onProgressUpdate(60);

            // Fetch all songs with pagination (including artwork, category, and category_canonid)
            console.log('Fetching song data...');
            let allSongData: any[] = [];
            const songBatchSize = 1000;
            let songOffset = 0;
            let hasMoreSongs = true;

            while (hasMoreSongs) {
                const { data: songBatch, error: songError } = await supabase
                    .from('songs')
                    .select(`
                        song, 
                        song_id,
                        song_category,
                        categories!inner(
                            category_artwork,
                            category_canonid
                        )
                    `)
                    .range(songOffset, songOffset + songBatchSize - 1);

                if (songError) {
                    console.error('Song fetch error:', songError);
                    throw songError;
                }

                if (songBatch && songBatch.length > 0) {
                    allSongData = [...allSongData, ...songBatch];
                    songOffset += songBatchSize;
                    hasMoreSongs = songBatch.length === songBatchSize;
                } else {
                    hasMoreSongs = false;
                }
            }

            console.log('Total songs fetched:', allSongData.length);
            onProgressUpdate(70);

            // Create lookup map
            const songLookupMap = new Map(
                allSongData?.map(s => [s.song, { 
                    song_id: s.song_id, 
                    song_name: s.song, 
                    category_artwork: s.categories?.category_artwork,
                    category_canonid: s.categories?.category_canonid
                }]) || []
            );

            console.log('Song lookup map created with', songLookupMap.size, 'entries');

            // Convert to array with song metadata
            const songsWithMetadata = Array.from(songDataMap.entries())
                .map(([songName, data]) => {
                    const songData = songLookupMap.get(songName);
                    return {
                        songName,
                        count: data.count,
                        instances: data.instances,
                        category_canonid: songData?.category_canonid || 999,
                        category_artwork: songData?.category_artwork,
                        song_id: songData?.song_id,
                        song_name: songData?.song_name || songName
                    };
                });

            // Sort by: 1) count DESC, 2) category_canonid ASC, 3) song name ASC
            const sortedSongs = songsWithMetadata.sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                if (a.category_canonid !== b.category_canonid) {
                    return a.category_canonid - b.category_canonid;
                }
                return a.song_name.localeCompare(b.song_name);
            }).slice(0, 25);

            console.log('Top 25 songs with segues:', sortedSongs.map(s => `${s.song_name}: ${s.count} (cat: ${s.category_canonid})`));
            onProgressUpdate(75);

            // NOW PROCESS ALL DESTINATIONS UPFRONT
            console.log('Processing destinations for all top 25 songs...');
            
            // Get all unique show IDs from all instances across all top 25 songs
            const allShowIds = new Set<string>();
            sortedSongs.forEach(song => {
                song.instances.forEach(inst => allShowIds.add(inst.entry_show));
            });
            
            console.log(`Fetching setlist entries for ${allShowIds.size} unique shows...`);
            
            // Fetch all setlist entries for these shows in batches
            const showIdArray = Array.from(allShowIds);
            const showBatchSize = 50;
            const showBatches = [];
            for (let i = 0; i < showIdArray.length; i += showBatchSize) {
                showBatches.push(showIdArray.slice(i, i + showBatchSize));
            }

            let allShowEntries: any[] = [];
            for (let i = 0; i < showBatches.length; i++) {
                const showBatch = showBatches[i];
                const { data, error } = await supabase
                    .from('setlist_entries')
                    .select('entry_id, entry_show, entry_set, entry_setnum, entry_song')
                    .in('entry_show', showBatch)
                    .order('entry_show')
                    .order('entry_set')
                    .order('entry_setnum');

                if (error) throw error;
                if (data) allShowEntries = [...allShowEntries, ...data];
                
                // Update progress during show fetching
                const showProgress = 75 + ((i + 1) / showBatches.length) * 10;
                onProgressUpdate(Math.round(showProgress));
            }

            console.log(`Fetched ${allShowEntries.length} total entries from shows`);

            // Group entries by show for efficient lookup
            const entriesByShow = new Map<string, any[]>();
            allShowEntries.forEach(entry => {
                if (!entriesByShow.has(entry.entry_show)) {
                    entriesByShow.set(entry.entry_show, []);
                }
                entriesByShow.get(entry.entry_show)!.push(entry);
            });

            onProgressUpdate(85);

            // Process destinations for each song
            const songsWithDestinations = sortedSongs.map((song, songIndex) => {
                // For each instance, find the next song
                const nextSongCounts = new Map<string, number>();
                song.instances.forEach(instance => {
                    const showEntries = entriesByShow.get(instance.entry_show);
                    if (!showEntries) return;

                    const currentIndex = showEntries.findIndex(e => e.entry_id === instance.entry_id);
                    if (currentIndex === -1 || currentIndex === showEntries.length - 1) return;

                    const nextEntry = showEntries[currentIndex + 1];
                    const nextSong = nextEntry.entry_song;

                    nextSongCounts.set(nextSong, (nextSongCounts.get(nextSong) || 0) + 1);
                });

                // Create destinations with metadata
                const destinationsWithMetadata = Array.from(nextSongCounts.entries())
                    .map(([songName, count]) => {
                        const songData = songLookupMap.get(songName);
                        return {
                            song_name: songData?.song_name || songName,
                            song_id: songData?.song_id || songName,
                            song_artwork: songData?.category_artwork,
                            category_canonid: songData?.category_canonid || 999,
                            count
                        };
                    });

                // Sort destinations
                const destinations: SegueDestination[] = destinationsWithMetadata.sort((a, b) => {
                    if (b.count !== a.count) {
                        return b.count - a.count;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.song_name.localeCompare(b.song_name);
                });

                console.log(`Processed ${destinations.length} destinations for ${song.song_name}`);
                
                // Update progress during destination processing
                const destProgress = 85 + ((songIndex + 1) / sortedSongs.length) * 10;
                onProgressUpdate(Math.round(destProgress));

                return { ...song, destinations };
            });

            onProgressUpdate(95);

            // Transform into Segue format with destinations already included
            const segueData: Segue[] = songsWithDestinations.map((song) => {
                return {
                    songs: [
                        {
                            song_name: song.song_name,
                            song_id: song.song_id || song.songName,
                            song_artwork: song.category_artwork,
                            category_canonid: song.category_canonid
                        }
                    ],
                    count: song.count,
                    category_canonid: song.category_canonid,
                    category_artwork: song.category_artwork || '',
                    segue_key: song.song_id || song.songName,
                    sort_string: song.song_name,
                    instances: song.instances,
                    destinations: song.destinations // Already populated!
                };
            });

            console.log('Final segue data created with destinations:', segueData.length, 'items');
            console.log('First item:', segueData[0]);
            
            setContainer1Data(segueData);
            console.log('Container1Data set successfully');
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching segue data:', error);
            onProgressUpdate(100);
        }
    }

    const toggleExpanded = (segue: Segue) => {
        const newExpanded = new Set(expandedRows);
        
        if (newExpanded.has(segue.segue_key)) {
            newExpanded.delete(segue.segue_key);
        } else {
            newExpanded.add(segue.segue_key);
        }
        
        setExpandedRows(newExpanded);
    };

    const renderSegueTable = (segues: Segue[]) => {
        console.log('Rendering segue table with', segues.length, 'items');
        
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
                            const nextItem = rankedSegues[index + 1];
                            const isTied = nextItem && segue.count === nextItem.count;
                            
                            return (
                                <React.Fragment key={segue.segue_key}>
                                    <tr
                                        className={`${segue.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
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
                                                    onClick={() => navigate(`/song/${segue.songs[0].song_id}`)}
                                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                                >
                                                    {cleanSongName(segue.songs[0].song_name)}
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleExpanded(segue)}
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
                                        <tr className={`${segue.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'} ${!isTied && index < rankedSegues.length - 1 ? 'border-b border-white/5' : ''}`}>
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
                                                                                            onClick={() => navigate(`/song/${dest.song_id}`)}
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
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    console.log('Rendering component, loading:', loading, 'data length:', container1Data.length);

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading data...</div>
        );
    }

    return (
        <div>
            <div>
                <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                    Most Common Segues
                </h3>
                <p className="text-fifth font-light text-xs mb-2">
                    Songs that segued into another song, ordered by frequency.
                </p>
                {renderSegueTable(container1Data)}
            </div>
        </div>
    );
}