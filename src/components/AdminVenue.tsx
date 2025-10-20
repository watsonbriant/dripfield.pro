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
                    />
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

                    <VenueForm
                        editedVenue={editedVenue}
                        isEditing={isEditing}
                        onInputChange={handleInputChange}
                    />
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