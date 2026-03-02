import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Show, Tour, SlotShowData, SlotData } from '../types/tourTypes';
import { processTourDataWithCategories, processShowData, processSlotsData } from '../utils/tourDataProcessing';
import { 
  fetchTours, 
  fetchSongIds, 
  fetchAttendedShows, 
  fetchAttendeeCounts, 
  fetchShowsWithSetlists, 
  fetchShowsWithReleases, 
  fetchShowsWithRadioIds,
  fetchShowRatings, 
  fetchMainTourData, 
  fetchPlacementData 
} from '../utils/tourDataFetching';

export function useTourData() {
  const { tour } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [currentTour, setCurrentTour] = useState<string>('');
  const [currentTourId, setCurrentTourId] = useState<string>('');
  const [currentTourShowFields, setCurrentTourShowFields] = useState<boolean>(false);
  const [shows, setShows] = useState<Show[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
  const [slots, setSlots] = useState<SlotShowData[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [hasSlotEntries, setHasSlotEntries] = useState(false);
  const [songIdMap, setSongIdMap] = useState<{ [songName: string]: string }>({});
  const [topSlots, setTopSlots] = useState<SlotData[]>([]);
  const [hasTourSetlistEntries, setHasTourSetlistEntries] = useState(false);
  const [hasGuestAppearances, setHasGuestAppearances] = useState(false);
  const [uniqueSongCount, setUniqueSongCount] = useState<number>(0);
  const [previousTourId, setPreviousTourId] = useState<string | null>(null);
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());
  const [showsWithRadioIds, setShowsWithRadioIds] = useState<Set<string>>(new Set());

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [toursLoaded, setToursLoaded] = useState(false);
  const [showsLoaded, setShowsLoaded] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [songIdsLoaded, setSongIdsLoaded] = useState(false);

  // Fetch song IDs
  useEffect(() => {
    const fetchSongData = async () => {
      try {
        const songMap = await fetchSongIds();
        setSongIdMap(songMap);
        setSongIdsLoaded(true);
      } catch (error) {
        console.error('Error fetching song IDs:', error);
        setSongIdsLoaded(true);
      }
    };

    fetchSongData();
  }, []);

  // Initialize tour from URL
  useEffect(() => {
    async function initializeTour() {
      try {
        const data = await fetchTours();
        setTours(data);

        // If no tour in URL, redirect
        if (!tour) {
          const winter2025 = data.find(t => t.tour === '2025 Holiday Run');
          if (winter2025) {
            navigate(`/tours/${winter2025.tour_id}`, { replace: true });
          }
          return;
        }

        // Validate that the tour_id in URL exists
        const tourData = data.find(t => t.tour_id === tour);
        
        if (tourData) {
          setCurrentTour(tourData.tour);
          setCurrentTourId(tourData.tour_id);
          setCurrentTourShowFields(tourData.tour_showfields || false);
        } else {
          // Invalid tour_id - redirect
          const winter2025 = data.find(t => t.tour === '2025 Holiday Run');
          if (winter2025) {
            navigate(`/tours/${winter2025.tour_id}`, { replace: true });
          }
        }

        setToursLoaded(true);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setToursLoaded(true);
      }
    }

    initializeTour();
  }, [tour, navigate]);

  // Fetch attended shows for user
  useEffect(() => {
    if (!user) {
      setAttendedShowIds([]);
      return;
    }

    const fetchUserAttendedShows = async () => {
      try {
        const attendedShows = await fetchAttendedShows(user.id);
        setAttendedShowIds(attendedShows);
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setAttendedShowIds([]);
      }
    };

    fetchUserAttendedShows();
  }, [user]);

  // Fetch attendee counts
  useEffect(() => {
    const fetchUserAttendeeCounts = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        const counts = await fetchAttendeeCounts(showIds);
        setAttendeeCounts(counts);
      } catch (error) {
        console.error('Error fetching attendee counts:', error);
      }
    };
    
    fetchUserAttendeeCounts();
  }, [shows]);

  // Fetch shows with setlists
  useEffect(() => {
    async function fetchUserShowsWithSetlists() {
      if (!currentTour || shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        const setlistSet = await fetchShowsWithSetlists(showIds);
        setShowsWithSetlists(setlistSet);
      } catch (error) {
        console.error('Error fetching shows with setlists:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchUserShowsWithSetlists();
    }
  }, [shows, currentTour]);

  // Fetch shows with releases
  useEffect(() => {
    async function fetchUserShowsWithReleases() {
      if (!currentTour || shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        const releaseSet = await fetchShowsWithReleases(showIds);
        setShowsWithReleases(releaseSet);
      } catch (error) {
        console.error('Error fetching shows with releases:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchUserShowsWithReleases();
    }
  }, [shows, currentTour]);

  // Fetch shows with radio IDs
  useEffect(() => {
    async function fetchUserShowsWithRadioIds() {
      if (!currentTour || shows.length === 0) return;

      try {
        const showIds = shows.map(s => s.show_id);
        const radioSet = await fetchShowsWithRadioIds(showIds);
        setShowsWithRadioIds(radioSet);
      } catch (error) {
        console.error('Error fetching shows with radio IDs:', error);
      }
    }

    if (shows.length > 0) {
      fetchUserShowsWithRadioIds();
    }
  }, [shows, currentTour]);

  // Fetch show ratings
  useEffect(() => {
    const fetchUserShowRatings = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        const ratings = await fetchShowRatings(showIds);
        setShowRatings(ratings);
      } catch (error) {
        console.error('Error fetching show ratings:', error);
      }
    };
    
    fetchUserShowRatings();
  }, [shows]);

  // Fetch main tour data
  useEffect(() => {
    if (!currentTour) return;

    setIsLoading(true);
    setShowsLoaded(false);
    setSlotsLoaded(false);

    async function fetchAllData() {
      try {
        const { shows: showsData, placements, slots: slotsData } = await fetchMainTourData(currentTour);

        const processedShows = processShowData(showsData || [], attendedShowIds);
        const transformedData = processSlotsData(slotsData || []);

        const columnsWithData = new Set<string>();
        transformedData?.forEach(show => {
          Object.entries(show).forEach(([key, value]) => {
            if (value && key !== 'show_id' && key !== 'Show_Date') {
              columnsWithData.add(key);
            }
          });
        });

        const orderedColumns = placements
          ?.filter(p => Array.from(columnsWithData).includes(p.placements.replace(/\s+/g, '_')))
          .map(p => p.placements.replace(/\s+/g, '_'));

        const hasEntries = (transformedData || []).some(show =>
          Object.keys(show).some(key =>
            key !== 'show_id' &&
            key !== 'Show_Date' &&
            show[key] !== null
          )
        );

        // Filter out shows with no slot data
        const filteredSlots = (transformedData || []).filter(show => {
          return Object.entries(show).some(([key, value]) => {
            if (key === 'show_id' || key === 'Show_Date') return false;
            return value && Array.isArray(value) && value.length > 0;
          });
        });

        const hasAnySetlistEntries = processedShows?.some(show =>
          show.setlist_entries && show.setlist_entries.length > 0
        );
        setHasTourSetlistEntries(hasAnySetlistEntries || false);
        setShows(processedShows || []);
        setHasSlotEntries(hasEntries);
        setSlots(filteredSlots);
        setActiveColumns(orderedColumns || []);

        setShowsLoaded(true);
        setSlotsLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setShowsLoaded(true);
        setSlotsLoaded(true);
      }
    }

    fetchAllData();
  }, [currentTour, attendedShowIds]);

  // Fetch placement data for top slots
  useEffect(() => {
    async function fetchUserPlacementData() {
      if (!currentTour || showsLoaded === false) return;

      try {
        const showIds = shows.map(show => show.show_id);

        if (showIds.length === 0) return;

        const { entries: entriesData } = await fetchPlacementData(showIds);

        const processedTopSlots = await processTourDataWithCategories(entriesData || [], showIds);
        setTopSlots(processedTopSlots);
      } catch (error) {
        console.error('Error fetching placement data:', error);
      }
    }

    fetchUserPlacementData();
  }, [currentTour, shows, showsLoaded]);

  // Handle loading state
  useEffect(() => {
    if (toursLoaded && showsLoaded && slotsLoaded && songIdsLoaded) {
      setIsLoading(false);
    }
  }, [toursLoaded, showsLoaded, slotsLoaded, songIdsLoaded]);

  // Handle tour change
  useEffect(() => {
    if (tour !== previousTourId) {
      setIsLoading(true);
      setPreviousTourId(tour || null);
    }
  }, [tour, previousTourId]);

  return {
    // State
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
    showsWithRadioIds,
    isLoading,
    
    // Setters
    setCurrentTour,
    setCurrentTourId,
    setCurrentTourShowFields,
    setHasGuestAppearances,
    setUniqueSongCount
  };
}
