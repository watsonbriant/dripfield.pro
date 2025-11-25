import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

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

export function useSegueData(listId: string, onProgressUpdate: (progress: number) => void) {
    const [loading, setLoading] = useState(true);
    const [segueData, setSegueData] = useState<Segue[]>([]);

    useEffect(() => {
        fetchSegueData();
    }, [listId]);

    async function fetchSegueData() {
        try {
            onProgressUpdate(10);
            await fetchContainer1Data();
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching segue data:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

    async function fetchContainer1Data() {
        try {
            onProgressUpdate(15);

            // First get the total count of entries with canonid and segue containing ">"
            const { count, error: countError } = await supabase
                .from('setlist_entries')
                .select('*, shows!inner(*)', { count: 'exact', head: true })
                .not('shows.show_canonid', 'is', null)
                .like('entry_segue', '%>%');

            if (countError) {
                console.error('Count error:', countError);
                throw countError;
            }

            // Fetch in batches of 1000
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allEntries: any[] = [];

            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);

                const batchProgress = 15 + ((i + 1) / totalBatches) * 30;
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

                if (entries) {
                    allEntries = [...allEntries, ...entries];
                }
            }

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

            allEntries.forEach((entry: any) => {
                const songName = entry.entry_song;

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

            onProgressUpdate(60);

            // Fetch all songs with pagination (including artwork, category, and category_canonid)
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

            onProgressUpdate(75);

            // Process destinations
            const processedSegues = await processDestinations(sortedSongs, songLookupMap, onProgressUpdate);
            
            setSegueData(processedSegues);
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching segue data:', error);
            onProgressUpdate(100);
        }
    }

    async function processDestinations(
        sortedSongs: any[], 
        songLookupMap: Map<string, any>, 
        onProgressUpdate: (progress: number) => void
    ): Promise<Segue[]> {
        // Get all unique show IDs from all instances across all top 25 songs
        const allShowIds = new Set<string>();
        sortedSongs.forEach(song => {
            song.instances.forEach((inst: any) => allShowIds.add(inst.entry_show));
        });
        
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
            song.instances.forEach((instance: any) => {
                const showEntries = entriesByShow.get(instance.entry_show);
                if (!showEntries) return;

                const currentIndex = showEntries.findIndex((e: any) => e.entry_id === instance.entry_id);
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
                destinations: song.destinations
            };
        });

        return segueData;
    }

    return {
        loading,
        segueData
    };
}
