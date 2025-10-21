import React from 'react';
import { useParams } from 'react-router-dom';
import FullSetlistDisplay from './FullSetlistDisplay';
import { SetlistHeader } from './setlist/SetlistHeader';
import { useSetlistData, useTours, useShowDates } from '../hooks/useSetlistData';
import { useSetlistNavigation } from '../hooks/useSetlistNavigation';

export function Setlist() {
  const { showId } = useParams();
  
  // Custom hooks for data fetching
  const { show, setlist, loading, showLengthRank } = useSetlistData(showId);
  const { tours } = useTours();
  const { showDates } = useShowDates(show, showId);
  
  // Custom hook for navigation and state management
  const {
    openChangesModal,
    setOpenChangesModal,
    showCoachNotes,
    setShowCoachNotes,
    navigateToVenue,
    handleTourSelect,
    handleShowSelect,
    scrollToReleases
  } = useSetlistNavigation(show);

  const hasCoachNotes = React.useMemo(() => {
    return setlist.some(entry => entry.entry_coachnotes);
  }, [setlist]);


  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading setlist...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">Show not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <SetlistHeader
        tours={tours}
        showDates={showDates}
        currentShowId={showId}
        currentTour={show?.show_tour || undefined}
        onTourSelect={handleTourSelect}
        onShowSelect={handleShowSelect}
        hasCoachNotes={hasCoachNotes}
        showCoachNotes={showCoachNotes}
        onToggleCoachNotes={setShowCoachNotes}
      />
      
      <FullSetlistDisplay 
        setlist={setlist} 
        show={show || undefined} 
        showCoachNotes={showCoachNotes}
        showDates={showDates}
        navigateToVenue={navigateToVenue}
        showId={showId}
        openChangesModal={openChangesModal}
        setOpenChangesModal={setOpenChangesModal}
        showLengthRank={showLengthRank}
        scrollToReleases={scrollToReleases}
      />
    </div>
  );
}