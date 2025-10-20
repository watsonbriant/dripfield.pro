import { supabase } from '../lib/supabase';
import { VenueData } from './useVenueData';

export const useVenueActions = () => {
    const saveVenue = async (
        editedVenue: VenueData,
        selectedVenue: VenueData | null,
        isCreatingNew: boolean,
        setIsSubmitting: (value: boolean) => void,
        setIsCreatingNew: (value: boolean) => void,
        setIsEditing: (value: boolean) => void,
        setSelectedVenue: (venue: VenueData) => void,
        fetchAllVenues: () => void
    ) => {
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

    return { saveVenue };
};
