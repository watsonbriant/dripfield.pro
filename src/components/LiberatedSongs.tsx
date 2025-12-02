import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SongTourPerformancesModal from './SongTourPerformancesModal';

interface LiberatedSongsProps {
    showIds: string[];
    songIdMap: { [songName: string]: string };
    tourId?: string;
    onDataLoaded?: (hasData: boolean) => void;
}

interface LiberatedSong {
    entry_song: string;
    last_count: string;
    last_show_date: string | null;
    last_show_id: string | null;
    entry_length?: string;
    song_id?: string;
    show_date?: string;
    show_id?: string;
    venue_location?: string;
    category_artwork?: string;
}

const LiberatedSongs: React.FC<LiberatedSongsProps> = ({
    showIds,
    songIdMap,
    tourId = '',
    onDataLoaded
}) => {
    const [liberatedSongs, setLiberatedSongs] = useState<LiberatedSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalSongData, setModalSongData] = useState<{
        isOpen: boolean;
        songName: string;
    }>({
        isOpen: false,
        songName: ''
    });

    useEffect(() => {
        const fetchLiberatedSongs = async () => {
            if (!showIds || showIds.length === 0) {
                setLoading(false);
                onDataLoaded?.(false);
                return;
            }

            try {
                // Fetch entries with LIB in last_count
                const { data, error } = await supabase
                    .from('setlist_entries')
                    .select(`
            entry_song,
            last_count,
            last_show_date,
            last_show_id,
            entry_show,
            entry_length,
            songs!inner(
              song_category,
              categories!inner(
                category_artwork
              )
            ),
            shows (
              show_date,
              show_venue_location
            )
          `)
                    .in('entry_show', showIds)
                    .ilike('last_count', '%LIB%')
                    .order('shows(show_date)', { ascending: true })
                    .order('entry_song', { ascending: true });

                if (error) throw error;

                // Process and format data
                const formattedData: LiberatedSong[] = data?.map(entry => {
                    return {
                        entry_song: entry.entry_song,
                        last_count: entry.last_count,
                        last_show_date: entry.last_show_date,
                        last_show_id: entry.last_show_id,
                        entry_length: entry.entry_length,
                        song_id: songIdMap[entry.entry_song] || '',
                        show_date: entry.shows?.show_date,
                        show_id: entry.entry_show,
                        venue_location: entry.shows?.show_venue_location,
                        category_artwork: entry.songs?.categories?.category_artwork
                    };
                }) || [];

                setLiberatedSongs(formattedData);
                onDataLoaded?.(formattedData.length > 0);
            } catch (error) {
                console.error('Error fetching liberated songs:', error);
                onDataLoaded?.(false);
            } finally {
                setLoading(false);
            }
        };

        fetchLiberatedSongs();
    }, [showIds, songIdMap, onDataLoaded]);

    // Format date for display (MM.DD.YY)
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';

        return dateStr
            .split('-')
            .slice(1)
            .concat(dateStr.substring(2, 4))
            .join('.');
    };

    // Extract show count from last_count (e.g., "105, LIB" -> "105")
    const extractShowCount = (lastCount: string): string => {
        const match = lastCount.match(/(\d+),?\s*LIB/i);
        const result = match ? match[1] : '';
        return result;
    };

    // Format entry_length to remove leading zeroes
    const formatLength = (length?: string): string => {
        if (!length) return '';

        // Split by colon to get parts
        const parts = length.split(':');

        if (parts.length === 3) {
            // Format: HH:MM:SS
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parts[2];

            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`;
            } else {
                return `${minutes}:${seconds}`;
            }
        }

        return length;
    };

    const handleSongClick = (songName: string) => {
        setModalSongData({
            isOpen: true,
            songName: songName
        });
    };


    // Don't render anything if there are no liberated songs
    if (!loading && liberatedSongs.length === 0) {
        return null;
    }

    return (
        <div className="bg-primary border border-fourth pb-0.5 shadow-xl">
            <div className="text-black px-2 py-0.5 mb-0.5 flex justify-between items-center" style={{ backgroundColor: '#fbbf24' }}>
                <h2 className="text-sm font-semibold">
                    Liberated Songs
                </h2>
                <span className="text-xs font-medium">
                    <span className="hidden md:inline">Songs returning after ≥ 100 shows</span>
                    <span className="md:hidden">≥ 100 show gap</span>
                </span>
            </div>
            {loading ? (
                <div className="text-center py-4">
                    <p className="text-fifth/70">Loading...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-max">
                        <tbody>
                            {liberatedSongs.map((song, index) => (
                                <tr
                                    key={`${song.entry_song}-${index}`}
                                    className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                                >
                                    <td className="pl-3 text-fifth">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className="font-medium text-fifth cursor-pointer hover:underline leading-[0.75rem]"
                                                onClick={() => handleSongClick(song.entry_song)}
                                            >
                                                {song.entry_song}
                                            </span>
                                            {song.category_artwork && (
                                                <img
                                                    src={song.category_artwork}
                                                    alt={`${song.entry_song} artwork`}
                                                    className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                                                    onError={(e) => {
                                                        // Hide the image if it fails to load
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="w-[50px] text-center font-medium text-fifth">
                                        {formatLength(song.entry_length)}
                                    </td>
                                    <td className="px-2 py-0.5 text-fifth font-light">
                                        {song.show_date && (
                                            <>
                                                <span className="font-light">Returned&nbsp;&nbsp;</span>
                                                {song.show_id ? (
                                                    <Link
                                                        to={`/setlist/${song.show_id}`}
                                                        className="font-medium cursor-pointer hover:underline"
                                                    >
                                                        {formatDate(song.show_date)}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">{formatDate(song.show_date)}</span>
                                                )}
                                                {song.venue_location && <span className="text-fifth/70 font-light">&nbsp;[{song.venue_location.replace(/[\[\]]/g, '')}]</span>}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                        {song.last_show_date && (
                                            <>
                                                <span className="font-light">LTP&nbsp;&nbsp;</span>
                                                {song.last_show_id ? (
                                                    <Link
                                                        to={`/setlist/${song.last_show_id}`}
                                                        className="font-medium cursor-pointer hover:underline"
                                                    >
                                                        {song.last_show_date}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">{song.last_show_date}</span>
                                                )}
                                                {extractShowCount(song.last_count) && (
                                                    <span className="text-fifth/70 font-light">
                                                        &nbsp;({extractShowCount(song.last_count)} shows)
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Song Tour Performances Modal */}
            <SongTourPerformancesModal
                isOpen={modalSongData.isOpen}
                onClose={() => setModalSongData({ isOpen: false, songName: '' })}
                songName={modalSongData.songName}
                tourId={tourId}
                currentShowId=""
            />
        </div>
    );
};

export default LiberatedSongs;