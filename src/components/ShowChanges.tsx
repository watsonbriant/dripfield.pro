import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MoveVertical, RefreshCw, Plus, ArrowDownUp, MoveRight, Minus, FileMusic, X, SquareCheckBig } from 'lucide-react';
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
    const strokeWidth = 2.5;
    
    switch (changeType) {
        case 'move':
            return { icon: <MoveVertical className="w-4 h-4 text-yellow-600" strokeWidth={strokeWidth} /> };
        case 'replace':
            return { icon: <RefreshCw className="w-4 h-4 text-orange-600" strokeWidth={strokeWidth} /> };
        case 'add':
            return { icon: <Plus className="w-4 h-4 text-green-600" strokeWidth={strokeWidth} /> };
        case 'swap':
            return { icon: <ArrowDownUp className="w-4 h-4 text-yellow-600" strokeWidth={strokeWidth} /> };
        case 'cut':
            return { icon: <Minus className="w-4 h-4 text-red-600" strokeWidth={strokeWidth} /> };
        case 'pick':
            return { icon: <SquareCheckBig className="w-4 h-4 text-green-600" strokeWidth={strokeWidth} /> };
        default:
            return { icon: null };
    }
};

// Helper function to render change text with arrow replacement
const renderChangeText = (changeHtml: string) => {
    // First, we need to parse the HTML string to handle any existing HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = changeHtml;
    const textContent = tempDiv.innerHTML;
    
    // Split by arrow and reconstruct with React components
    if (textContent.includes('→')) {
        const parts = textContent.split('→');
        return (
            <>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span dangerouslySetInnerHTML={{ __html: part.trim() }} />
                        {index < parts.length - 1 && (
                            <MoveRight className="inline-block mx-1 text-red-600" size={16} />
                        )}
                    </React.Fragment>
                ))}
            </>
        );
    }
    
    // If no arrows, return the original HTML
    return <span dangerouslySetInnerHTML={{ __html: changeHtml }} />;
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
            <div className={`bg-primary border border-secondary rounded-lg p-3 text-sm ${className}`}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium text-fifth mb-2">
                        Setlist Changes
                    </h2>
                    {setlistUrl && (
                        <button
                            onClick={handleOpenModal}
                            className="bg-tertiary hover:bg-primary border border-secondary rounded p-1.5 transition-colors"
                        >
                            <FileMusic
                                className="h-5 w-5 text-fifth"
                            />
                        </button>
                    )}
                </div>

                {changes.length === 0 ? (
                    <div className="text-fifth">
                        No changes from original setlist.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {changes.map((change, index) => {
                            const { icon } = getChangeIcon(change.change_type);

                            return (
                                <div
                                    key={change.show_change_uuid}
                                    className={`flex items-center gap-2 ${index !== 0 ? 'pt-1 border-t border-[#d8d7d7]' : ''}`}
                                >
                                    <div className="flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div className="text-fifth font-light [&_a]:font-medium text-xs">
                                        {renderChangeText(change.change)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal for setlist image - Now outside the main div and will always be available */}
            {isModalOpen && setlistUrl && showData && (
                <>
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
                            className="relative bg-primary rounded-lg overflow-hidden border-2 border-secondary my-8 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Left side - Setlist Scan */}
                                <div className="p-4 bg-primary border-b-2 md:border-b-0 md:border-r-2 border-secondary flex flex-col items-center">
                                    <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Setlist Scan</h2>
                                    <div className="pt-4 rounded flex justify-center">
                                        <img
                                            src={setlistUrl}
                                            alt="Setlist"
                                            className="rounded-lg max-h-[500px] md:max-h-[500px] object-contain border border-secondary"
                                        />
                                    </div>
                                </div>

                                {/* Right side - Actual Setlist (only show if there are changes) */}

                                <div className="w-full md:w-[400px] p-3 bg-canvas flex flex-col">
                                    <div className="flex justify-center mb-4">
                                        <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Actual Setlist</h2>
                                    </div>

                                    {/* Show details */}
                                    <div className="text-fifth mb-2">
                                        <div className="font-medium text-lg">{showData.show_group}</div>
                                        <div className="font-medium">{formatInTimeZone(new Date(showData.show_date), 'UTC', 'MMMM d, yyyy')}</div>
                                        <div className="font-normal">{showData.show_subvenue}</div>
                                        <div className="font-light mb-2">{showData.show_venue_location}</div>
                                    </div>

                                    {/* Setlist */}
                                    <div className="bg-primary p-3 rounded-lg border border-secondary mb-4">
                                        <SetlistDisplay setlist={setlist} navigate={navigate} />
                                    </div>

                                    {/* Set Changes */}
                                    <div className="flex justify-center mb-2 mt-2">
                                        <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Setlist Changes</h2>
                                    </div>
                                        <div className="mt-2 bg-primary p-3 rounded-lg border border-secondary">
                                            {changes.length === 0 ? (
                                                <div className="text-fifth text-xs">
                                                    No changes from original setlist.
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {changes.map((change, index) => {
                                                        const { icon } = getChangeIcon(change.change_type);
                                                        return (
                                                            <div 
                                                                key={change.show_change_uuid} 
                                                                className={`flex items-center gap-2 ${index !== 0 ? 'pt-1 border-t border-[#d8d7d7]' : ''}`}
                                                            >
                                                                <div className="flex-shrink-0">
                                                                    {icon}
                                                                </div>
                                                                <div className="text-fifth text-xs [&_a]:font-medium font-light">
                                                                    {renderChangeText(change.change)}
                                                                </div>
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
                                className="absolute top-2 right-2 bg-red-600 hover:bg-tertiary border border-secondary rounded-lg p-2 transition-colors"
                            >
                                <X className="w-5 h-5 text-fifth" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}