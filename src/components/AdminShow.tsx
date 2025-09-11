import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShowModal from './ShowModal';
import { ShowReleaseModal } from './ShowReleaseModal';

// Convert UTC datetime to Eastern Time for display
const convertToEasternDisplay = (utcDatetime: string | null): string => {
    if (!utcDatetime) return '';
    
    const utcDate = new Date(utcDatetime);
    
    // Create a new date representing the same moment in Eastern Time
    const easternDateString = utcDate.toLocaleString('en-CA', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Convert from "YYYY-MM-DD, HH:MM" to "YYYY-MM-DDTHH:MM"
    const formatted = easternDateString.replace(', ', 'T');
    
    return formatted;
};

// Convert Eastern Time input to UTC for storage
const convertFromEasternToUTC = (easternDatetime: string): string => {
    if (!easternDatetime) return '';
    
    try {
        // Parse the datetime-local input as Eastern Time
        const [datePart, timePart] = easternDatetime.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute] = timePart.split(':').map(Number);
        
        // Create a date in Eastern Time using Intl.DateTimeFormat to handle EST/EDT automatically
        const easternDate = new Date();
        easternDate.setFullYear(year, month - 1, day);
        easternDate.setHours(hour, minute, 0, 0);
        
        // Convert to Eastern timezone string and then parse as UTC
        const easternISO = easternDate.toLocaleString('sv-SE', { timeZone: 'America/New_York' }).replace(' ', 'T') + ':00.000Z';
        
        // Better approach: use the fact that we know the offset
        const tempUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
        
        // Get the timezone offset for this specific date (handles EST vs EDT)
        const testDate = new Date(year, month - 1, day);
        const easternOffset = testDate.toLocaleString('en', { timeZone: 'America/New_York', timeZoneName: 'short' }).includes('EDT') ? -4 : -5;
        
        // Apply the offset to convert Eastern to UTC
        const utcDate = new Date(tempUtc.getTime() - (easternOffset * 60 * 60 * 1000));
        
        const isoString = utcDate.toISOString();
        
        return isoString;
    } catch (error) {
        return '';
    }
};

interface ShowData {
    show_id: string;
    show_date: string;
    show_canonid: number | null;
    show_group: string;
    show_tour: string;
    show_subvenue: string;
    show_subvenue_venue: string | null;
    show_venue_location: string | null;
    show_iscanon: boolean;
    show_year: string;
    show_issetlistgame: boolean;
    show_detail: string | null;
    show_alert: string | null;
    show_coachnotes: string | null;
    show_time: string | null;
    show_callbacks: string | null;
    show_wl_link: string | null;
}

interface GroupData {
    group: string;
}

interface TourData {
    tour: string;
    tour_canonid: number;
}

interface SubvenueData {
    subvenue: string;
    subvenue_venue_location: string | null;
}

interface YearData {
    year: string;
}

interface SongData {
    song: string;
    song_id: string;
}

interface ReleaseShow {
  release_id: string;
  release_order: number;
  releases: {
    release_displayname: string;
    release_service: string | null;
  };
}

