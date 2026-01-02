import React, { useState, useMemo } from 'react';
import { Save, Edit, Plus } from 'lucide-react';
import { useSubvenueData, SubvenueData } from '../hooks/useSubvenueData';
import { useSubvenueForm } from '../hooks/useSubvenueForm';
import { useSubvenueActions } from '../hooks/useSubvenueActions';
import { SubvenueDropdown } from './SubvenueDropdown';
import { SubvenueForm } from './SubvenueForm';

export const AdminSubvenue: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const { allSubvenues, allVenues, loading, loadingProgress, fetchAllSubvenues } = useSubvenueData();
    const {
        selectedSubvenue,
        isEditing,
        editedSubvenue,
        isSubmitting,
        isCreatingNew,
        isVenueDropdownOpen,
        venueSearchTerm,
        handleSubvenueSelect,
        handleVenueSelect,
        handleInputChange,
        handleCreateNew,
        handleCancel,
        setIsSubmitting,
        setIsCreatingNew,
        setIsEditing,
        setSelectedSubvenue,
        setIsVenueDropdownOpen,
        setVenueSearchTerm
    } = useSubvenueForm(allSubvenues);
    
    const { saveSubvenue } = useSubvenueActions();

    const filteredSubvenues = useMemo(() => {
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

    const filteredVenues = useMemo(() => {
        return allVenues.filter(venue => {
            const searchLower = venueSearchTerm.toLowerCase();
            return (
                venue.venue.toLowerCase().includes(searchLower) ||
                venue.venue_location.toLowerCase().includes(searchLower)
            );
        });
    }, [allVenues, venueSearchTerm]);

    const handleSubvenueSelectWithDropdown = (subvenue: SubvenueData) => {
        handleSubvenueSelect(subvenue);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const toggleEdit = () => {
        if (isEditing) {
            saveSubvenue(
                editedSubvenue!,
                selectedSubvenue,
                isCreatingNew,
                setIsSubmitting,
                setIsCreatingNew,
                setIsEditing,
                setSelectedSubvenue,
                fetchAllSubvenues
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
                    Subvenue Management
                </h3>

                <div className="flex items-center gap-2">
                    {/* Add New Subvenue button */}
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-fourth text-white px-1 py-[3px] border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <SubvenueDropdown
                        isOpen={isDropdownOpen}
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        onClose={() => setIsDropdownOpen(false)}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filteredSubvenues={filteredSubvenues}
                        onSubvenueSelect={handleSubvenueSelectWithDropdown}
                        loading={loading}
                        loadingProgress={loadingProgress}
                        allVenues={allVenues}
                        selectedSubvenue={selectedSubvenue}
                    />
                </div>
            </div>

            {/* Subvenue details section */}
            {selectedSubvenue && (
                <div className="px-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm text-fifth font-medium">
                            {isCreatingNew ? 'New Subvenue' : selectedSubvenue.subvenue}
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

                    <SubvenueForm
                        editedSubvenue={editedSubvenue}
                        isEditing={isEditing}
                        onInputChange={handleInputChange}
                        allVenues={allVenues}
                        isVenueDropdownOpen={isVenueDropdownOpen}
                        onVenueDropdownToggle={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                        onVenueDropdownClose={() => setIsVenueDropdownOpen(false)}
                        venueSearchTerm={venueSearchTerm}
                        onVenueSearchChange={setVenueSearchTerm}
                        filteredVenues={filteredVenues}
                        onVenueSelect={handleVenueSelect}
                    />
                </div>
            )}

            {!selectedSubvenue && !loading && (
                <div className="text-center py-8">
                    <p className="text-xs text-fifth/60">Select a subvenue from the dropdown or create a new one to get started.</p>
                </div>
            )}
        </div>
    );
};