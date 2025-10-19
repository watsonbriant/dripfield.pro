import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ShowData, SongData } from '../types/showTypes';
import { formatDate, getShowDisplayData } from '../utils/showUtils';

interface CallbacksEditorProps {
    selectedShow: ShowData;
    editedShow: ShowData | null;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    allShows: ShowData[];
    songs: SongData[];
}

export const CallbacksEditor: React.FC<CallbacksEditorProps> = ({
    selectedShow,
    editedShow,
    isEditing,
    onInputChange,
    allShows,
    songs
}) => {
    const callbacksTextareaRef = useRef<HTMLTextAreaElement>(null);
    const songDropdownRef = useRef<HTMLDivElement>(null);
    const showDropdownRef = useRef<HTMLDivElement>(null);
    
    // Song dropdown state
    const [songSearchTerm, setSongSearchTerm] = useState('');
    const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);
    
    // Show dropdown state for callbacks
    const [showSearchTerm, setShowSearchTerm] = useState('');
    const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (songDropdownRef.current && !songDropdownRef.current.contains(event.target as Node)) {
                setIsSongDropdownOpen(false);
            }
            if (showDropdownRef.current && !showDropdownRef.current.contains(event.target as Node)) {
                setIsShowDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSongs = React.useMemo(() => {
        return songs.filter(song => 
            song.song.toLowerCase().includes(songSearchTerm.toLowerCase())
        );
    }, [songs, songSearchTerm]);

    const filteredShowsForDropdown = React.useMemo(() => {
        return allShows.filter(show => {
            const searchLower = showSearchTerm.toLowerCase();
            const dateStr = formatDate(show.show_date);
            return (
                dateStr.includes(searchLower) ||
                show.show_canonid?.toString().includes(searchLower) ||
                show.show_group.toLowerCase().includes(searchLower) ||
                show.show_venue_location?.toLowerCase().includes(searchLower) ||
                show.show_subvenue.toLowerCase().includes(searchLower)
            );
        });
    }, [allShows, showSearchTerm]);

    const insertSongLink = (song: SongData) => {
        if (!callbacksTextareaRef.current || !editedShow) return;
        
        const textarea = callbacksTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = editedShow.show_callbacks || '';
        
        const linkText = `<a href="https://dripfield.pro/song/${song.song_id}">${song.song}</a>`;
        const newValue = currentValue.slice(0, start) + linkText + currentValue.slice(end);
        
        // Create synthetic event to update the value
        const syntheticEvent = {
            target: { name: 'show_callbacks', value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onInputChange(syntheticEvent);
        
        // Reset dropdown state
        setIsSongDropdownOpen(false);
        setSongSearchTerm('');
        
        // Refocus textarea and position cursor after inserted link
        setTimeout(() => {
            if (callbacksTextareaRef.current) {
                callbacksTextareaRef.current.focus();
                const newPosition = start + linkText.length;
                callbacksTextareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const insertLineBreak = () => {
        if (!callbacksTextareaRef.current || !editedShow) return;
        
        const textarea = callbacksTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = editedShow.show_callbacks || '';
        
        const breakText = '<br />';
        const newValue = currentValue.slice(0, start) + breakText + '\n' + currentValue.slice(end);
        
        // Create synthetic event to update the value
        const syntheticEvent = {
            target: { name: 'show_callbacks', value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onInputChange(syntheticEvent);
        
        // Refocus textarea and position cursor after the line break
        setTimeout(() => {
            if (callbacksTextareaRef.current) {
                callbacksTextareaRef.current.focus();
                const newPosition = start + breakText.length + 1; // +1 for the newline
                callbacksTextareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const insertArrow = () => {
        if (!callbacksTextareaRef.current || !editedShow) return;
        
        const textarea = callbacksTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = editedShow.show_callbacks || '';
        
        const arrowText = '→';
        const newValue = currentValue.slice(0, start) + arrowText + currentValue.slice(end);
        
        // Create synthetic event to update the value
        const syntheticEvent = {
            target: { name: 'show_callbacks', value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onInputChange(syntheticEvent);
        
        // Refocus textarea and position cursor after the arrow
        setTimeout(() => {
            if (callbacksTextareaRef.current) {
                callbacksTextareaRef.current.focus();
                const newPosition = start + arrowText.length;
                callbacksTextareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const insertShowLink = (show: ShowData) => {
        if (!callbacksTextareaRef.current || !editedShow) return;
        
        const textarea = callbacksTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = editedShow.show_callbacks || '';
        
        const linkText = `<a href="https://dripfield.pro/setlist/${show.show_id}">${formatDate(show.show_date)}</a>`;
        const newValue = currentValue.slice(0, start) + linkText + currentValue.slice(end);
        
        // Create synthetic event to update the value
        const syntheticEvent = {
            target: { name: 'show_callbacks', value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onInputChange(syntheticEvent);
        
        // Reset dropdown state
        setIsShowDropdownOpen(false);
        setShowSearchTerm('');
        
        // Refocus textarea and position cursor after inserted link
        setTimeout(() => {
            if (callbacksTextareaRef.current) {
                callbacksTextareaRef.current.focus();
                const newPosition = start + linkText.length;
                callbacksTextareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };


    if (!selectedShow?.show_callbacks && !isEditing) return null;

    return (
        <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-fifth">Callbacks</label>
                
                {/* Button group - only show when editing */}
                {isEditing && (
                    <div className="flex items-center gap-2">
                        {/* Arrow button */}
                        <button
                            type="button"
                            onClick={insertArrow}
                            className="flex items-center gap-1 bg-fourth text-primary px-2 py-1 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-xs font-medium"
                            title="Insert arrow"
                        >
                            →
                        </button>
                        
                        {/* Break tag button */}
                        <button
                            type="button"
                            onClick={insertLineBreak}
                            className="bg-fourth text-primary px-2 py-1 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-xs font-medium"
                            title="Insert <br /> tag"
                        >
                            BR
                        </button>
                        
                        {/* Show dropdown */}
                        <div className="relative" ref={showDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsShowDropdownOpen(!isShowDropdownOpen)}
                                className="flex items-center gap-1 bg-fourth text-primary px-2 py-1 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-xs font-medium"
                            >
                                Insert Show
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            
                            {isShowDropdownOpen && (
                                <div className="absolute right-0 mt-1 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-96 max-h-64 overflow-y-auto">
                                    <div className="p-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={showSearchTerm}
                                                onChange={(e) => setShowSearchTerm(e.target.value)}
                                                placeholder="Search shows..."
                                                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                            />
                                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto divide-y divide-black/10">
                                        {filteredShowsForDropdown.map((show) => (
                                            <button
                                                key={show.show_id}
                                                type="button"
                                                onClick={() => insertShowLink(show)}
                                                className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                            >
                                                {(() => {
                                                    const { dateStr, canonIdStr, locationStr } = getShowDisplayData(show);
                                                    return (
                                                        <>
                                                            <span className="font-medium">{dateStr}</span>
                                                            {canonIdStr}
                                                            {locationStr}
                                                        </>
                                                    );
                                                })()}
                                            </button>
                                        ))}
                                        {filteredShowsForDropdown.length === 0 && (
                                            <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                No shows found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Song dropdown */}
                        <div className="relative" ref={songDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
                                className="flex items-center gap-1 bg-fourth text-primary px-2 py-1 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-xs font-medium"
                            >
                                Insert Song
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            
                            {isSongDropdownOpen && (
                                <div className="absolute right-0 mt-1 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-64 max-h-64 overflow-y-auto">
                                    <div className="p-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={songSearchTerm}
                                                onChange={(e) => setSongSearchTerm(e.target.value)}
                                                placeholder="Search songs..."
                                                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                            />
                                            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto divide-y divide-black/10">
                                        {filteredSongs.map((song) => (
                                            <button
                                                key={song.song_id}
                                                type="button"
                                                onClick={() => insertSongLink(song)}
                                                className="w-full text-left px-2 py-1 font-medium text-xs text-fifth hover:bg-canvas transition-colors"
                                            >
                                                {song.song}
                                            </button>
                                        ))}
                                        {filteredSongs.length === 0 && (
                                            <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                No songs found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {isEditing ? (
                <textarea
                    ref={callbacksTextareaRef}
                    name="show_callbacks"
                    value={editedShow?.show_callbacks || ''}
                    onChange={onInputChange}
                    rows={4}
                    className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm font-mono"
                    placeholder="Enter callbacks HTML..."
                />
            ) : (
                <div 
                    className="w-full px-2 py-1.5 rounded-md border font-light border-secondary bg-canvas/50 text-fifth text-sm min-h-[100px] [&_a]:font-medium [&_a]:text-fourth"
                    dangerouslySetInnerHTML={{ __html: selectedShow.show_callbacks }}
                />
            )}
        </div>
    );
};
