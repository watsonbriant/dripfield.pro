import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubvenueData {
    subvenue: string;
    subvenue_venue: string;
    subvenue_startdate: string | null;
    subvenue_enddate: string | null;
}

interface VenueData {
    venue: string;
    venue_location: string;
}

export const AdminSubvenue: React.FC = () => {
    const [allSubvenues, setAllSubvenues] = useState<SubvenueData[]>([]);
    const [allVenues, setAllVenues] = useState<VenueData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedSubvenue, setSelectedSubvenue] = useState<SubvenueData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedSubvenue, setEditedSubvenue] = useState<SubvenueData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const [venueSearchTerm, setVenueSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const venueDropdownRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);
    const subvenueDataLoadedRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target as Node)) {
                setIsVenueDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Only fetch data once on mount
    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllSubvenues();
            fetchAllVenues();
            mountedRef.current = true;
        }
    }, []);

    // Load the selected subvenue from localStorage after subvenues are loaded
    useEffect(() => {
        if (allSubvenues.length > 0 && !subvenueDataLoadedRef.current) {
            subvenueDataLoadedRef.current = true;
            
            try {
                const storedSubvenue = localStorage.getItem('adminSelectedSubvenue');
                
                if (storedSubvenue) {
                    const storedSubvenueData = allSubvenues.find(subvenue => subvenue.subvenue === storedSubvenue);
                    
                    if (storedSubvenueData) {
                        setSelectedSubvenue(storedSubvenueData);
                        setEditedSubvenue(storedSubvenueData);
                    }
                }
            } catch (error) {
                // Handle localStorage error silently
            }
        }
    }, [allSubvenues]);

    // Handle visibility change to reload data when returning to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refresh the subvenues list when returning to the tab
                fetchAllSubvenues();
                fetchAllVenues();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    async function fetchAllSubvenues() {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            // Use pagination to fetch all subvenues
            let allSubvenuesData: SubvenueData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('subvenues')
                    .select('*')
                    .order('subvenue', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allSubvenuesData = [...allSubvenuesData, ...data];
                    page++;
                    
                    // Update progress (5-95%)
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    
                    // If we got fewer records than the page size, we're done
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllSubvenues(allSubvenuesData || []);
            
            setLoadingProgress(100);
            // Small delay to ensure smooth transition
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            console.error('Error fetching subvenues:', error);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    }

    async function fetchAllVenues() {
        try {
            const { data, error } = await supabase
                .from('venues')
                .select('venue, venue_location')
                .order('venue', { ascending: true });
            
            if (error) throw error;
            setAllVenues(data || []);
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    }

    const getSubvenueDisplayText = (subvenue: SubvenueData) => {
        const venue = allVenues.find(v => v.venue === subvenue.subvenue_venue);
        return (
            <>
                <span className="font-medium">{subvenue.subvenue}</span>
                <span>&nbsp;&nbsp;[{venue ? `${venue.venue_location}` : subvenue.subvenue_venue}]</span>
            </>
        );
    };

    const filteredSubvenues = React.useMemo(() => {
        return allSubvenues.filter(subvenue => {
            const searchLower = searchTerm.toLowerCase();
            const venue = allVenues.find(v => v.venue === subvenue.subvenue_venue);
            return (
                subvenue.subvenue.toLowerCase().includes(searchLower) ||
                subvenue.subvenue_venue.toLowerCase().includes(searchLower) ||
                (venue && (
                    venue.venue.toLowerCase().includes(searchLower) ||
                    venue.venue_location.toLowerCase().includes(searchLower)
                ))
            );
        });
    }, [allSubvenues, allVenues, searchTerm]);

    const filteredVenues = React.useMemo(() => {
        return allVenues.filter(venue => {
            const searchLower = venueSearchTerm.toLowerCase();
            return (
                venue.venue.toLowerCase().includes(searchLower) ||
                venue.venue_location.toLowerCase().includes(searchLower)
            );
        });
    }, [allVenues, venueSearchTerm]);

    const handleSubvenueSelect = (subvenue: SubvenueData) => {
        setSelectedSubvenue(subvenue);
        setEditedSubvenue(subvenue);
        setIsDropdownOpen(false);
        setSearchTerm('');
        setIsEditing(false);
        setIsCreatingNew(false);
        
        // Save the selected subvenue to localStorage
        try {
            localStorage.setItem('adminSelectedSubvenue', subvenue.subvenue);
        } catch (error) {
            // Handle localStorage error silently
        }
    };

    const handleVenueSelect = (venue: VenueData) => {
        if (!editedSubvenue) return;
        
        setEditedSubvenue({
            ...editedSubvenue,
            subvenue_venue: venue.venue
        });
        setIsVenueDropdownOpen(false);
        setVenueSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editedSubvenue) return;

        const { name, value } = e.target;
        
        setEditedSubvenue({
            ...editedSubvenue,
            [name]: value === '' ? null : value,
        });
    };

    const toggleEdit = () => {
        if (isEditing) {
            handleSaveChanges();
        } else {
            setIsEditing(true);
        }
    };

    const handleCreateNew = () => {
        const newSubvenue: SubvenueData = {
            subvenue: '',
            subvenue_venue: '',
            subvenue_startdate: null,
            subvenue_enddate: null
        };

        setSelectedSubvenue(newSubvenue);
        setEditedSubvenue(newSubvenue);
        setIsCreatingNew(true);
        setIsEditing(true);
        setIsDropdownOpen(false);
    };

    const handleSaveChanges = async () => {
        if (!editedSubvenue) return;
        
        // Validation
        if (!editedSubvenue.subvenue.trim() || !editedSubvenue.subvenue_venue.trim()) {
            alert('Subvenue name and venue are required.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isCreatingNew) {
                // Insert new subvenue
                const { error } = await supabase
                    .from('subvenues')
                    .insert([{
                        subvenue: editedSubvenue.subvenue.trim(),
                        subvenue_venue: editedSubvenue.subvenue_venue.trim(),
                        subvenue_startdate: editedSubvenue.subvenue_startdate,
                        subvenue_enddate: editedSubvenue.subvenue_enddate
                    }]);

                if (error) {
                    if (error.code === '23505') { // Unique constraint violation
                        alert('A subvenue with this name already exists.');
                        return;
                    }
                    throw error;
                }

                setIsCreatingNew(false);
            } else {
                // Update existing subvenue
                const { error } = await supabase
                    .from('subvenues')
                    .update({
                        subvenue: editedSubvenue.subvenue.trim(),
                        subvenue_venue: editedSubvenue.subvenue_venue.trim(),
                        subvenue_startdate: editedSubvenue.subvenue_startdate,
                        subvenue_enddate: editedSubvenue.subvenue_enddate
                    })
                    .eq('subvenue', selectedSubvenue!.subvenue);

                if (error) {
                    throw error;
                }
            }
            
            setSelectedSubvenue(editedSubvenue);
            setIsEditing(false);

            // Refresh the subvenues list
            fetchAllSubvenues();

        } catch (error) {
            console.error('Error saving subvenue:', error);
            alert('Failed to save subvenue. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isCreatingNew) {
            setSelectedSubvenue(null);
            setEditedSubvenue(null);
            setIsCreatingNew(false);
        } else {
            setEditedSubvenue(selectedSubvenue);
        }
        setIsEditing(false);
    };

    return (
        <div>
            {/* Header with buttons and dropdown */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Subvenue Management</h3>

                <div className="flex items-center gap-2">
                    {/* Add New Subvenue button */}
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Subvenue Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
                        >
                            Subvenue
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
                                            placeholder="Search subvenues..."
                                            className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                        />
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                                    {loading && loadingProgress < 100 ? (
                                        <div className="flex flex-col justify-center items-center p-3 h-16">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                                            <p className="text-xs text-fifth/70 mt-2">Loading subvenues ({Math.round(loadingProgress)}%)</p>
                                        </div>
                                    ) : (
                                        <>
                                            {filteredSubvenues.map((subvenue) => (
                                                <button
                                                    key={subvenue.subvenue}
                                                    onClick={() => handleSubvenueSelect(subvenue)}
                                                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                                >
                                                    {getSubvenueDisplayText(subvenue)}
                                                </button>
                                            ))}
                                            {filteredSubvenues.length === 0 && !loading && (
                                                <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                    No subvenues found
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

            {/* Subvenue details section */}
            {selectedSubvenue && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg text-fifth font-medium">
                            {isCreatingNew ? 'New Subvenue' : selectedSubvenue.subvenue}
                        </h4>
                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <button
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    className="px-2 py-1.5 font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-gray-500 text-primary border-secondary hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={toggleEdit}
                                disabled={isSubmitting}
                                className="px-2 py-1.5 font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-fourth text-primary border-secondary hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Subvenue Name</label>
                            <input
                                type="text"
                                name="subvenue"
                                value={editedSubvenue?.subvenue || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="Enter subvenue name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Venue</label>
                            {isEditing ? (
                                <div className="relative" ref={venueDropdownRef}>
                                    <button
                                        onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                                        className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm text-left flex items-center justify-between"
                                    >
                                        <span className="truncate">
                                            {editedSubvenue?.subvenue_venue ? (
                                                (() => {
                                                    const venue = allVenues.find(v => v.venue === editedSubvenue.subvenue_venue);
                                                    return venue ? `${venue.venue} - ${venue.venue_location}` : editedSubvenue.subvenue_venue;
                                                })()
                                            ) : 'Select venue...'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                    </button>

                                    {isVenueDropdownOpen && (
                                        <div className="absolute left-0 mt-1 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-full max-h-60 overflow-y-auto">
                                            <div className="p-2">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={venueSearchTerm}
                                                        onChange={(e) => setVenueSearchTerm(e.target.value)}
                                                        placeholder="Search venues..."
                                                        className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                                    />
                                                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                                </div>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto divide-y divide-black/10">
                                                {filteredVenues.map((venue) => (
                                                    <button
                                                        key={venue.venue}
                                                        onClick={() => handleVenueSelect(venue)}
                                                        className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                                    >
                                                        <span className="font-medium">{venue.venue}</span>
                                                        <span>&nbsp;&nbsp;[{venue.venue_location}]</span>
                                                    </button>
                                                ))}
                                                {filteredVenues.length === 0 && (
                                                    <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                        No venues found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={(() => {
                                        if (!editedSubvenue?.subvenue_venue) return '';
                                        const venue = allVenues.find(v => v.venue === editedSubvenue.subvenue_venue);
                                        return venue ? `${venue.venue} - ${venue.venue_location}` : editedSubvenue.subvenue_venue;
                                    })()}
                                    readOnly
                                    className="w-full px-2 py-1.5 font-light rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                                />
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Start Date</label>
                            <input
                                type="date"
                                name="subvenue_startdate"
                                value={editedSubvenue?.subvenue_startdate || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">End Date</label>
                            <input
                                type="date"
                                name="subvenue_enddate"
                                value={editedSubvenue?.subvenue_enddate || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!selectedSubvenue && !loading && (
                <div className="text-center py-8">
                    <p className="text-fifth/60">Select a subvenue from the dropdown or create a new one to get started.</p>
                </div>
            )}
        </div>
    );
};