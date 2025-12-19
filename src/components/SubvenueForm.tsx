import React from 'react';
import { SubvenueData, VenueData } from '../hooks/useSubvenueData';
import { VenueFormDropdown } from './VenueFormDropdown';

interface SubvenueFormProps {
    editedSubvenue: SubvenueData | null;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    allVenues: VenueData[];
    isVenueDropdownOpen: boolean;
    onVenueDropdownToggle: () => void;
    onVenueDropdownClose: () => void;
    venueSearchTerm: string;
    onVenueSearchChange: (term: string) => void;
    filteredVenues: VenueData[];
    onVenueSelect: (venue: VenueData) => void;
}

export const SubvenueForm: React.FC<SubvenueFormProps> = ({
    editedSubvenue,
    isEditing,
    onInputChange,
    allVenues,
    isVenueDropdownOpen,
    onVenueDropdownToggle,
    onVenueDropdownClose,
    venueSearchTerm,
    onVenueSearchChange,
    filteredVenues,
    onVenueSelect
}) => {
    const getSelectedVenueDisplay = () => {
        if (!editedSubvenue?.subvenue_venue) return '';
        const venue = allVenues.find(v => v.venue === editedSubvenue.subvenue_venue);
        return venue ? `${venue.venue} - ${venue.venue_location}` : editedSubvenue.subvenue_venue;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Subvenue Name</label>
                <input
                    type="text"
                    name="subvenue"
                    value={editedSubvenue?.subvenue || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="Enter subvenue name"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Venue</label>
                {isEditing ? (
                    <VenueFormDropdown
                        isOpen={isVenueDropdownOpen}
                        onToggle={onVenueDropdownToggle}
                        onClose={onVenueDropdownClose}
                        searchTerm={venueSearchTerm}
                        onSearchChange={onVenueSearchChange}
                        filteredVenues={filteredVenues}
                        onVenueSelect={onVenueSelect}
                        selectedVenue={getSelectedVenueDisplay()}
                    />
                ) : (
                    <input
                        type="text"
                        value={getSelectedVenueDisplay()}
                        readOnly
                        className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                    />
                )}
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Start Date</label>
                <input
                    type="date"
                    name="subvenue_startdate"
                    value={editedSubvenue?.subvenue_startdate || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">End Date</label>
                <input
                    type="date"
                    name="subvenue_enddate"
                    value={editedSubvenue?.subvenue_enddate || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                />
            </div>
        </div>
    );
};
