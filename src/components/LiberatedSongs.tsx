import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const [hoveredLibBadge, setHoveredLibBadge] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    const badgeRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});

    useEffect(() => {
        const fetchLiberatedSongs = async () => {
            if (!showIds || showIds.length === 0) {
                setLoading(false);
                onDataLoaded?.(false);
                return;
            }

            try {
                // Fetch all entries for the provided showIds
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
                    .in('entry_show', showIds);

                if (error) throw error;

                // Extract number from last_count and process data
                const extractNumberFromLastCount = (lastCount: string | null): number => {
                    if (!lastCount) return 0;
                    
                    // Handle "Debut" case
                    if (lastCount.trim().toLowerCase() === 'debut') {
                        return 0;
                    }
                    
                    // Extract number from patterns like "86", "98, TD", "104, LIB"
                    const match = lastCount.match(/^(\d+)/);
                    return match ? parseInt(match[1], 10) : 0;
                };

                // Process and format data, then sort by extracted number (show gap)
                const formattedData: LiberatedSong[] = (data?.map(entry => {
                    const shows = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows;
                    const songs = Array.isArray(entry.songs) ? entry.songs[0] : entry.songs;
                    const categories = Array.isArray(songs?.categories) ? songs?.categories[0] : songs?.categories;
                    
                    return {
                        entry_song: entry.entry_song,
                        last_count: entry.last_count,
                        last_show_date: entry.last_show_date,
                        last_show_id: entry.last_show_id,
                        entry_length: entry.entry_length,
                        song_id: songIdMap[entry.entry_song] || '',
                        show_date: shows?.show_date,
                        show_id: entry.entry_show,
                        venue_location: shows?.show_venue_location,
                        category_artwork: categories?.category_artwork
                    };
                }) || [])
                    .map(entry => ({
                        ...entry,
                        _extractedCount: extractNumberFromLastCount(entry.last_count)
                    }))
                    .sort((a, b) => b._extractedCount - a._extractedCount)
                    .slice(0, 8)
                    .map(({ _extractedCount, ...entry }) => entry)
                    .sort((a, b) => {
                        // Sort by show gap (extracted number) in descending order
                        const countA = extractNumberFromLastCount(a.last_count);
                        const countB = extractNumberFromLastCount(b.last_count);
                        return countB - countA;
                    });

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

    // Update tooltip position on scroll/resize
    useEffect(() => {
        if (!hoveredLibBadge || !tooltipPosition) return;

        const updatePosition = () => {
            const badge = badgeRefs.current[hoveredLibBadge];
            if (badge) {
                const rect = badge.getBoundingClientRect();
                setTooltipPosition({ x: rect.right + 4, y: rect.top });
            }
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [hoveredLibBadge, tooltipPosition]);

    // Format date for display (MM.DD.YY)
    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '';

        return dateStr
            .split('-')
            .slice(1)
            .concat(dateStr.substring(2, 4))
            .join('.');
    };

    // Extract show count from last_count (e.g., "105, LIB" -> "105", "86" -> "86", "Debut" -> "")
    const extractShowCount = (lastCount: string): string => {
        if (!lastCount) return '';
        
        // Handle "Debut" case
        if (lastCount.trim().toLowerCase() === 'debut') {
            return '';
        }
        
        // Extract number from patterns like "86", "98, TD", "104, LIB"
        const match = lastCount.match(/^(\d+)/);
        return match ? match[1] : '';
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
            <div className="text-white px-2 py-0.5 mb-0.5 flex justify-between items-center" style={{ backgroundColor: '#3c1e40' }}>
                <h2 className="text-sm font-semibold">
                    Top Returning Songs
                </h2>
                <span className="text-[0.625rem] font-medium">
                    <span className="hidden md:inline bg-primary text-fifth px-1.5 py-0.5 rounded-md">Longest show gaps during the tour</span>
                    <span className="md:hidden bg-primary text-fifth px-1.5 py-0.5 rounded-md">Longest show gaps</span>
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
                                            <div className="flex items-center gap-1 ml-3">
                                                {song.last_count && song.last_count.toUpperCase().includes('LIB') && (
                                                    <div className="relative flex items-center">
                                                        <span 
                                                            ref={(el) => { badgeRefs.current[song.entry_song] = el; }}
                                                            className="inline-flex items-center justify-center font-medium rounded-full text-[0.625rem] px-1.5 shadow-sm bg-yellow-600 text-white cursor-pointer"
                                                            onMouseEnter={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setTooltipPosition({ x: rect.right + 4, y: rect.top });
                                                                setHoveredLibBadge(song.entry_song);
                                                            }}
                                                            onMouseLeave={() => {
                                                                setHoveredLibBadge(null);
                                                                setTooltipPosition(null);
                                                            }}
                                                            onClick={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                if (hoveredLibBadge === song.entry_song) {
                                                                    setHoveredLibBadge(null);
                                                                    setTooltipPosition(null);
                                                                } else {
                                                                    setTooltipPosition({ x: rect.right + 4, y: rect.top });
                                                                    setHoveredLibBadge(song.entry_song);
                                                                }
                                                            }}
                                                        >
                                                            LIB
                                                        </span>
                                                    </div>
                                                )}
                                                {song.category_artwork && (
                                                    <img
                                                        src={song.category_artwork}
                                                        alt={`${song.entry_song} artwork`}
                                                        className="w-4 h-4 rounded object-cover border border-fourth"
                                                        onError={(e) => {
                                                            // Hide the image if it fails to load
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="w-[50px] text-center font-medium text-fifth">
                                        {formatLength(song.entry_length)}
                                    </td>
                                    <td className="px-2 text-fifth font-light">
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
                                    <td className="px-2 text-fifth font-light whitespace-nowrap">
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

            {/* Tooltip Portal */}
            {hoveredLibBadge && tooltipPosition && createPortal(
                <div 
                    className="fixed text-[0.625rem] leading-[0.75rem] font-medium bg-canvas text-fifth px-1.5 py-1 rounded border border-fourth shadow-lg whitespace-normal pointer-events-none"
                    style={{ 
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        maxWidth: '150px',
                        width: 'max-content',
                        zIndex: 99999
                    }}
                >
                    LIB <span className="text-fifth font-normal">(Song Liberation)</span><br /><span className="text-fifth font-light">Song returned after a full calendar year of not being played.</span>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LiberatedSongs;