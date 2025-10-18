import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTourData } from '../hooks/useTourData';
import { TourHeader } from './TourHeader';
import { TourShowsTable } from './TourShowsTable';
import { TourSlotsTable } from './TourSlotsTable';
import { TourStats } from './TourStats';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import { Show, Tour, ModalSongData } from '../types/tourTypes';

export function Tours() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use custom hook for all tour data
  const {
    currentTour,
    currentTourId,
    currentTourShowFields,
    shows,
    tours,
    slots,
    activeColumns,
    hasSlotEntries,
    songIdMap,
    topSlots,
    hasTourSetlistEntries,
    hasGuestAppearances,
    uniqueSongCount,
    showsWithSetlists,
    attendeeCounts,
    showRatings,
    showsWithReleases,
    isLoading,
    setCurrentTour,
    setCurrentTourId,
    setCurrentTourShowFields,
    setHasGuestAppearances,
    setUniqueSongCount
  } = useTourData();

  // Local state for UI interactions
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [modalSongData, setModalSongData] = useState<ModalSongData>({
    isOpen: false,
    songName: ''
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle tour selection
  const handleTourSelect = (tour: Tour) => {
    setCurrentTourId(tour.tour_id);
    setCurrentTour(tour.tour);
    setCurrentTourShowFields(tour.tour_showfields || false);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rating' ? 'desc' : 'asc');
    }
  };

  // Handle venue navigation
  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    }
    // Only navigate if venue_id exists, ignore venue name fallback
  };

  // Handle song click for modal
  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };

  // Handle song navigation
  const handleSongNavigation = (songId: string) => {
    navigate(`/song/${songId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <TourHeader
          currentTour={currentTour}
          tours={tours}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          onTourSelect={handleTourSelect}
        />
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading tour data...</p>
        </div>
      </div>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <TourHeader
          currentTour={currentTour}
          tours={tours}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          onTourSelect={handleTourSelect}
        />
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">No tours found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <TourHeader
        currentTour={currentTour}
        tours={tours}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        onTourSelect={handleTourSelect}
      />

      {shows.length === 0 ? (
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">No shows found for {currentTour}</p>
        </div>
      ) : (
        <TourShowsTable
          shows={shows}
          currentTour={currentTour}
          user={user}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          showRatings={showRatings}
          attendeeCounts={attendeeCounts}
          showsWithSetlists={showsWithSetlists}
          showsWithReleases={showsWithReleases}
          navigateToVenue={navigateToVenue}
        />
      )}

      {shows.length > 0 && hasSlotEntries && (
        <TourSlotsTable
          slots={slots}
          activeColumns={activeColumns}
          onSongClick={handleSongClick}
        />
      )}

      {shows.length > 0 && hasTourSetlistEntries && (
        <TourStats
          shows={shows}
          topSlots={topSlots}
          windowWidth={windowWidth}
          currentTourId={currentTourId}
          currentTour={currentTour}
          currentTourShowFields={currentTourShowFields}
          hasGuestAppearances={hasGuestAppearances}
          setHasGuestAppearances={setHasGuestAppearances}
          songIdMap={songIdMap}
          uniqueSongCount={uniqueSongCount}
          setUniqueSongCount={setUniqueSongCount}
          hasTourSetlistEntries={hasTourSetlistEntries}
          onSongClick={handleSongNavigation}
        />
      )}

      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={currentTourId}
        currentShowId=""
      />
    </div>
  );
}