import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTourData } from '../hooks/useTourData';
import { TourShowsTable } from './TourShowsTable';
import { TourSlotsTable } from './TourSlotsTable';
import { TourStats } from './TourStats';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import { Show, Tour, ModalSongData } from '../types/tourTypes';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [modalSongData, setModalSongData] = useState<ModalSongData>({
    isOpen: false,
    songName: ''
  });
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [isToursListVisible, setIsToursListVisible] = useState(false); // Default to hidden on mobile

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
    // Collapse tours list on mobile when a tour is selected
    setIsToursListVisible(false);
  };

  // Extract year from tour name (assumes format like "2012 Misc" or "2025 Fall")
  const extractYear = (tourName: string): string => {
    const match = tourName.match(/^(\d{4})/);
    return match ? match[1] : 'Unknown';
  };

  // Group tours by year
  const toursByYear = tours.reduce((acc, tour) => {
    const year = extractYear(tour.tour);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(tour);
    return acc;
  }, {} as Record<string, Tour[]>);

  // Sort years descending and tours within each year by tour_canonid
  const sortedYears = Object.keys(toursByYear).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });

  sortedYears.forEach(year => {
    toursByYear[year].sort((a, b) => a.tour_canonid - b.tour_canonid);
  });

  // Toggle year expansion (only one year open at a time)
  const toggleYear = (year: string) => {
    setExpandedYear(prev => prev === year ? null : year);
  };

  // Auto-expand the year containing the current tour
  useEffect(() => {
    if (currentTour && tours.length > 0) {
      const year = extractYear(currentTour);
      if (year !== 'Unknown') {
        setExpandedYear(year);
      }
    }
  }, [currentTour, tours]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rating' ? 'desc' : 'asc');
    }
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
      <div className="max-w-[1500px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
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
      <div className="max-w-[1500px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">No tours found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px]">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Side: Shows Table and other content */}
        <div className="w-full lg:w-auto lg:min-w-0">
      {shows.length === 0 ? (
            <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">No shows found for {currentTour}</p>
        </div>
      ) : (
            <>
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
        />

              {hasSlotEntries && (
        <TourSlotsTable
          slots={slots}
          activeColumns={activeColumns}
          onSongClick={handleSongClick}
        />
      )}

              {hasTourSetlistEntries && (
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
            </>
          )}
        </div>

        {/* Right Side: Tours List - appears first on mobile, last on desktop */}
        <div className="w-full lg:w-[250px] flex-shrink-0 order-first lg:order-last">
          <div className="bg-primary border border-fourth w-full shadow-xl">
            <button
              onClick={() => setIsToursListVisible(!isToursListVisible)}
              className="lg:pointer-events-none w-full bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center hover:bg-tertiary/90 transition-colors"
            >
              <h2 className="text-sm font-semibold">
                Tours
              </h2>
              {/* Chevron icon - only visible on mobile */}
              <div className="lg:hidden">
                {isToursListVisible ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>
            {/* Tours list - hidden on mobile when collapsed, always visible on desktop */}
            <div className={`${isToursListVisible ? 'block' : 'hidden'} lg:block`}>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                    <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                    <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                  </div>
                </div>
              ) : sortedYears.length === 0 ? (
                <p className="text-fifth text-xs text-center py-2">No tours found</p>
              ) : (
                sortedYears.map((year) => {
                  const isExpanded = expandedYear === year;
                  const yearTours = toursByYear[year];
                  
                  return (
                    <div key={year}>
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full text-fifth text-xs flex items-center justify-between px-2 py-0.5 hover:bg-tertiary/40 transition-colors"
                      >
                        <span className="font-medium text-left">{year}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div>
                          {yearTours.map((tour) => {
                            const isCurrentTour = currentTour === tour.tour;
                            return (
                              <div key={tour.tour_id} className="text-fifth text-xs flex items-center pl-6">
                                <div className="flex-1 text-left leading-tight font-light">
                                  <Link
                                    to={`/tours/${tour.tour_id}`}
                                    onClick={() => handleTourSelect(tour)}
                                    className={`hover:underline transition-colors px-1 font-medium text-left ${
                                      isCurrentTour ? 'bg-tertiary px-1 rounded' : ''
                                    }`}
                                  >
                                    {tour.tour}
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

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