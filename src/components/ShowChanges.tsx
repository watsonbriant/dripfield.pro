import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoveVertical, RefreshCw, Plus, ArrowDownUp, Minus, FileMusic, X } from 'lucide-react';
import SetlistDisplay from './SetlistDisplay';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';

interface ShowChange {
    show_change_uuid: string;
    show_id: string;
    change_type: string;
    change_order: number;
    change: string;
}

interface SetlistEntry {
    entry_id: string;
    entry_song: string;
    entry_short: string | null;
    entry_segue: string | null;
    entry_placement: string;
    entry_setorder: number;
    entry_set: string;
    entry_setnum: number;
    songs: {
        song_id: string;
    };
}

interface ShowData {
    show_date: string;
    show_subvenue: string;
    show_venue_location: string;
    show_group: string;
}

interface ShowChangesProps {
    showId: string;
    className?: string;
    openModal?: boolean;
    setOpenModal?: (open: boolean) => void;
}

const getChangeIcon = (changeType: string) => {
    const iconProps = { className: "w-3 h-3 text-white" };

    switch (changeType) {
        case 'move':
            return { icon: <MoveVertical {...iconProps} />, bgColor: 'bg-yellow-600' };
        case 'replace':
            return { icon: <RefreshCw {...iconProps} />, bgColor: 'bg-orange-600' };
        case 'add':
            return { icon: <Plus {...iconProps} />, bgColor: 'bg-green-600' };
        case 'swap':
            return { icon: <ArrowDownUp {...iconProps} />, bgColor: 'bg-yellow-600' };
        case 'cut':
            return { icon: <Minus {...iconProps} />, bgColor: 'bg-red-600' };
        default:
            return { icon: null, bgColor: 'bg-gray-600' };
    }
};