export const AdminShow: React.FC = () => {
    const [allShows, setAllShows] = useState<ShowData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedShow, setEditedShow] = useState<ShowData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [isNewShow, setIsNewShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);
    const showDataLoadedRef = useRef(false);

    // Reference data for dropdowns
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [tours, setTours] = useState<TourData[]>([]);
    const [subvenues, setSubvenues] = useState<SubvenueData[]>([]);
    const [years, setYears] = useState<YearData[]>([]);
    const [songs, setSongs] = useState<SongData[]>([]);
    
    // Song dropdown state
    const [songSearchTerm, setSongSearchTerm] = useState('');
    const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);
    const songDropdownRef = useRef<HTMLDivElement>(null);
    const callbacksTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Show dropdown state for callbacks
    const [showSearchTerm, setShowSearchTerm] = useState('');
    const [isShowDropdownOpen, setIsShowDropdownOpen] = useState(false);
    const showDropdownRef = useRef<HTMLDivElement>(null);

    const [showReleases, setShowReleases] = useState<ReleaseShow[]>([]);
    const [loadingReleases, setLoadingReleases] = useState(false);

    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
    const [releaseModalMode, setReleaseModalMode] = useState<'add' | 'edit'>('add');
    const [selectedReleaseForEdit, setSelectedReleaseForEdit] = useState<{
        releaseId: string;
        order: number;
    } | null>(null);

    const handleAddRelease = () => {
        setReleaseModalMode('add');
        setSelectedReleaseForEdit(null);
        setIsReleaseModalOpen(true);
    };

        const handleEditRelease = (releaseId: string, order: number) => {
        setReleaseModalMode('edit');
        setSelectedReleaseForEdit({ releaseId, order });
        setIsReleaseModalOpen(true);
    };

        const handleReleaseModalClose = () => {
        setIsReleaseModalOpen(false);
        setSelectedReleaseForEdit(null);
    };

        const handleReleaseModalSave = () => {
        fetchShowReleases(selectedShow!.show_id);
        handleReleaseModalClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
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

    // Only fetch data once on mount
    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllShows();
            fetchReferenceData();
            mountedRef.current = true;
        }
    }, []);

    // Load the selected show from localStorage after shows are loaded
    useEffect(() => {
        if (allShows.length > 0 && !showDataLoadedRef.current) {
            showDataLoadedRef.current = true;
            
            try {
            const storedShowId = localStorage.getItem('adminSelectedShowId');
            
            if (storedShowId) {
                const storedShow = allShows.find(show => show.show_id === storedShowId);
                
                if (storedShow) {
                setSelectedShow(storedShow);
                setEditedShow(storedShow);
                // Fetch releases for the stored show
                fetchShowReleases(storedShowId);
                }
            }
            } catch (error) {
            }
        }
    }, [allShows]);

    // Handle visibility change to reload data when returning to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refresh the shows list when returning to the tab
                fetchAllShows();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    async function fetchAllShows() {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            // Use pagination to fetch all shows
            let allShowsData: ShowData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000; // Adjust based on your database size
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('shows')
                    .select('*')
                    .order('show_date', { ascending: false })
                    .order('show_canonid', { ascending: false, nullsLast: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allShowsData = [...allShowsData, ...data];
                    page++;
                    
                    // Update progress (5-95%)
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    
                    // If we got fewer records than the page size, we're done
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllShows(allShowsData || []);
            
            setLoadingProgress(100);
            // Small delay to ensure smooth transition
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    }

    async function fetchReferenceData() {
        try {
            // Fetch groups
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('group')
                .order('group', { ascending: true });
            if (groupsError) throw groupsError;
            setGroups(groupsData || []);

            // Fetch tours
            const { data: toursData, error: toursError } = await supabase
                .from('tours')
                .select('tour, tour_canonid')
                .order('tour_canonid', { ascending: true });
            if (toursError) throw toursError;
            setTours(toursData || []);

            // Fetch subvenues
            const { data: subvenuesData, error: subvenuesError } = await supabase
                .from('subvenues')
                .select('subvenue, subvenue_venue_location')
                .order('subvenue', { ascending: true });
            if (subvenuesError) throw subvenuesError;
            setSubvenues(subvenuesData || []);

            // Fetch years
            const { data: yearsData, error: yearsError } = await supabase
                .from('years')
                .select('year')
                .order('year', { ascending: true });
            if (yearsError) throw yearsError;
            setYears(yearsData || []);

            // Fetch songs
            let allSongsData: SongData[] = [];
            let songPage = 0;
            let hasMoreSongs = true;
            const songPageSize = 1000;

            while (hasMoreSongs) {
                const { data: songsData, error: songsError } = await supabase
                    .from('songs')
                    .select('song, song_id')
                    .order('song', { ascending: true })
                    .range(songPage * songPageSize, (songPage + 1) * songPageSize - 1);
                
                if (songsError) throw songsError;
                
                if (songsData && songsData.length > 0) {
                    allSongsData = [...allSongsData, ...songsData];
                    songPage++;
                    hasMoreSongs = songsData.length === songPageSize;
                } else {
                    hasMoreSongs = false;
                }
            }
            setSongs(allSongsData || []);
        } catch (error) {
        }
    }

    async function fetchShowReleases(showId: string) {
        try {
            setLoadingReleases(true);
            
            // Use pagination for releases_shows
            let allReleasesData: ReleaseShow[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('releases_shows')
                    .select(`
                        release_id,
                        release_order,
                        releases (
                            release_displayname,
                            release_service
                        )
                    `)
                    .eq('show_id', showId)
                    .order('release_order', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allReleasesData = [...allReleasesData, ...data];
                    page++;
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setShowReleases(allReleasesData || []);
        } catch (error) {
            setShowReleases([]);
        } finally {
            setLoadingReleases(false);
        }
    }

    const formatDate = (dateString: string) => {
        // Parse the date as UTC and adjust for timezone
        const date = new Date(dateString + 'T00:00:00Z');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        const year = date.getUTCFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
    };

    const getShowDisplayText = (show: ShowData) => {
        const dateStr = formatDate(show.show_date);
        const canonIdStr = show.show_canonid ? ` [${show.show_canonid}]` : '';
        const locationStr = ` [${show.show_group} – ${show.show_venue_location || 'Unknown'}]`;
        return (
            <>
                <span className="font-medium">{dateStr}</span>
                {canonIdStr}
                {locationStr}
            </>
        );
    };

    const filteredShows = React.useMemo(() => {
        return allShows.filter(show => {
            const searchLower = searchTerm.toLowerCase();
            const dateStr = formatDate(show.show_date);
            return (
                dateStr.includes(searchLower) ||
                show.show_canonid?.toString().includes(searchLower) ||
                show.show_group.toLowerCase().includes(searchLower) ||
                show.show_venue_location?.toLowerCase().includes(searchLower) ||
                show.show_subvenue.toLowerCase().includes(searchLower)
            );
        });
    }, [allShows, searchTerm]);

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

    const handleShowSelect = (show: ShowData) => {
        setSelectedShow(show);
        setEditedShow(show);
        setIsDropdownOpen(false);
        setSearchTerm('');
        setIsEditing(false);
        
        // Fetch releases for this show
        fetchShowReleases(show.show_id);
        
        // Save the selected show ID to localStorage
        try {
            localStorage.setItem('adminSelectedShowId', show.show_id);
        } catch (error) {
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editedShow) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'show_date' && value) {
            // Ensure the date is stored in YYYY-MM-DD format
            setEditedShow({
                ...editedShow,
                [name]: value,
            });
        } else {
            const newValue = type === 'checkbox' ? checked : (value === '' ? null : value);
            
            setEditedShow({
                ...editedShow,
                [name]: newValue,
            });
        }
    };

    const insertSongLink = (song: SongData) => {
        if (!callbacksTextareaRef.current || !editedShow) return;
        
        const textarea = callbacksTextareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = editedShow.show_callbacks || '';
        
        const linkText = `<a href="https://dripfield.pro/song/${song.song_id}">${song.song}</a>`;
        const newValue = currentValue.slice(0, start) + linkText + currentValue.slice(end);
        
        setEditedShow({
            ...editedShow,
            show_callbacks: newValue
        });
        
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
        
        setEditedShow({
            ...editedShow,
            show_callbacks: newValue
        });
        
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
        
        setEditedShow({
            ...editedShow,
            show_callbacks: newValue
        });
        
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
        
        setEditedShow({
            ...editedShow,
            show_callbacks: newValue
        });
        
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

    const toggleEdit = () => {
        if (isEditing) {
            handleSaveChanges();
        } else {
            setIsEditing(true);
        }
    };

    const handleSaveChanges = async () => {
        if (!editedShow) return;
        
        setIsSubmitting(true);

        try {
            // Convert show_time from Eastern to UTC before saving
            const showTimeUTC = editedShow.show_time ? convertFromEasternToUTC(editedShow.show_time) : null;

            const updateData = {
                show_date: editedShow.show_date,
                show_group: editedShow.show_group,
                show_tour: editedShow.show_tour,
                show_subvenue: editedShow.show_subvenue,
                show_iscanon: editedShow.show_iscanon,
                show_year: editedShow.show_year,
                show_issetlistgame: editedShow.show_issetlistgame,
                show_detail: editedShow.show_detail,
                show_alert: editedShow.show_alert,
                show_coachnotes: editedShow.show_coachnotes,
                show_time: showTimeUTC,
                show_callbacks: editedShow.show_callbacks,
                show_wl_link: editedShow.show_wl_link
            };

            const { error } = await supabase
                .from('shows')
                .update(updateData)
                .eq('show_id', editedShow.show_id);

            if (error) {
                throw error;
            }
            
            setSelectedShow(editedShow);
            setIsEditing(false);

            // Refresh the shows list
            fetchAllShows();

        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenNewShowModal = () => {
        setIsNewShow(true);
        setIsShowModalOpen(true);
    };

    const handleShowModalSave = () => {
        fetchAllShows();
        setIsShowModalOpen(false);
    };

    return (
        <div>
            {/* Header with buttons and dropdown */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Show Management</h3>

                <div className="flex items-center gap-2">
                    {/* Add New Show button */}
                    <button
                        onClick={handleOpenNewShowModal}
                        className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Show Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
                        >
                            Show
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
                                <div className="p-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search shows..."
                                            className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                        />
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                                    {loading && loadingProgress < 100 ? (
                                        <div className="flex flex-col justify-center items-center p-3 h-16">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                                            <p className="text-xs text-fifth/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
                                        </div>
                                    ) : (
                                        <>
                                            {filteredShows.map((show) => (
                                                <button
                                                    key={show.show_id}
                                                    onClick={() => handleShowSelect(show)}
                                                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                                >
                                                    {getShowDisplayText(show)}
                                                </button>
                                            ))}
                                            {filteredShows.length === 0 && !loading && (
                                                <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                    No shows found
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Show details section */}
            {selectedShow && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg text-fifth font-medium">
                            {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
                        </h4>
                        <button
                            onClick={toggleEdit}
                            disabled={isSubmitting}
                            className="px-2 py-1.5  font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-fourth text-primary border-secondary hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                        >
                            {isEditing ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Date</label>
                            <input
                                type="date"
                                name="show_date"
                                value={editedShow?.show_date || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Group</label>
                            {isEditing ? (
                                <select
                                    name="show_group"
                                    value={editedShow?.show_group || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                                >
                                    <option value="">-- Select Group --</option>
                                    {groups.map((group) => (
                                        <option key={group.group} value={group.group}>
                                            {group.group}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={editedShow?.show_group || ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth font-light text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Tour</label>
                            {isEditing ? (
                                <select
                                    name="show_tour"
                                    value={editedShow?.show_tour || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                                >
                                    <option value="">-- Select Tour --</option>
                                    {tours.map((tour) => (
                                        <option key={tour.tour} value={tour.tour}>
                                            {tour.tour}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={editedShow?.show_tour || ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth font-light text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Subvenue</label>
                            {isEditing ? (
                                <select
                                    name="show_subvenue"
                                    value={editedShow?.show_subvenue || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                                >
                                    <option value="">-- Select Subvenue --</option>
                                    {subvenues.map((subvenue) => (
                                        <option key={subvenue.subvenue} value={subvenue.subvenue}>
                                            {subvenue.subvenue} {subvenue.subvenue_venue_location && `- ${subvenue.subvenue_venue_location}`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={editedShow?.show_subvenue || ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth font-light text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Year</label>
                            {isEditing ? (
                                <select
                                    name="show_year"
                                    value={editedShow?.show_year || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                                >
                                    <option value="">-- Select Year --</option>
                                    {years.map((year) => (
                                        <option key={year.year} value={year.year}>
                                            {year.year}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={editedShow?.show_year || ''}
                                    readOnly
                                    className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth font-light text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Canon ID</label>
                            <input
                                type="text"
                                value={editedShow?.show_canonid || ''}
                                readOnly
                                className="w-full px-2 py-1.5 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth font-light text-sm"
                            />
                            <p className="text-xs text-fifth/60 italic">Auto-generated value</p>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Detail</label>
                            <input
                                type="text"
                                name="show_detail"
                                value={editedShow?.show_detail || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Alert</label>
                            <input
                                type="text"
                                name="show_alert"
                                value={editedShow?.show_alert || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="show_iscanon"
                                    checked={editedShow?.show_iscanon || false}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="rounded border-secondary focus:ring-fourth"
                                />
                                Is Canon?
                            </label>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="show_issetlistgame"
                                    checked={editedShow?.show_issetlistgame || false}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="rounded border-secondary focus:ring-fourth"
                                />
                                Is Setlist Game?
                            </label>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Show Time (Eastern Time)</label>
                            <input
                                type="datetime-local"
                                name="show_time"
                                value={convertToEasternDisplay(editedShow?.show_time || null)}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">WysteriaLane.org Thread Link</label>
                            <input
                                type="url"
                                name="show_wl_link"
                                value={editedShow?.show_wl_link || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                placeholder="https://wysterialane.org/..."
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium text-fifth">Coach's Notes</label>
                            <textarea
                                name="show_coachnotes"
                                value={editedShow?.show_coachnotes || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                rows={3}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        {/* Callbacks field - shows rendered HTML when not editing, raw code when editing */}
                        {(selectedShow?.show_callbacks || isEditing) && (
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
                                                                    {getShowDisplayText(show)}
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
                                        onChange={handleInputChange}
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
                        )}
                    </div>

                    {/* Releases table */}
                    {selectedShow && (
                    <div className="mt-6 space-y-1">
                        <div className="flex justify-between items-center">
                        <h4 className="text-base text-fifth font-medium">Releases</h4>
                        <button
                            onClick={handleAddRelease}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-primary border border-secondary rounded-lg text-sm hover:bg-green-600/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Release
                        </button>
                        </div>
                        
                        {loadingReleases ? (
                        <div className="flex justify-center items-center p-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                            <p className="text-sm text-fifth/70 ml-2">Loading releases...</p>
                        </div>
                        ) : showReleases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-canvas border-y border-secondary/10">
                                <th className="px-4 py-1 text-left text-sm font-medium text-fifth">Display Name</th>
                                <th className="px-4 py-1 text-left text-sm font-medium text-fifth">Service</th>
                                <th className="px-4 py-1 text-center text-sm font-medium text-fifth">Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {showReleases.map((releaseShow, index) => (
                                <tr 
                                    key={releaseShow.release_id}
                                    onClick={() => handleEditRelease(releaseShow.release_id, releaseShow.release_order)}
                                    className={`${
                                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                    } hover:bg-tertiary/40 transition-colors cursor-pointer`}
                                >
                                    <td className="px-4 py-1 text-xs font-light text-fifth">
                                    {releaseShow.releases.release_displayname}
                                    </td>
                                    <td className="px-4 py-1 text-xs font-light text-fifth">
                                    {releaseShow.releases.release_service || '-'}
                                    </td>
                                    <td className="px-4 py-1 text-xs font-light text-fifth text-center">
                                    {releaseShow.release_order}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        ) : (
                        <div className="text-sm text-fifth/80 italic p-3 bg-canvas rounded-md border border-secondary/10">
                            No releases associated with this show
                        </div>
                        )}
                    </div>
                    )}
                </div>
            )}

            {/* Show Modal for creating new shows */}
            <ShowModal
                isOpen={isShowModalOpen}
                onClose={() => setIsShowModalOpen(false)}
                show={selectedShow}
                onSave={handleShowModalSave}
                isNewShow={isNewShow}
                groups={groups}
                tours={tours}
                subvenues={subvenues}
                years={years}
            />

            {/* Show Release Modal */}
            {selectedShow && (
            <ShowReleaseModal
                isOpen={isReleaseModalOpen}
                onClose={handleReleaseModalClose}
                onSave={handleReleaseModalSave}
                showId={selectedShow.show_id}
                mode={releaseModalMode}
                existingReleaseId={selectedReleaseForEdit?.releaseId}
                existingOrder={selectedReleaseForEdit?.order}
            />
            )}
        </div>
    );
};

export default AdminShow;