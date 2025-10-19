import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ShowData } from '../types/showTypes';
import { convertFromEasternToUTC } from '../utils/showUtils';

export const useShowActions = (allShows: ShowData[], fetchAllShows: () => void) => {
    const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedShow, setEditedShow] = useState<ShowData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const showDataLoadedRef = useRef(false);

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
                    }
                }
            } catch (error) {
                // Handle error silently
            }
        }
    }, [allShows]);

    const handleShowSelect = (show: ShowData, fetchShowReleases: (showId: string) => void) => {
        setSelectedShow(show);
        setEditedShow(show);
        setIsEditing(false);
        
        // Fetch releases for this show
        fetchShowReleases(show.show_id);
        
        // Save the selected show ID to localStorage
        try {
            localStorage.setItem('adminSelectedShowId', show.show_id);
        } catch (error) {
            // Handle error silently
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editedShow) return;

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'show_date' && value) {
            setEditedShow({
                ...editedShow,
                [name]: value,
            });
        } else {
            const newValue = type === 'checkbox' ? checked : (value === '' ? null : value);
            
            setEditedShow({
                ...editedShow,
                [name]: newValue,
            });
        }
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

            const updateData = {
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
            };

            const { error } = await supabase
                .from('shows')
                .update(updateData)
                .eq('show_id', editedShow.show_id);

            if (error) {
                throw error;
            }
            
            setSelectedShow(editedShow);
            setIsEditing(false);

            // Refresh the shows list
            fetchAllShows();

        } catch (error) {
            // Handle error silently
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedShow,
        isEditing,
        editedShow,
        isSubmitting,
        handleShowSelect,
        handleInputChange,
        toggleEdit
    };
};