export default function ShowChanges({ showId, className = '', openModal, setOpenModal }: ShowChangesProps) {
    const navigate = useNavigate();
    const [changes, setChanges] = useState<ShowChange[]>([]);
    const [setlistUrl, setSetlistUrl] = useState<string | null>(null);
    const [setlistRecordExists, setSetlistRecordExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showData, setShowData] = useState<ShowData | null>(null);
    const [setlist, setSetlist] = useState<SetlistEntry[]>([]);

    // Use effect to sync with external control
    useEffect(() => {
        if (openModal !== undefined) {
            setIsModalOpen(openModal);
        }
    }, [openModal]);

    // Update the modal close handler
    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (setOpenModal) {
            setOpenModal(false);
        }
    };

    // Update the modal open handler
    const handleOpenModal = () => {
        setIsModalOpen(true);
        if (setOpenModal) {
            setOpenModal(true);
        }
    };

    useEffect(() => {
        async function fetchShowData() {
            if (!showId) {
                return;
            }

            try {
                // Fetch show changes
                const { data: changesData, error: changesError } = await supabase
                    .from('show_changes')
                    .select('*')
                    .eq('show_id', showId)
                    .order('change_order', { ascending: true });

                if (changesError) {
                    console.error('Supabase error (changes):', changesError);
                    throw changesError;
                }

                // Fetch setlist URL
                const { data: setlistData, error: setlistError } = await supabase
                    .from('show_setlists')
                    .select('setlist_url')
                    .eq('show_id', showId)
                    .single();

                if (setlistError && setlistError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error('Supabase error (setlist):', setlistError);
                }

                // Store whether a setlist record exists (not just the URL)
                const hasSetlistRecord = !setlistError || setlistError.code !== 'PGRST116';

                // Fetch show details
                const { data: showDetails, error: showError } = await supabase
                    .from('shows')
                    .select('show_date, show_subvenue, show_venue_location, show_group')
                    .eq('show_id', showId)
                    .single();

                if (showError) {
                    console.error('Supabase error (show):', showError);
                    // Don't throw here - we still want to set what data we can
                }

                // Fetch setlist entries
                const { data: setlistEntries, error: setlistError2 } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_id,
                        entry_song,
                        entry_short,
                        entry_segue,
                        entry_placement,
                        entry_setorder,
                        entry_set,
                        entry_setnum,
                        songs (
                            song_id
                        )
                    `)
                    .eq('entry_show', showId)
                    .order('entry_set', { ascending: true })
                    .order('entry_setnum', { ascending: true });

                if (setlistError2) {
                    console.error('Supabase error (setlist entries):', setlistError2);
                }

                // Debug logs
                console.log('Debug - setlistData:', setlistData);
                console.log('Debug - setlistUrl:', setlistData?.setlist_url);
                console.log('Debug - setlistRecordExists:', hasSetlistRecord);
                console.log('Debug - changesData:', changesData);
                console.log('Debug - showDetails:', showDetails);

                setChanges(changesData || []);
                setSetlistUrl(setlistData?.setlist_url || null);
                setSetlistRecordExists(hasSetlistRecord);
                setShowData(showDetails || null);
                setSetlist(setlistEntries || []);
            } catch (error) {
                console.error('Error fetching show data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchShowData();
    }, [showId]);

    useEffect(() => {
        console.log('isModalOpen state changed to:', isModalOpen);
    }, [isModalOpen]);

    // Don't render anything while loading
    if (loading) {
        return null;
    }

    // If no setlist record exists, hide the entire component
    if (!setlistRecordExists) {
        return null;
    }

    return (
        <>
            <div className={`bg-primary border border-black rounded-lg p-3 text-sm ${className}`}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                        Setlist Changes
                    </h2>
                    {setlistUrl && (
                        <button
                            onClick={handleOpenModal}
                            className="bg-secondary hover:bg-[#f9ae37] border border-black rounded-lg p-1.5 transition-colors"
                        >
                            <FileMusic
                                className="h-5 w-5 text-black"
                            />
                        </button>
                    )}
                </div>

                {changes.length === 0 ? (
                    <div className="text-black">
                        No changes from original setlist.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {changes.map((change) => {
                            const { icon, bgColor } = getChangeIcon(change.change_type);

                            return (
                                <div
                                    key={change.show_change_uuid}
                                    className="flex items-center gap-2"
                                >
                                    <div className={`${bgColor} rounded-full p-1 flex-shrink-0 border border-black`}>
                                        {icon}
                                    </div>
                                    <div
                                        className="text-black [&_a]:text-black hover:[&_a]:text-black/50 [&_a]:font-bold"
                                        dangerouslySetInnerHTML={{ __html: change.change }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for setlist image - Now outside the main div and will always be available */}
            {isModalOpen && setlistUrl && showData && (
                <>
                    {console.log('Modal is rendering - isModalOpen:', isModalOpen, 'setlistUrl:', setlistUrl)}
                    <div
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto min-h-screen"
                        style={{ 
                            position: 'fixed',
                            top: -24,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            minHeight: '100vh',
                            minHeight: '100dvh' // Dynamic viewport height for better mobile support
                        }}
                        onClick={handleCloseModal}
                    >
                        <div
                            className="relative bg-primary rounded-lg overflow-hidden border-2 border-black my-8 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Left side - Setlist Scan */}
                                <div className="p-4 bg-secondary border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col items-center">
                                    <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">Setlist Scan</h2>
                                    <div className="p-2 rounded flex justify-center">
                                        <img
                                            src={setlistUrl}
                                            alt="Setlist"
                                            className="rounded-lg max-h-[500px] md:max-h-[500px] object-contain border border-black"
                                        />
                                    </div>
                                </div>

                                {/* Right side - Actual Setlist (only show if there are changes) */}

                                <div className="w-full md:w-[400px] p-4 bg-canvas flex flex-col">
                                    <div className="flex justify-center mb-4">
                                        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">Actual Setlist</h2>
                                    </div>

                                    {/* Show details */}
                                    <div className="text-black mb-2">
                                        <div className="font-bold text-lg">{showData.show_group}</div>
                                        <div className="font-semibold">{formatInTimeZone(new Date(showData.show_date), 'UTC', 'MMMM d, yyyy')}</div>
                                        <div>{showData.show_subvenue}</div>
                                        <div className="mb-2">{showData.show_venue_location}</div>
                                    </div>

                                    {/* Setlist */}
                                    <div className="bg-primary p-4 rounded-lg border border-black mb-4">
                                        <SetlistDisplay setlist={setlist} navigate={navigate} />
                                    </div>

                                    {/* Set Changes */}
                                        <div className="mt-2 bg-primary p-3 rounded-lg border border-black">
                                            <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-2 pt-1.5 pb-0.5 rounded-full border border-black mb-2">
                                                Setlist Changes
                                            </h2>
                                            {changes.length === 0 ? (
                                                <div className="text-black text-xs">
                                                    No changes from original setlist.
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {changes.map((change) => {
                                                        const { icon, bgColor } = getChangeIcon(change.change_type);
                                                        return (
                                                            <div key={change.show_change_uuid} className="flex items-center gap-2">
                                                                <div className={`${bgColor} rounded-full p-1 flex-shrink-0 border border-black`}>
                                                                    {icon}
                                                                </div>
                                                                <div
                                                                    className="text-black text-xs [&_a:hover]:text-[#a9682e]/80 [&_a]:font-semibold"
                                                                    dangerouslySetInnerHTML={{ __html: change.change }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                </div>

                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-2 right-2 bg-[#f9ae37] hover:bg-tertiary border border-black rounded-full p-2 transition-colors"
                            >
                                <X className="w-5 h-5 text-black" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}