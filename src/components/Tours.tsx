import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search, ArrowUp, ArrowDown, Check, MoveRight, FileMusic, Users } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import TourSongSpread from './TourSongSpread';
import TopSlotsCarousel from './TopSlotsCarousel';
import LongestSongs from './LongestSongs';
import TourSongsCombined from './TourSongsCombined';
import NotPlayedInTour from './NotPlayedInTour';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import wlImage from '../img/WL.png';

interface Show {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  show_venue_location: string | null;
  show_length?: string | null;
  show_rarity?: string | null;
  show_subvenue_venue?: string; // Added for venue navigation
  venue_id?: string; // Added for venue ID
  attended?: boolean; // Added to track if user attended
  show_wl_link?: string | null;
  setlist_entries?: Array<{
    entry_length: string | null;
    entry_song: string;
    times_played_num: string | null;
    shows_since_debut_num: string | null;
    song_category: string;
    category_canonid?: number;
    song_originalartist?: string;
  }>;
}

interface Tour {
  tour: string;
  tour_canonid: number;
  tour_id: string;
  tour_showfields?: boolean;
}

interface SongEntryWithId {
  song: string;
  setnum: number;
  song_id?: string;
}

interface SlotData {
  title: string;
  headerLeft: string;
  headerRight: string;
  data: { left: string; right: string | number }[];
}

interface SlotData {
  show_id: string;
  Show_Date: string;
  Set_1_Opener: SongEntryWithId[] | null;
  Set_1_Closer: SongEntryWithId[] | null;
  Set_2_Opener: SongEntryWithId[] | null;
  Set_2_Closer: SongEntryWithId[] | null;
  Set_3_Opener: SongEntryWithId[] | null;
  Set_3_Closer: SongEntryWithId[] | null;
  Set_4_Opener: SongEntryWithId[] | null;
  Set_4_Closer: SongEntryWithId[] | null;
  Set_5_Opener: SongEntryWithId[] | null;
  Set_5_Closer: SongEntryWithId[] | null;
  Encore_1: SongEntryWithId[] | null;
  Encore_2: SongEntryWithId[] | null;
  Encore_3: SongEntryWithId[] | null;
  [key: string]: string | SongEntryWithId[] | null;
}

