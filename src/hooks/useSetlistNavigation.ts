import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Show } from '../types/setlist';

export function useSetlistNavigation(show: Show | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openChangesModal, setOpenChangesModal] = useState(false);
  const [showCoachNotes, setShowCoachNotes] = useState(true);

  // Check if we should open the changes modal from navigation state
  useEffect(() => {
    if (location.state?.openChangesModal) {
      setOpenChangesModal(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Clear scrollToReleases state after component mounts
  useEffect(() => {
    if (location.state?.scrollToReleases) {
      // Don't clear the state immediately - let FullSetlistDisplay handle it
    }
  }, [location.state?.scrollToReleases]);

  // Helper function to navigate to venue page
  const navigateToVenue = () => {
    if (!show) return;
    
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`);
    } else {
      // If we don't have either, use the subvenue or venue location as a fallback
      const venueSearchTerm = show.show_subvenue || show.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  const handleTourSelect = (tourId: string) => {
    navigate(`/tours/${tourId}`);
  };

  const handleShowSelect = (showId: string) => {
    navigate(`/setlist/${showId}`);
  };

  return {
    openChangesModal,
    setOpenChangesModal,
    showCoachNotes,
    setShowCoachNotes,
    navigateToVenue,
    handleTourSelect,
    handleShowSelect,
    scrollToReleases: location.state?.scrollToReleases
  };
}
