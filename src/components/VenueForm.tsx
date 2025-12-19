import React from 'react';
import { VenueData } from '../hooks/useVenueData';

interface VenueFormProps {
    editedVenue: VenueData | null;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const VenueForm: React.FC<VenueFormProps> = ({
    editedVenue,
    isEditing,
    onInputChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Venue Name</label>
                <input
                    type="text"
                    name="venue"
                    value={editedVenue?.venue || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="Enter venue name"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Location</label>
                <input
                    type="text"
                    name="venue_location"
                    value={editedVenue?.venue_location || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="Enter location"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-fifth mb-0.5">Address</label>
                <input
                    type="text"
                    name="venue_address"
                    value={editedVenue?.venue_address || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="Enter full address"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Latitude</label>
                <input
                    type="text"
                    name="venue_latitude"
                    value={editedVenue?.venue_latitude || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="e.g., 40.7128"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">Longitude</label>
                <input
                    type="text"
                    name="venue_longitude"
                    value={editedVenue?.venue_longitude || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="e.g., -74.0060"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-fifth mb-0.5">Coach's Notes</label>
                <textarea
                    name="venue_coachnotes"
                    value={editedVenue?.venue_coachnotes || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    rows={4}
                    className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    placeholder="Enter any notes about this venue..."
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-medium text-fifth mb-0.5 flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="venue_global"
                        checked={editedVenue?.venue_global || false}
                        onChange={onInputChange}
                        disabled={!isEditing}
                        className="rounded border-fourth focus:ring-tertiary"
                    />
                    Global Venue
                </label>
            </div>
        </div>
    );
};