export function Tours() {
  const { tour } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTour, setCurrentTour] = React.useState<string>('2025 Fall');
  const [currentTourId, setCurrentTourId] = React.useState<string>('');
  const [currentTourShowFields, setCurrentTourShowFields] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const dropdownListRef = React.useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [slots, setSlots] = React.useState<SlotData[]>([]);
  const [activeColumns, setActiveColumns] = React.useState<string[]>([]);
  const [sortColumn, setSortColumn] = React.useState<string>('show_date');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [hasSlotEntries, setHasSlotEntries] = React.useState(false);
  const [songIdMap, setSongIdMap] = React.useState<{ [songName: string]: string }>({});
  const [topSlots, setTopSlots] = React.useState<SlotData[]>([]);
  const [hasTourSetlistEntries, setHasTourSetlistEntries] = React.useState(false);
  const [uniqueSongCount, setUniqueSongCount] = React.useState<number>(0);
  const [previousTourId, setPreviousTourId] = React.useState<string | null>(null);
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  const getRarityColor = (percentage: string | null): string => {
    // If percentage is null or not a valid percentage string, return transparent
    if (!percentage || percentage === '-') return 'transparent';

    // Convert percentage string to number
    const numericPercentage = parseFloat(percentage.replace('%', ''));

    if (isNaN(numericPercentage)) return 'transparent';

    // Define our 4 color stops with breakpoints at 0, 15, 50, 100
    const colorStops = [
      { percent: 0, color: { r: 156, g: 12, b: 12 } },     // #9C0C0C (Even Darker Red)
      { percent: 12, color: { r: 230, g: 81, b: 0 } },     // #E65100 (Darker Orange)
      { percent: 24, color: { r: 179, g: 135, b: 0 } },    // #D3A304 (Dark Yellow)
      { percent: 50, color: { r: 46, g: 125, b: 50 } },    // #2E7D32 (Darker Green)
      { percent: 100, color: { r: 13, g: 71, b: 161 } }    // #0D47A1 (Darker Blue)
    ];

    // Find the color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    // Calculate interpolation factor
    const range = upperStop.percent - lowerStop.percent;
    const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;

    // Interpolate RGB values
    const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
    const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
    const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Window width state for responsive behavior
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  // Resize event handler
  React.useEffect(() => {
    // Function to update window width
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Initial call to set the width
    handleResize();

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unified loading state
  const [isLoading, setIsLoading] = React.useState(true);

  // Track loading states of individual data components
  const [toursLoaded, setToursLoaded] = React.useState(false);
  const [showsLoaded, setShowsLoaded] = React.useState(false);
  const [slotsLoaded, setSlotsLoaded] = React.useState(false);
  const [songIdsLoaded, setSongIdsLoaded] = React.useState(false);

  // Fetch attendee counts for all shows with pagination
  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        // First get the total count
        const { count, error: countError } = await supabase
          .from('user_attended_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .in('show_id', showIds)
            .range(start, end);
          
          if (error) throw error;
          
          if (data) {
            allData = [...allData, ...data];
          }
        }
        
        // Count attendees per show
        const counts: Record<string, number> = {};
        shows.forEach(show => {
          counts[show.show_id] = 0;
        });
        
        allData.forEach(record => {
          counts[record.show_id] = (counts[record.show_id] || 0) + 1;
        });
        
        setAttendeeCounts(counts);
      } catch (error) {
        console.error('Error fetching attendee counts:', error);
      }
    };
    
    fetchAttendeeCounts();
  }, [shows]);

  // Fetch shows with setlists
  useEffect(() => {
    async function fetchShowsWithSetlists() {
      if (!currentTour || shows.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('show_setlists')
          .select('show_id')
          .in('show_id', shows.map(s => s.show_id));
        
        if (error) throw error;
        
        const setlistSet = new Set(data?.map(item => item.show_id) || []);
        setShowsWithSetlists(setlistSet);
      } catch (error) {
        console.error('Error fetching shows with setlists:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchShowsWithSetlists();
    }
  }, [shows, currentTour]);

  // Fetch attended shows for current user
  useEffect(() => {
    if (!user) {
      setAttendedShowIds([]);
      return;
    }

    const fetchAttendedShows = async () => {
      try {
        const { data, error } = await supabase
          .from('user_attended_shows')
          .select('show_id')
          .eq('user_id', user.id);

        if (error) throw error;

        setAttendedShowIds(data.map(item => item.show_id));
      } catch (error) {
        console.error('Error fetching attended shows:', error);
        setAttendedShowIds([]);
      }
    };

    fetchAttendedShows();
  }, [user]);

  // Helper function to navigate to venue pages
  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.show_subvenue_venue) {
      // If we don't have venue_id but have the venue name, use that
      navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`);
    }
  };

  const getColumnBackgroundColor = (column: string): string => {
    const colorMap: { [key: string]: string } = {
      'Set_1_Opener': '#006400',
      'Set_1_Closer': '#995905',
      'Set_2_Opener': '#019B7A',
      'Set_3_Opener': '#019B7A',
      'Set_4_Opener': '#019B7A',
      'Set_5_Opener': '#019B7A',
      'Set_2_Closer': '#E17401',
      'Set_3_Closer': '#E17401',
      'Set_4_Closer': '#E17401',
      'Set_5_Closer': '#E17401',
      'Encore_1': '#7C2128',
      'Encore_2': '#CE1126',
      'Encore_3': '#AF1E2D'
    };
    return colorMap[column] || '';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-black" /> :
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-black" />;
  };

  const sortData = (data: Show[]) => {
    return [...data].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Show];
      let bValue: any = b[sortColumn as keyof Show];

      // Handle special cases for length and rarity which are percentages/time
      if (sortColumn === 'show_rarity') {
        aValue = aValue ? parseFloat(aValue.replace('%', '')) : -1;
        bValue = bValue ? parseFloat(bValue.replace('%', '')) : -1;
      } else if (sortColumn === 'show_length') {
        // Convert time strings to seconds for comparison
        const timeToSeconds = (timeStr: string | null) => {
          if (!timeStr) return -1;
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        };
        aValue = timeToSeconds(aValue as string | null);
        bValue = timeToSeconds(bValue as string | null);
      } else if (sortColumn === 'show_date') {
        // Ensure dates are compared correctly
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle null values
      if (aValue === null) aValue = '';
      if (bValue === null) bValue = '';

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Check if all data is loaded
  React.useEffect(() => {
    if (toursLoaded && showsLoaded && slotsLoaded && songIdsLoaded) {
      setIsLoading(false);
    }
  }, [toursLoaded, showsLoaded, slotsLoaded, songIdsLoaded]);

  React.useEffect(() => {
    if (!tour) {
      navigate('/tours/2025 Summer', { replace: true });
    }
  }, [tour, navigate]);

  React.useEffect(() => {
    if (tour && tour !== currentTour) {
      setCurrentTour(tour);
    }
  }, [tour]);

  // Effect to handle dropdown opening/closing and scrolling to current tour
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Scroll to the current tour when dropdown opens
    if (isDropdownOpen && dropdownListRef.current) {
      // Find the button for the current tour
      const buttons = dropdownListRef.current.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.trim() === currentTour) {
          button.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, currentTour]);

  React.useEffect(() => {
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('tour, tour_canonid, tour_id, tour_showfields')
          .order('tour_canonid', { ascending: true });

        if (error) {
          throw error;
        }

        // Find the tour_id for initial navigation
        const winter2025 = data?.find(t => t.tour === '2025 Summer');
        if (winter2025 && !tour) {
          navigate(`/tours/${winter2025.tour_id}`, { replace: true });
          setCurrentTourId(winter2025.tour_id);
          setCurrentTour('2025 Summer');
          setCurrentTourShowFields(winter2025.tour_showfields || false);
        }

        setTours(data || []);
        setToursLoaded(true);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setToursLoaded(true); // Still mark as loaded to show error state
      }
    }

    fetchTours();
  }, [tour, navigate]);

  React.useEffect(() => {
    // Fetch all songs to get their IDs
    const fetchSongIds = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('song, song_id');

        if (error) throw error;

        const songMap: { [songName: string]: string } = {};
        data?.forEach(songData => {
          songMap[songData.song] = songData.song_id;
        });

        setSongIdMap(songMap);
        setSongIdsLoaded(true);
      } catch (error) {
        console.error('Error fetching song IDs:', error);
        setSongIdsLoaded(true); // Still mark as loaded to show error state
      }
    };

    fetchSongIds();
  }, []);

  React.useEffect(() => {
    // If the tour parameter changes, set loading to true
    if (tour !== previousTourId) {
      setIsLoading(true);
      setPreviousTourId(tour || null);
    }

    if (tour && tours.length > 0) {
      const tourData = tours.find(t => t.tour_id === tour);
      if (tourData) {
        setCurrentTour(tourData.tour);
        setCurrentTourId(tourData.tour_id);
        setCurrentTourShowFields(tourData.tour_showfields || false);
      }
    }
  }, [tour, tours, previousTourId]);

  React.useEffect(() => {
    // Reset loading states when tour changes
    if (currentTour) {
      setIsLoading(true);
      setShowsLoaded(false);
      setSlotsLoaded(false);
    }

    // We'll use Promise.all to load everything in parallel
    async function fetchAllData() {
      try {
        // Start both requests in parallel rather than sequentially
        const showsPromise = supabase
          .from('shows')
          .select(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_venue_location,
            show_subvenue_venue,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            setlist_entries (
              entry_length,
              entry_song,
              entry_short,
              times_played_num,
              shows_since_debut_num,
              songs (
                song_category,
                song_originalartist,
                categories (
                  category_canonid,
                  category_artwork
                )
              )
            )
          `)
          .eq('show_tour', currentTour)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        const placementsPromise = supabase
          .from('placements')
          .select('placements, placement_order')
          .order('placement_order');

        const slotsPromise = supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_canonid,
            show_group,
            setlist_entries (
              entry_placement,
              entry_song,
              entry_setnum
            )
          `)
          .eq('show_tour', currentTour)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        // Wait for all data to be fetched
        const [showsResult, placementsResult, slotsResult] = await Promise.all([
          showsPromise,
          placementsPromise,
          slotsPromise
        ]);

        // Check for errors in any of the requests
        if (showsResult.error) throw showsResult.error;
        if (placementsResult.error) throw placementsResult.error;
        if (slotsResult.error) throw slotsResult.error;

        // Process shows data
        const processedShows = showsResult.data?.map(show => {
          // Calculate show length
          let totalSeconds = 0;
          const hasLength = show.setlist_entries?.some(entry => entry.entry_length !== null);

          if (hasLength) {
            show.setlist_entries?.forEach(entry => {
              if (entry.entry_length) {
                const parts = entry.entry_length.split(':').map(Number);
                if (parts.length === 3) {
                  const [hours, minutes, seconds] = parts;
                  totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
                } else if (parts.length === 2) {
                  const [minutes, seconds] = parts;
                  totalSeconds += (minutes * 60) + seconds;
                }
              }
            });
          }

          // Format length string
          let show_length = null;
          if (totalSeconds > 0) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            show_length = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }

          // Calculate show rarity
          let show_rarity = null;
          if (show.show_canonid && show.setlist_entries?.length) {
            const skipShorts = ["fake", "tease", "reprise", "aborted"];
            const uniqueSongs = new Map();
            
            // First pass: identify songs with at least one valid performance
            const songsWithValidPerformance = new Set<string>();
            show.setlist_entries.forEach(entry => {
              if (!entry.entry_short || !skipShorts.includes(entry.entry_short.toLowerCase())) {
                songsWithValidPerformance.add(entry.entry_song);
              }
            });
            
            // Second pass: add songs to the map only if they have a valid performance
            show.setlist_entries.forEach(entry => {
              if (songsWithValidPerformance.has(entry.entry_song) && !uniqueSongs.has(entry.entry_song)) {
                uniqueSongs.set(entry.entry_song, {
                  times_played_num: entry.times_played_num,
                  shows_since_debut_num: entry.shows_since_debut_num
                });
              }
            });

            const totalPlays = Array.from(uniqueSongs.values()).reduce((sum, entry) =>
              sum + (entry.times_played_num ? parseInt(entry.times_played_num, 10) : 0), 0);

            const totalShows = Array.from(uniqueSongs.values()).reduce((sum, entry) =>
              sum + (entry.shows_since_debut_num ? parseInt(entry.shows_since_debut_num, 10) : 0), 0);

            if (totalShows > 0) {
              const percentage = (totalPlays * 100.0) / totalShows;
              show_rarity = `${percentage.toFixed(2)}%`;
            }
          }

          return {
            ...show,
            show_length,
            show_rarity,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id)
          };
        });

        // Process slots data
        const transformedData = slotsResult.data?.map(show => {
          const slots: any = {
            show_id: show.show_id,
            Show_Date: show.show_date
          };

          // Group entries by placement
          const placementEntries: { [key: string]: Array<SongEntryWithId> } = {};

          show.setlist_entries?.forEach(entry => {
            // Skip main set entries
            if (entry.entry_placement.startsWith('Main Set')) {
              return;
            }

            const key = entry.entry_placement.replace(/\s+/g, '_');
            if (!placementEntries[key]) {
              placementEntries[key] = [];
            }
            placementEntries[key].push({
              song: entry.entry_song,
              setnum: entry.entry_setnum
            });
          });

          // Add entries to slots
          Object.entries(placementEntries).forEach(([key, entries]) => {
            // Sort entries by setnum
            entries.sort((a, b) => a.setnum - b.setnum);
            slots[key] = entries;
          });

          return slots;
        });

        // Find active columns and order them according to placement_order
        const columnsWithData = new Set<string>();
        transformedData?.forEach(show => {
          Object.entries(show).forEach(([key, value]) => {
            if (value && key !== 'show_id' && key !== 'Show_Date') {
              columnsWithData.add(key);
            }
          });
        });

        // Order the columns based on placement_order
        const orderedColumns = placementsResult.data
          ?.filter(p => Array.from(columnsWithData).includes(p.placements.replace(/\s+/g, '_')))
          .map(p => p.placements.replace(/\s+/g, '_'));

        const hasEntries = (transformedData || []).some(show =>
          Object.keys(show).some(key =>
            key !== 'show_id' &&
            key !== 'Show_Date' &&
            show[key] !== null
          )
        );

        // Update all state at once after processing
        // Check if any show has setlist entries
        const hasAnySetlistEntries = processedShows?.some(show =>
          show.setlist_entries && show.setlist_entries.length > 0
        );
        setHasTourSetlistEntries(hasAnySetlistEntries || false);
        setShows(processedShows || []);
        setHasSlotEntries(hasEntries);
        setSlots(transformedData || []);
        setActiveColumns(orderedColumns || []);

        // Mark data as loaded
        setShowsLoaded(true);
        setSlotsLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Even on error, mark as loaded to show error state
        setShowsLoaded(true);
        setSlotsLoaded(true);
      }
    }

    if (currentTour) {
      fetchAllData();
    }
  }, [currentTour, attendedShowIds]);

  // Fetch placement data for top slots
  React.useEffect(() => {
    async function fetchPlacementData() {
      if (!currentTour || showsLoaded === false) return;

      try {
        // Get all show IDs for this tour
        const showIds = shows.map(show => show.show_id);

        if (showIds.length === 0) return;

        // First fetch all setlist entries with their placements
        const { data: entriesData, error: entriesError } = await supabase
          .from('setlist_entries')
          .select(`
            entry_id,
            entry_placement,
            entry_song,
            entry_show
          `)
          .in('entry_show', showIds);

        if (entriesError) throw entriesError;

        // Then fetch song category information for all unique songs
        const uniqueSongs = [...new Set(entriesData?.map(entry => entry.entry_song) || [])];

        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select(`
            song,
            song_category,
            categories (
              category_canonid,
              category_artwork
            )
          `)
          .in('song', uniqueSongs);

        if (songsError) throw songsError;

        // Create maps of songs to their category IDs and artwork
        const songCategoryMap: Record<string, number> = {};
        const songArtworkMap: Record<string, string> = {};

        songsData?.forEach(song => {
          songCategoryMap[song.song] = song.categories?.category_canonid || 999;
          if (song.categories?.category_artwork) {
            songArtworkMap[song.song] = song.categories.category_artwork;
          }
        });

        // Process the entries data with the category information
        const processedTopSlots = processTourDataWithCategories(entriesData || [], songCategoryMap, songArtworkMap);
        setTopSlots(processedTopSlots);
      } catch (error) {
        console.error('Error fetching placement data:', error);
      }
    }

    // Function to process tour data with category information
    const processTourDataWithCategories = (
      entries: Array<{ entry_placement: string; entry_song: string; entry_show?: string }>,
      songCategoryMap: Record<string, number>,
      songArtworkMap: Record<string, string>
    ) => {
      // Count songs by placement categories
      const showOpeners: Record<string, number> = {};
      const setOpeners: Record<string, number> = {};
      const setClosers: Record<string, number> = {};
      const encores: Record<string, number> = {};

      // Track unique combinations of show+placement+song
      const uniqueCombinations = new Set<string>();

      entries.forEach(entry => {
        const placement = entry.entry_placement || '';
        const show = entry.entry_show || '';
        const song = entry.entry_song;

        // Create a unique key for this show+placement+song combination
        const uniqueKey = `${show}|${placement}|${song}`;

        // Only process if we haven't seen this combination before
        if (!uniqueCombinations.has(uniqueKey)) {
          uniqueCombinations.add(uniqueKey);

          // Show openers (Set 1 Opener)
          if (placement === "Set 1 Opener") {
            showOpeners[song] = (showOpeners[song] || 0) + 1;
          }

          // Set Openers (contains "Opener")
          if (placement.includes("Opener")) {
            setOpeners[song] = (setOpeners[song] || 0) + 1;
          }

          // Set Closers (contains "Closer")
          if (placement.includes("Closer")) {
            setClosers[song] = (setClosers[song] || 0) + 1;
          }

          // Encores (contains "Encore")
          if (placement.includes("Encore")) {
            encores[song] = (encores[song] || 0) + 1;
          }
        }
      });

      // Check if all categories are empty
      const hasShowOpeners = Object.keys(showOpeners).length > 0;
      const hasSetOpeners = Object.keys(setOpeners).length > 0;
      const hasSetClosers = Object.keys(setClosers).length > 0;
      const hasEncores = Object.keys(encores).length > 0;

      // If all categories are empty, return an empty array
      if (!hasShowOpeners && !hasSetOpeners && !hasSetClosers && !hasEncores) {
        return [];
      }

      // Format data for top slots
      const formatSlotData = (data: Record<string, number>, title: string): SlotData => {
        const sortedData = Object.entries(data)
          .map(([song, count]) => ({
            song,
            count,
            categoryCanonId: songCategoryMap[song] || 999,
            artwork: songArtworkMap[song] || undefined  // Added artwork
          }))
          .sort((a, b) => {
            // First by count (descending)
            if (a.count !== b.count) {
              return b.count - a.count;
            }

            // Then by category_canonid (ascending)
            if (a.categoryCanonId !== b.categoryCanonId) {
              return a.categoryCanonId - b.categoryCanonId;
            }

            // Finally alphabetically by song name
            return a.song.localeCompare(b.song);
          })
          .slice(0, 8) // Get top 8
          .map(({ song, count, artwork }) => ({ left: song, right: count, artwork }));

        // If no data, return empty data instead of placeholder
        if (sortedData.length === 0) {
          return {
            title,
            headerLeft: 'Song',
            headerRight: 'Count',
            data: []
          };
        }

        return {
          title,
          headerLeft: 'Song',
          headerRight: 'Count',
          data: sortedData
        };
      };

      // Create slot data for carousel, only include non-empty categories
      const result = [];

      if (hasShowOpeners) {
        result.push(formatSlotData(showOpeners, 'Show Openers'));
      }

      if (hasSetOpeners) {
        result.push(formatSlotData(setOpeners, 'Set Openers'));
      }

      if (hasSetClosers) {
        result.push(formatSlotData(setClosers, 'Set Closers'));
      }

      if (hasEncores) {
        result.push(formatSlotData(encores, 'Encores'));
      }

      return result;
    };

    fetchPlacementData();
  }, [currentTour, shows, showsLoaded]);

  const renderSongList = (songs: SongEntryWithId[] | null) => {
    if (!songs || songs.length === 0) return null;
  
    return (
      <div
        className="w-full text-left"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
          whiteSpace: 'normal',
          hyphens: 'none'
        }}
      >
        {songs.map((song, index) => (
          <React.Fragment key={`${song.song}-${index}`}>
            {index > 0 && (
              <MoveRight className="text-red-500 inline w-[1rem] h-[1rem] mr-1" />
            )}
            <a
              onClick={() => {
                setModalSongData({
                  isOpen: true,
                  songName: song.song
                });
              }}
              className={`font-semibold hover:text-[#a9682e] transition-colors text-black table-link cursor-pointer inline ${
                index < songs.length - 1 ? 'mr-1' : ''
              }`}
            >
              {song.song}
            </a>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Show a loading state while data is being fetched and processed
  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Tours</h1>
          <div className="relative" ref={dropdownRef}>
            <div className="hidden md:block">
              <button
                className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black transition-colors text-base font-mohr"
              >
                {currentTour}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading tour data...</p>
        </div>
      </div>
    );
  }

  // Handle the case where no tour is found
  if (tours.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Tours</h1>
          <div className="relative" ref={dropdownRef}>
            <div className="hidden md:block">
              <button
                className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black transition-colors text-base font-mohr"
              >
                Select Tour
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <p className="text-black">No tours found</p>
        </div>
      </div>
    );
  }

  // Return statement of the Tours component
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Tours</h1>
        <div className="relative" ref={dropdownRef}>
          <div className="md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-lg bg-[#f9ae37] text-black hover:bg-[#fce7ca]/90 transition-colors border border-black"
            >
              <Search className="w-6 h-6" />
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Select Tour"
            >
              <div className="space-y-0">
                <div className="divide-y divide-black/10">
                  {tours.map((tour) => (
                    <button
                      key={tour.tour}
                      onClick={() => {
                        setCurrentTourId(tour.tour_id);
                        setCurrentTour(tour.tour);
                        navigate(`/tours/${tour.tour_id}`);
                        setIsModalOpen(false);
                      }}
                      className="w-full text-left px-4 py-1 text-sm rounded-lg hover:bg-black/10 transition-colors font-semibold"
                    >
                      <span className="text-black">{tour.tour}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black hover:bg-tertiary transition-colors text-base font-mohr"
            >
              {currentTour}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
            <div
              ref={dropdownListRef}
              className={`absolute py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto ${window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-64 max-h-96'
                }`}
            >
              {tours.map((tour) => (
                <button
                  key={tour.tour}
                  onClick={() => {
                    setCurrentTourId(tour.tour_id);
                    setCurrentTour(tour.tour);
                    navigate(`/tours/${tour.tour_id}`);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${currentTour === tour.tour ? 'bg-[#f9ae37]' : ''
                    }`}
                >
                  {tour.tour}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {shows.length === 0 ? (
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <p className="text-black">No shows found for {currentTour}</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="bg-primary border border-black rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                {currentTour}
              </h2>
              <span className="text-black font-semibold text-lg">{shows.length} {shows.length === 1 ? 'Show' : 'Shows'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    {[
                      { key: 'show_date', label: 'Date' },
                      ...(user ? [{ key: 'attended', label: <Check size={16} className="text-black" strokeWidth={4} /> }] : []),
                      { key: 'setlist', label: <FileMusic size={16} className="text-black" strokeWidth={2} /> },
                      { key: 'show_group', label: 'Group' },
                      { key: 'show_length', label: 'Length' },
                      { key: 'show_rarity', label: 'Rarity' },
                      { key: 'show_subvenue', label: 'Venue' },
                      { key: 'show_venue_location', label: 'Location' },
                      { key: 'users', label: <Users size={16} className="text-black" strokeWidth={2} /> },
                      { key: 'wl_link', label: <img src={wlImage} alt="WysteriaLane" className="w-4 h-4" /> },
                      { key: 'show_detail', label: 'Detail' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => key !== 'attended' && key !== 'setlist' && key !== 'users' ? handleSort(key) : null}
                        className={`${key === 'show_length' || key === 'show_rarity' || key === 'show_date' ? 'text-center' : 'text-left'} 
                          text-s font-semibold text-black whitespace-nowrap 
                          ${key !== 'attended' && key !== 'setlist' && key !== 'users' && key !== 'wl_link' ? 'px-4 py-1 cursor-pointer hover:bg-black/10' : 'w-8 px-1 py-1 text-center'}`}
                      >
                        <div className={`flex items-center ${key === 'show_length' || key === 'show_rarity' || key === 'show_date' || key === 'setlist' || key === 'users' || key === 'wl_link' ? 'justify-center' : ''} gap-1`}>
                          {label}
                          {key !== 'attended' && key !== 'setlist' && key !== 'users' && key !== 'wl_link' && getSortIcon(key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortData(shows).map((show, index) => (
                    <tr
                      key={show.show_id}
                      className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                        } hover:bg-black/10 transition-colors text-xs`}
                    >
                      <td className="px-4 py-0.5 text-black text-center whitespace-nowrap">
                        <span className="font-semibold">
                          <button
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                            className="hover:text-[#a9682e] transition-colors table-link"
                          >
                            {show.show_date
                              .split('-')
                              .slice(1)
                              .concat(show.show_date.substring(2, 4))
                              .join('.')}
                          </button>
                        </span>
                      </td>
                      {user && (
                        <td className="w-8 text-center">
                          {show.attended && (
                            <div className="flex justify-center items-center h-full">
                              <div className="rounded-full p-0.5 bg-green-600">
                                <Check size={12} className="text-white" strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </td>
                      )}
                      <td className="w-8 text-center align-middle">
                        {showsWithSetlists.has(show.show_id) && (
                          <div className="flex justify-center items-center h-full">
                            <button
                              onClick={() => {
                                // Navigate with a state parameter to open the modal
                                navigate(`/setlist/${show.show_id}`, { state: { openChangesModal: true } });
                              }}
                              className="hover:text-[#a9682e] hover:bg-[#f9ae37] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                            >
                              <FileMusic size={14.5} className="text-black" strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">{show.show_group}</td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap text-center">
                        {show.show_length || ''}
                      </td>
                      <td className="px-4 py-0 whitespace-nowrap text-center">
                        {show.show_rarity ? (
                          <span
                            className="text-white font-medium px-2 py-0.5 rounded-md inline-block"
                            style={{
                              backgroundColor: getRarityColor(show.show_rarity)
                            }}
                          >
                            {show.show_rarity}
                          </span>
                        ) : (
                          <span className="text-black"></span>
                        )}
                      </td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        <button
                          onClick={() => navigateToVenue(show)}
                          className="hover:text-[#a9682e] hover:underline transition-colors"
                        >
                          {show.show_subvenue}
                        </button>
                      </td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        {show.show_venue_location}
                      </td>
                      <td className="w-8 text-center text-black">
                        {attendeeCounts[show.show_id] > 0 && (
                          <span className="text-xs font-semibold">{attendeeCounts[show.show_id]}</span>
                        )}
                      </td>
                      <td className="w-8 text-center align-middle">
                        {show.show_wl_link && (
                          <div className="flex justify-center items-center h-full">
                            <button
                              onClick={() => window.open(show.show_wl_link, '_blank')}
                              className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
                            >
                              <img src={wlImage} alt="WysteriaLane" className="w-[14.5px] h-[14.5px]" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        {show.show_detail && show.show_detail}
                        {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
                        {show.show_alert && <span className="text-[#CE1126]"><strong>[{show.show_alert}]</strong></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {shows.length > 0 && hasSlotEntries && (
        <div className="mt-6">
          <div className="bg-primary border border-black rounded-lg p-3">
            <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-4">
              Slots
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    <th
                      className="w-[85px] min-w-[85px] px-4 py-1 text-left text-s font-semibold text-black">
                      Date
                    </th>
                    {activeColumns.map(column => (
                      <th
                        key={column}
                        className="px-4 py-1 text-left text-s font-semibold text-white/90"
                        style={{
                          width: '190px',
                          minWidth: '190px',
                          backgroundColor: getColumnBackgroundColor(column)
                        }}
                      >
                        {column.split('_').map(word =>
                          word === 'Op' ? 'Opener' :
                            word === 'Cl' ? 'Closer' :
                              word
                        ).join(' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {slots.map((slot, index) => (
                    <tr
                      key={`slot-${slot.show_id}`}
                      className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                        } hover:bg-black/10 transition-colors text-xs`}
                    >
                      <td className="w-[85px] min-w-[85px] px-4 py-1 text-black whitespace-nowrap">
                        <span className="font-semibold">
                          <button
                            onClick={() => navigate(`/setlist/${slot.show_id}`)}
                            className="hover:text-[#a9682e] transition-colors table-link"
                          >
                            {slot.Show_Date
                              .split('-')
                              .slice(1)
                              .concat(slot.Show_Date.substring(2, 4))
                              .join('.')}
                          </button>
                        </span>
                      </td>
                      {activeColumns.map(column => (
                        <td
                          key={`${slot.show_id}-${column}`}
                          className="px-4 py-1 text-left align-middle"
                          style={{
                            width: '190px',
                            minWidth: '190px',
                            maxWidth: '190px',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            textAlign: 'left'
                          }}
                        >
                          {renderSongList(slot[column] as SongEntryWithId[] | null)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {shows.length > 0 && hasTourSetlistEntries && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Song Spread and Not Played In Tour */}
          <div className="flex flex-col gap-6">
            {/* Song Spread */}
            <TourSongSpread shows={shows} />
            
            {/* Not Played In Tour - conditionally rendered based on tour_showfields */}
            {currentTourShowFields && (
              <NotPlayedInTour
                tourId={currentTourId}
                tourName={currentTour}
                showIds={shows.map(show => show.show_id)}
                songIdMap={songIdMap}
              />
            )}
          </div>

          {/* Right column on desktop contains TopSlotsCarousel and LongestSongs */}
          <div className="flex flex-col gap-6">
            {/* TopSlotsCarousel */}
            {topSlots.length > 0 && (
              <TopSlotsCarousel
                slots={topSlots}
                isMobile={windowWidth < 1280}
                songIdMap={songIdMap}
                onSongClick={(songId) => navigate(`/song/${songId}`)}
                tourId={currentTourId}
              />
            )}

            {/* LongestSongs */}
            <LongestSongs
              showIds={shows.map(show => show.show_id)}
              songIdMap={songIdMap}
              tourId={currentTourId}
            />
          </div>
        </div>
      )}

      {shows.length > 0 && hasTourSetlistEntries && (
        <div className="mt-6">
          <TourSongsCombined
            shows={shows}
            songIdMap={songIdMap}
            onSongCountChange={setUniqueSongCount}
            uniqueSongCount={uniqueSongCount}
            tourId={currentTourId}
          />
        </div>
      )}

      {/* Song Tour Performances Modal */}
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