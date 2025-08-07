import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShowModal from './ShowModal';
import { ShowReleaseModal } from './ShowReleaseModal';

// Convert UTC datetime to Eastern Time for display
const convertToEasternDisplay = (utcDatetime: string | null): string => {
    if (!utcDatetime) return '';
    
    const date = new Date(utcDatetime);
    // Convert to Eastern Time
    const easternDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    const hours = String(easternDate.getHours()).padStart(2, '0');
    const minutes = String(easternDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert Eastern Time input to UTC for storage
const convertFromEasternToUTC = (easternDatetime: string): string => {
    if (!easternDatetime) return '';
    
    // Parse the datetime-local input as Eastern Time
    // Create a temporary date string with timezone info
    const tempDate = new Date(easternDatetime + ' EST');
    
    // Convert to UTC by using the built-in timezone handling
    const utcDate = new Date(tempDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    return utcDate.toISOString();
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
            console.error('Error restoring selected show from localStorage:', error);
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
            console.error('Error fetching shows:', error);
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
            const { data: songsData, error: songsError } = await supabase
                .from('songs')
                .select('song, song_id')
                .order('song', { ascending: true });
            if (songsError) throw songsError;
            setSongs(songsData || []);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }

    async function fetchShowReleases(showId: string) {
        try {
            setLoadingReleases(true);
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
            .order('release_order', { ascending: true });

            if (error) throw error;
            setShowReleases(data || []);
        } catch (error) {
            console.error('Error fetching show releases:', error);
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
                <span className="font-semibold">{dateStr}</span>
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
            console.error('Error saving selected show to localStorage:', error);
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
            setEditedShow({
                ...editedShow,
                [name]: type === 'checkbox' ? checked : (value === '' ? null : value),
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

            const { error } = await supabase
                .from('shows')
                .update({
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
                })
                .eq('show_id', editedShow.show_id);

            if (error) {
                console.error('Error updating show:', error);
                throw error;
            }

            setSelectedShow(editedShow);
            setIsEditing(false);

            // Refresh the shows list
            fetchAllShows();

        } catch (error) {
            console.error('Error updating show:', error);
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
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Show Management</h3>

                <div className="flex items-center gap-2">
                    {/* Add New Show button */}
                    <button
                        onClick={handleOpenNewShowModal}
                        className="flex items-center gap-2 bg-[#f9ae37] text-black px-1.5 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Show Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
                        >
                            Show
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-96 max-h-96 overflow-y-auto">
                                <div className="p-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search shows..."
                                            className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                                        />
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                                    {loading && loadingProgress < 100 ? (
                                        <div className="flex flex-col justify-center items-center p-4 h-16">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                            <p className="text-xs text-black/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
                                        </div>
                                    ) : (
                                        <>
                                            {filteredShows.map((show) => (
                                                <button
                                                    key={show.show_id}
                                                    onClick={() => handleShowSelect(show)}
                                                    className="w-full text-left px-4 py-1 text-sm text-black hover:bg-canvas transition-colors"
                                                >
                                                    {getShowDisplayText(show)}
                                                </button>
                                            ))}
                                            {filteredShows.length === 0 && !loading && (
                                                <div className="px-4 py-2 text-sm text-black/60 italic">
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
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg text-black font-semibold">
                            {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
                        </h4>
                        <button
                            onClick={toggleEdit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-black"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Date</label>
                            <input
                                type="date"
                                name="show_date"
                                value={editedShow?.show_date || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Group</label>
                            {isEditing ? (
                                <select
                                    name="show_group"
                                    value={editedShow?.show_group || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Tour</label>
                            {isEditing ? (
                                <select
                                    name="show_tour"
                                    value={editedShow?.show_tour || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Subvenue</label>
                            {isEditing ? (
                                <select
                                    name="show_subvenue"
                                    value={editedShow?.show_subvenue || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Year</label>
                            {isEditing ? (
                                <select
                                    name="show_year"
                                    value={editedShow?.show_year || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
                                    className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Canon ID</label>
                            <input
                                type="text"
                                value={editedShow?.show_canonid || ''}
                                readOnly
                                className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                            />
                            <p className="text-xs text-black/60 italic">Auto-generated value</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Detail</label>
                            <input
                                type="text"
                                name="show_detail"
                                value={editedShow?.show_detail || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Alert</label>
                            <input
                                type="text"
                                name="show_alert"
                                value={editedShow?.show_alert || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="show_iscanon"
                                    checked={editedShow?.show_iscanon || false}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="rounded border-black focus:ring-[#a9682e]"
                                />
                                Is Canon?
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="show_issetlistgame"
                                    checked={editedShow?.show_issetlistgame || false}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="rounded border-black focus:ring-[#a9682e]"
                                />
                                Is Setlist Game?
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">Show Time (Eastern Time)</label>
                            <input
                                type="datetime-local"
                                name="show_time"
                                value={convertToEasternDisplay(editedShow?.show_time || null)}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-black">WysteriaLane.org Thread Link</label>
                            <input
                                type="url"
                                name="show_wl_link"
                                value={editedShow?.show_wl_link || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                placeholder="https://wysterialane.org/..."
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-semibold text-black">Coach's Notes</label>
                            <textarea
                                name="show_coachnotes"
                                value={editedShow?.show_coachnotes || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                rows={3}
                                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
                            />
                        </div>

                        {/* Callbacks field - shows rendered HTML when not editing, raw code when editing */}
                        {(selectedShow?.show_callbacks || isEditing) && (
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-black">Callbacks</label>
                                    
                                    {/* Button group - only show when editing */}
                                    {isEditing && (
                                        <div className="flex items-center gap-2">
                                            {/* Arrow button */}
                                            <button
                                                type="button"
                                                onClick={insertArrow}
                                                className="flex items-center gap-1 bg-[#f9ae37] text-black px-3 py-1 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-xs font-semibold"
                                                title="Insert arrow"
                                            >
                                                →
                                            </button>
                                            
                                            {/* Break tag button */}
                                            <button
                                                type="button"
                                                onClick={insertLineBreak}
                                                className="bg-[#f9ae37] text-black px-3 py-1 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-xs font-semibold"
                                                title="Insert <br /> tag"
                                            >
                                                BR
                                            </button>
                                            
                                            {/* Show dropdown */}
                                            <div className="relative" ref={showDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsShowDropdownOpen(!isShowDropdownOpen)}
                                                    className="flex items-center gap-1 bg-[#f9ae37] text-black px-3 py-1 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-xs font-semibold"
                                                >
                                                    Insert Show
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                                
                                                {isShowDropdownOpen && (
                                                    <div className="absolute right-0 mt-1 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-96 max-h-64 overflow-y-auto">
                                                        <div className="p-2">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={showSearchTerm}
                                                                    onChange={(e) => setShowSearchTerm(e.target.value)}
                                                                    placeholder="Search shows..."
                                                                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                                                                />
                                                                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto divide-y divide-black/10">
                                                            {filteredShowsForDropdown.map((show) => (
                                                                <button
                                                                    key={show.show_id}
                                                                    type="button"
                                                                    onClick={() => insertShowLink(show)}
                                                                    className="w-full text-left px-4 py-1 text-sm text-black hover:bg-canvas transition-colors"
                                                                >
                                                                    {getShowDisplayText(show)}
                                                                </button>
                                                            ))}
                                                            {filteredShowsForDropdown.length === 0 && (
                                                                <div className="px-4 py-2 text-sm text-black/60 italic">
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
                                                    className="flex items-center gap-1 bg-[#f9ae37] text-black px-3 py-1 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-xs font-semibold"
                                                >
                                                    Insert Song
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                                
                                                {isSongDropdownOpen && (
                                                    <div className="absolute right-0 mt-1 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-64 max-h-64 overflow-y-auto">
                                                        <div className="p-2">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={songSearchTerm}
                                                                    onChange={(e) => setSongSearchTerm(e.target.value)}
                                                                    placeholder="Search songs..."
                                                                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                                                                />
                                                                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto divide-y divide-black/10">
                                                            {filteredSongs.map((song) => (
                                                                <button
                                                                    key={song.song_id}
                                                                    type="button"
                                                                    onClick={() => insertSongLink(song)}
                                                                    className="w-full text-left px-4 py-1 text-sm text-black hover:bg-canvas transition-colors"
                                                                >
                                                                    {song.song}
                                                                </button>
                                                            ))}
                                                            {filteredSongs.length === 0 && (
                                                                <div className="px-4 py-2 text-sm text-black/60 italic">
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
                                        className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm font-mono"
                                        placeholder="Enter callbacks HTML..."
                                    />
                                ) : (
                                    <div 
                                        className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black text-sm min-h-[100px] [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline"
                                        dangerouslySetInnerHTML={{ __html: selectedShow.show_callbacks }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Releases table */}
                    {selectedShow && (
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center">
                        <h4 className="text-base text-black font-semibold">Releases</h4>
                        <button
                            onClick={handleAddRelease}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white border border-black rounded-lg text-sm hover:bg-green-600/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Release
                        </button>
                        </div>
                        
                        {loadingReleases ? (
                        <div className="flex justify-center items-center p-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                            <p className="text-sm text-black/70 ml-2">Loading releases...</p>
                        </div>
                        ) : showReleases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-canvas border-y border-black/10">
                                <th className="px-4 py-1 text-left text-sm font-semibold text-black">Display Name</th>
                                <th className="px-4 py-1 text-left text-sm font-semibold text-black">Service</th>
                                <th className="px-4 py-1 text-center text-sm font-semibold text-black">Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {showReleases.map((releaseShow, index) => (
                                <tr 
                                    key={releaseShow.release_id}
                                    onClick={() => handleEditRelease(releaseShow.release_id, releaseShow.release_order)}
                                    className={`${
                                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                    } hover:bg-black/10 transition-colors cursor-pointer`}
                                >
                                    <td className="px-4 py-1 text-sm text-black">
                                    {releaseShow.releases.release_displayname}
                                    </td>
                                    <td className="px-4 py-1 text-sm text-black">
                                    {releaseShow.releases.release_service || '-'}
                                    </td>
                                    <td className="px-4 py-1 text-sm text-black text-center">
                                    {releaseShow.release_order}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        ) : (
                        <div className="text-sm text-black/60 italic p-4 bg-canvas rounded-md border border-black/10">
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