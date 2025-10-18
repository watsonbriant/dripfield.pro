import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

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

export function useUnfinishedReprisedData(listId: string, onProgressUpdate: (progress: number) => void) {
    const [loading, setLoading] = useState(true);
    const [container1Data, setContainer1Data] = useState<PlaceholderItem[]>([]);
    const [container2Data, setContainer2Data] = useState<Sandwich[]>([]);

    useEffect(() => {
        fetchAllData();
    }, [listId]);

    async function fetchAllData() {
        try {
            onProgressUpdate(10);

            await fetchContainer1Data();
            await fetchContainer2Data();

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

            const showSetMap: { [key: string]: any[] } = {};
            allData.forEach((entry: any) => {
                const key = `${entry.entry_show}_${entry.entry_set}`;
                if (!showSetMap[key]) {
                    showSetMap[key] = [];
                }
                showSetMap[key].push(entry);
            });

            const sandwiches: { [key: string]: Sandwich } = {};

            Object.values(showSetMap).forEach((entries: any[]) => {
                entries.sort((a, b) => a.entry_setnum - b.entry_setnum);

                const songGroups: { [songName: string]: any[] } = {};
                entries.forEach(entry => {
                    if (!songGroups[entry.entry_song]) {
                        songGroups[entry.entry_song] = [];
                    }
                    songGroups[entry.entry_song].push(entry);
                });

                Object.entries(songGroups).forEach(([songName, songEntries]) => {
                    const unfinishedEntries = songEntries.filter(e => e.entry_short === 'unfinished');
                    const repriseEntries = songEntries.filter(e => e.entry_short === 'reprise');

                    if (unfinishedEntries.length > 0 && repriseEntries.length > 0) {
                        const firstUnfinished = unfinishedEntries[0];
                        const lastReprise = repriseEntries[repriseEntries.length - 1];

                        if (lastReprise.entry_setnum > firstUnfinished.entry_setnum) {
                            const betweenSongs = entries.filter(
                                e => e.entry_setnum >= firstUnfinished.entry_setnum &&
                                    e.entry_setnum <= lastReprise.entry_setnum
                            );

                            const sandwichSongs: SandwichSong[] = betweenSongs.map(e => ({
                                song_name: e.entry_song,
                                song_id: e.songs.song_id
                            }));

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

            const processedSandwiches = Object.values(sandwiches)
                .filter(sandwich => sandwich.count > 1)
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

    return {
        loading,
        container1Data,
        container2Data
    };
}

export function cleanSongName(songName: string): string {
    return songName
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u')
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        .replace(/∆/g, 'a');
}
