import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface PlacementSong {
    song_name: string;
    song_id: string;
    times_played: number;
    category_canonid: number;
    category_artwork?: string;
}

interface PopularPlacementsListProps {
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

export function PopularPlacementsList({ listId, onProgressUpdate }: PopularPlacementsListProps) {
    const navigate = useNavigate();
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

    const renderPlacementTable = (songs: PlacementSong[], bgColor: string) => {
        // Calculate rankings with tie handling
        let currentRank = 1;
        let currentBgGroup = 0;
        const rankedSongs = songs.map((song, index) => {
            let displayRank: number | null = null;
            
            // Show rank if it's the first song or if the count is different from previous
            if (index === 0 || songs[index - 1].times_played !== song.times_played) {
                displayRank = currentRank;
                currentBgGroup++; // Change background group when rank changes
            }
            
            currentRank++;
            
            return { ...song, displayRank, bgGroup: currentBgGroup };
        });

        return (
            <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                    <tbody className="divide-y divide-white/5">
                        {rankedSongs.map((song, index) => (
                            <tr
                                key={song.song_id}
                                className={`${song.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                                <td className="pl-2 pr-1 w-[30px] text-center font-medium text-fifth">
                                    {song.displayRank !== null ? song.displayRank : ''}
                                </td>
                                <td className="pl-2 text-fifth">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => navigate(`/song/${song.song_id}`)}
                                            className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                        >
                                            {cleanSongName(song.song_name)}
                                        </button>
                                        {song.category_artwork && (
                                            <img
                                                src={song.category_artwork}
                                                alt={`${song.song_name} artwork`}
                                                className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                    {song.times_played}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading placements...</div>
        );
    }

    return (
        <div>
            {/* Desktop view - 2x2 grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* Top Show Openers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#047857]">
                        Top Show Openers
                    </h3>
                    {renderPlacementTable(showOpeners, '#047857')}
                </div>

                {/* Top Set Openers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#10b981]">
                        Top Set Openers
                    </h3>
                    {renderPlacementTable(setOpeners, '#10b981')}
                </div>

                {/* Top Set Closers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#3b82f6]">
                        Top Set Closers
                    </h3>
                    {renderPlacementTable(setClosers, '#3b82f6')}
                </div>

                {/* Top Encores */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#be123c]">
                        Top Encores
                    </h3>
                    {renderPlacementTable(encores, '#be123c')}
                </div>
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden space-y-6">
                {/* Top Show Openers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#047857]">
                        Top Show Openers
                    </h3>
                    {renderPlacementTable(showOpeners, '#047857')}
                </div>

                {/* Top Set Openers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#10b981]">
                        Top Set Openers
                    </h3>
                    {renderPlacementTable(setOpeners, '#10b981')}
                </div>

                {/* Top Set Closers */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#3b82f6]">
                        Top Set Closers
                    </h3>
                    {renderPlacementTable(setClosers, '#3b82f6')}
                </div>

                {/* Top Encores */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#be123c]">
                        Top Encores
                    </h3>
                    {renderPlacementTable(encores, '#be123c')}
                </div>
            </div>
        </div>
    );
}