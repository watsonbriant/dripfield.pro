import React, { useState, useMemo } from 'react';
import { Save, Edit, Plus } from 'lucide-react';
import { useVenueData, VenueData } from '../hooks/useVenueData';
import { useVenueForm } from '../hooks/useVenueForm';
import { useVenueActions } from '../hooks/useVenueActions';
import { VenueDropdown } from './VenueDropdown';
import { VenueForm } from './VenueForm';

export const AdminVenue: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const { allVenues, loading, loadingProgress, fetchAllVenues } = useVenueData();
    const {
        selectedVenue,
        isEditing,
        editedVenue,
        isSubmitting,
        isCreatingNew,
        handleVenueSelect,
        handleInputChange,
        handleCreateNew,
        handleCancel,
        setIsSubmitting,
        setIsCreatingNew,
        setIsEditing,
        setSelectedVenue
    } = useVenueForm(allVenues);
    
    const { saveVenue } = useVenueActions();

    const filteredVenues = useMemo(() => {
        return allVenues.filter(venue => {
            const searchLower = searchTerm.toLowerCase();
            return (
                venue.venue.toLowerCase().includes(searchLower) ||
                venue.venue_location.toLowerCase().includes(searchLower) ||
                (venue.venue_address && venue.venue_address.toLowerCase().includes(searchLower))
            );
        });
    }, [allVenues, searchTerm]);

    const handleVenueSelectWithDropdown = (venue: VenueData) => {
        handleVenueSelect(venue);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const toggleEdit = () => {
        if (isEditing) {
            saveVenue(
                editedVenue!,
                selectedVenue,
                isCreatingNew,
                setIsSubmitting,
                setIsCreatingNew,
                setIsEditing,
                setSelectedVenue,
                fetchAllVenues
            );
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div className='pb-1'>
            {/* Header with buttons and dropdown */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
                    Venue Management
                </h3>

                <div className="flex items-center gap-2">
                    {/* Add New Venue button */}
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-fourth text-white px-1 py-[3px] border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <VenueDropdown
                        isOpen={isDropdownOpen}
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        onClose={() => setIsDropdownOpen(false)}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filteredVenues={filteredVenues}
                        onVenueSelect={handleVenueSelectWithDropdown}
                        loading={loading}
                        loadingProgress={loadingProgress}
                        selectedVenue={selectedVenue}
                    />
                </div>
            </div>

            {/* Venue details section */}
            {selectedVenue && (
                <div className="px-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-fifth font-medium">
                            {isCreatingNew ? 'New Venue' : `${selectedVenue.venue} - ${selectedVenue.venue_location}`}
                        </h4>
                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <button
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    className="px-2 py-0.5 font-medium transition-colors text-xs flex items-center justify-center border bg-gray-500 text-white border-fourth hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={toggleEdit}
                                disabled={isSubmitting}
                                className="px-2 py-0.5 font-medium transition-colors text-xs flex items-center justify-center border bg-fourth text-white border-fourth hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
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

                    <VenueForm
                        editedVenue={editedVenue}
                        isEditing={isEditing}
                        onInputChange={handleInputChange}
                    />
                </div>
            )}

            {!selectedVenue && !loading && (
                <div className="text-center py-8">
                    <p className="text-xs text-fifth/60">Select a venue from the dropdown or create a new one to get started.</p>
                </div>
            )}
        </div>
    );
};