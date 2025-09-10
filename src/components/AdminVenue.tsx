import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VenueData {
    venue: string;
    venue_location: string;
    venue_coachnotes: string | null;
    venue_global: boolean;
    venue_address: string | null;
    venue_latitude: string | null;
    venue_longitude: string | null;
}

export const AdminVenue: React.FC = () => {
    const [allVenues, setAllVenues] = useState<VenueData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedVenue, setEditedVenue] = useState<VenueData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);
    const venueDataLoadedRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Only fetch data once on mount
    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllVenues();
            mountedRef.current = true;
        }
    }, []);

    // Load the selected venue from localStorage after venues are loaded
    useEffect(() => {
        if (allVenues.length > 0 && !venueDataLoadedRef.current) {
            venueDataLoadedRef.current = true;
            
            try {
                const storedVenue = localStorage.getItem('adminSelectedVenue');
                
                if (storedVenue) {
                    const storedVenueData = allVenues.find(venue => venue.venue === storedVenue);
                    
                    if (storedVenueData) {
                        setSelectedVenue(storedVenueData);
                        setEditedVenue(storedVenueData);
                    }
                }
            } catch (error) {
                // Handle localStorage error silently
            }
        }
    }, [allVenues]);

    // Handle visibility change to reload data when returning to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Refresh the venues list when returning to the tab
                fetchAllVenues();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    async function fetchAllVenues() {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            // Use pagination to fetch all venues
            let allVenuesData: VenueData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('venues')
                    .select('*')
                    .order('venue', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allVenuesData = [...allVenuesData, ...data];
                    page++;
                    
                    // Update progress (5-95%)
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    
                    // If we got fewer records than the page size, we're done
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllVenues(allVenuesData || []);
            
            setLoadingProgress(100);
            // Small delay to ensure smooth transition
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            console.error('Error fetching venues:', error);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    }

    const getVenueDisplayText = (venue: VenueData) => {
        return (
            <>
                <span className="font-medium">{venue.venue}</span>
                <span>&nbsp;&nbsp;[{venue.venue_location}]</span>
            </>
        );
    };

    const filteredVenues = React.useMemo(() => {
        return allVenues.filter(venue => {
            const searchLower = searchTerm.toLowerCase();
            return (
                venue.venue.toLowerCase().includes(searchLower) ||
                venue.venue_location.toLowerCase().includes(searchLower) ||
                (venue.venue_address && venue.venue_address.toLowerCase().includes(searchLower))
            );
        });
    }, [allVenues, searchTerm]);

    const handleVenueSelect = (venue: VenueData) => {
        setSelectedVenue(venue);
        setEditedVenue(venue);
        setIsDropdownOpen(false);
        setSearchTerm('');
        setIsEditing(false);
        setIsCreatingNew(false);
        
        // Save the selected venue to localStorage
        try {
            localStorage.setItem('adminSelectedVenue', venue.venue);
        } catch (error) {
            // Handle localStorage error silently
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editedVenue) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        const newValue = type === 'checkbox' ? checked : (value === '' ? null : value);
        
        setEditedVenue({
            ...editedVenue,
            [name]: newValue,
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
        const newVenue: VenueData = {
            venue: '',
            venue_location: '',
            venue_coachnotes: null,
            venue_global: false,
            venue_address: null,
            venue_latitude: null,
            venue_longitude: null
        };

        setSelectedVenue(newVenue);
        setEditedVenue(newVenue);
        setIsCreatingNew(true);
        setIsEditing(true);
        setIsDropdownOpen(false);
    };

    const handleSaveChanges = async () => {
        if (!editedVenue) return;
        
        // Validation
        if (!editedVenue.venue.trim() || !editedVenue.venue_location.trim()) {
            alert('Venue name and location are required.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isCreatingNew) {
                // Insert new venue
                const { error } = await supabase
                    .from('venues')
                    .insert([{
                        venue: editedVenue.venue.trim(),
                        venue_location: editedVenue.venue_location.trim(),
                        venue_coachnotes: editedVenue.venue_coachnotes,
                        venue_global: editedVenue.venue_global,
                        venue_address: editedVenue.venue_address,
                        venue_latitude: editedVenue.venue_latitude?.trim() || null,
                        venue_longitude: editedVenue.venue_longitude?.trim() || null
                    }]);

                if (error) {
                    if (error.code === '23505') { // Unique constraint violation
                        alert('A venue with this name and location already exists.');
                        return;
                    }
                    throw error;
                }

                setIsCreatingNew(false);
            } else {
                // Update existing venue
                const { error } = await supabase
                    .from('venues')
                    .update({
                        venue: editedVenue.venue.trim(),
                        venue_location: editedVenue.venue_location.trim(),
                        venue_coachnotes: editedVenue.venue_coachnotes,
                        venue_global: editedVenue.venue_global,
                        venue_address: editedVenue.venue_address,
                        venue_latitude: editedVenue.venue_latitude?.trim() || null,
                        venue_longitude: editedVenue.venue_longitude?.trim() || null
                    })
                    .eq('venue', selectedVenue!.venue)
                    .eq('venue_location', selectedVenue!.venue_location);

                if (error) {
                    throw error;
                }
            }
            
            setSelectedVenue(editedVenue);
            setIsEditing(false);

            // Refresh the venues list
            fetchAllVenues();

        } catch (error) {
            console.error('Error saving venue:', error);
            alert('Failed to save venue. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isCreatingNew) {
            setSelectedVenue(null);
            setEditedVenue(null);
            setIsCreatingNew(false);
        } else {
            setEditedVenue(selectedVenue);
        }
        setIsEditing(false);
    };

    return (
        <div>
            {/* Header with buttons and dropdown */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Venue Management</h3>

                <div className="flex items-center gap-2">
                    {/* Add New Venue button */}
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Venue Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
                        >
                            Venue
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
                                            placeholder="Search venues..."
                                            className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                                        />
                                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                                    {loading && loadingProgress < 100 ? (
                                        <div className="flex flex-col justify-center items-center p-3 h-16">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                                            <p className="text-xs text-fifth/70 mt-2">Loading venues ({Math.round(loadingProgress)}%)</p>
                                        </div>
                                    ) : (
                                        <>
                                            {filteredVenues.map((venue) => (
                                                <button
                                                    key={`${venue.venue}-${venue.venue_location}`}
                                                    onClick={() => handleVenueSelect(venue)}
                                                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                                                >
                                                    {getVenueDisplayText(venue)}
                                                </button>
                                            ))}
                                            {filteredVenues.length === 0 && !loading && (
                                                <div className="px-4 py-2 text-sm text-fifth/60 italic">
                                                    No venues found
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

            {/* Venue details section */}
            {selectedVenue && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg text-fifth font-medium">
                            {isCreatingNew ? 'New Venue' : `${selectedVenue.venue} - ${selectedVenue.venue_location}`}
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
                            <label className="block text-sm font-medium text-fifth">Venue Name</label>
                            <input
                                type="text"
                                name="venue"
                                value={editedVenue?.venue || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="Enter venue name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Location</label>
                            <input
                                type="text"
                                name="venue_location"
                                value={editedVenue?.venue_location || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="Enter location"
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium text-fifth">Address</label>
                            <input
                                type="text"
                                name="venue_address"
                                value={editedVenue?.venue_address || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="Enter full address"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Latitude</label>
                            <input
                                type="text"
                                name="venue_latitude"
                                value={editedVenue?.venue_latitude || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="e.g., 40.7128"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-fifth">Longitude</label>
                            <input
                                type="text"
                                name="venue_longitude"
                                value={editedVenue?.venue_longitude || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="e.g., -74.0060"
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium text-fifth">Coach's Notes</label>
                            <textarea
                                name="venue_coachnotes"
                                value={editedVenue?.venue_coachnotes || ''}
                                onChange={handleInputChange}
                                readOnly={!isEditing}
                                rows={4}
                                className={`w-full px-2 py-1.5 font-light rounded-md border ${isEditing ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
                                placeholder="Enter any notes about this venue..."
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="block text-sm font-medium text-fifth flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="venue_global"
                                    checked={editedVenue?.venue_global || false}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="rounded border-secondary focus:ring-fourth"
                                />
                                Global Venue
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {!selectedVenue && !loading && (
                <div className="text-center py-8">
                    <p className="text-fifth/60">Select a venue from the dropdown or create a new one to get started.</p>
                </div>
            )}
        </div>
    );
};