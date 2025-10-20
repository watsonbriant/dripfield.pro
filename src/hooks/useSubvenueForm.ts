import { useState, useEffect, useRef } from 'react';
import { SubvenueData, VenueData } from './useSubvenueData';

export const useSubvenueForm = (allSubvenues: SubvenueData[]) => {
    const [selectedSubvenue, setSelectedSubvenue] = useState<SubvenueData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedSubvenue, setEditedSubvenue] = useState<SubvenueData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const [venueSearchTerm, setVenueSearchTerm] = useState('');
    const subvenueDataLoadedRef = useRef(false);

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

    const handleSubvenueSelect = (subvenue: SubvenueData) => {
        setSelectedSubvenue(subvenue);
        setEditedSubvenue(subvenue);
        setIsEditing(false);
        setIsCreatingNew(false);
        
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

    return {
        selectedSubvenue,
        isEditing,
        editedSubvenue,
        isSubmitting,
        isCreatingNew,
        isVenueDropdownOpen,
        venueSearchTerm,
        setSelectedSubvenue,
        setIsEditing,
        setEditedSubvenue,
        setIsSubmitting,
        setIsCreatingNew,
        setIsVenueDropdownOpen,
        setVenueSearchTerm,
        handleSubvenueSelect,
        handleVenueSelect,
        handleInputChange,
        handleCreateNew,
        handleCancel
    };
};
