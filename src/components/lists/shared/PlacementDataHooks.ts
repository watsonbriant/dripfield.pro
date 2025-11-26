import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface PlacementSong {
    song_name: string;
    song_id: string;
    times_played: number;
    category_canonid: number;
    category_artwork?: string;
}

export function usePlacementData(listId: string, onProgressUpdate: (progress: number) => void) {
    const [loading, setLoading] = useState(true);
    const [showOpeners, setShowOpeners] = useState<PlacementSong[]>([]);
    const [setOpeners, setSetOpeners] = useState<PlacementSong[]>([]);
    const [setClosers, setSetClosers] = useState<PlacementSong[]>([]);
    const [encores, setEncores] = useState<PlacementSong[]>([]);

    useEffect(() => {
        fetchAllPlacements();
    }, [listId]);

    async function fetchAllPlacements() {
        try {
            onProgressUpdate(10);
            await Promise.all([
                fetchShowOpeners(),
                fetchSetOpeners(),
                fetchSetClosers(),
                fetchEncores()
            ]);
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching placements:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

    async function fetchShowOpeners() {
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
                    .eq('entry_placement', 'Set 1 Opener')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
                const songName = entry.entry_song;
                if (!acc[songName]) {
                    acc[songName] = {
                        song_name: songName,
                        song_id: entry.songs.song_id,
                        times_played: 1,
                        category_canonid: entry.songs.categories.category_canonid,
                        category_artwork: entry.songs.categories.category_artwork
                    };
                } else {
                    acc[songName].times_played++;
                }
                return acc;
            }, {});

            const processedOpeners = Object.values(openerCounts)
                .sort((a: any, b: any) => {
                    if (b.times_played !== a.times_played) {
                        return b.times_played - a.times_played;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.song_name.localeCompare(b.song_name);
                })
                .slice(0, 25);

            setShowOpeners(processedOpeners);
        } catch (error) {
            console.error('Error fetching show openers:', error);
        }
    }

    async function fetchSetOpeners() {
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
                    .in('entry_placement', ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener'])
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
                const songName = entry.entry_song;
                if (!acc[songName]) {
                    acc[songName] = {
                        song_name: songName,
                        song_id: entry.songs.song_id,
                        times_played: 1,
                        category_canonid: entry.songs.categories.category_canonid,
                        category_artwork: entry.songs.categories.category_artwork
                    };
                } else {
                    acc[songName].times_played++;
                }
                return acc;
            }, {});

            const processedOpeners = Object.values(openerCounts)
                .sort((a: any, b: any) => {
                    if (b.times_played !== a.times_played) {
                        return b.times_played - a.times_played;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.song_name.localeCompare(b.song_name);
                })
                .slice(0, 25);

            setSetOpeners(processedOpeners);
        } catch (error) {
            console.error('Error fetching set openers:', error);
        }
    }

    async function fetchSetClosers() {
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
                    .in('entry_placement', ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer'])
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            const closerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
                const songName = entry.entry_song;
                if (!acc[songName]) {
                    acc[songName] = {
                        song_name: songName,
                        song_id: entry.songs.song_id,
                        times_played: 1,
                        category_canonid: entry.songs.categories.category_canonid,
                        category_artwork: entry.songs.categories.category_artwork
                    };
                } else {
                    acc[songName].times_played++;
                }
                return acc;
            }, {});

            const processedClosers = Object.values(closerCounts)
                .sort((a: any, b: any) => {
                    if (b.times_played !== a.times_played) {
                        return b.times_played - a.times_played;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.song_name.localeCompare(b.song_name);
                })
                .slice(0, 25);

            setSetClosers(processedClosers);
        } catch (error) {
            console.error('Error fetching set closers:', error);
        }
    }

    async function fetchEncores() {
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
                    .in('entry_placement', ['Encore 1', 'Encore 2', 'Encore 3'])
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                allData.push(...(data || []));

                if (!data || data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            }

            const encoreCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
                const songName = entry.entry_song;
                if (!acc[songName]) {
                    acc[songName] = {
                        song_name: songName,
                        song_id: entry.songs.song_id,
                        times_played: 1,
                        category_canonid: entry.songs.categories.category_canonid,
                        category_artwork: entry.songs.categories.category_artwork
                    };
                } else {
                    acc[songName].times_played++;
                }
                return acc;
            }, {});

            const processedEncores = Object.values(encoreCounts)
                .sort((a: any, b: any) => {
                    if (b.times_played !== a.times_played) {
                        return b.times_played - a.times_played;
                    }
                    if (a.category_canonid !== b.category_canonid) {
                        return a.category_canonid - b.category_canonid;
                    }
                    return a.song_name.localeCompare(b.song_name);
                })
                .slice(0, 25);

            setEncores(processedEncores);
        } catch (error) {
            console.error('Error fetching encores:', error);
        }
    }

    return {
        loading,
        showOpeners,
        setOpeners,
        setClosers,
        encores
    };
}

