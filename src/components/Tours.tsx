import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search, ArrowUp, ArrowDown, Check, MoveRight, FileMusic, Users, Star, AudioLines } from 'lucide-react';
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
  show_rarity?: string | null;  // This will be formatted with %
  show_gap?: string | null;
  show_subvenue_venue?: string;
  venue_id?: string;
  attended?: boolean;
  show_wl_link?: string | null;
  setlist_entries?: Array<{
    entry_length: string | null;
    entry_song: string;
    times_played_num: string | null;
    shows_since_debut_num: string | null;
    song_category: string;
    category_canonid?: number;
    song_originalartist?: string;
    entry_short?: string | null;
    last_count?: string | null;
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
  const [currentTour, setCurrentTour] = React.useState<string>('');
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
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

  const getRarityColor = (percentage: string | null): string => {
    if (!percentage || percentage === '-') return 'transparent';

    const numericPercentage = parseFloat(percentage.replace('%', ''));

    if (isNaN(numericPercentage)) return 'transparent';

    const cappedPercentage = Math.min(numericPercentage, 100);

    const colorStops = [
      { percent: 0, color: { r: 156, g: 12, b: 12 } },
      { percent: 12, color: { r: 230, g: 81, b: 0 } },
      { percent: 24, color: { r: 179, g: 135, b: 0 } },
      { percent: 50, color: { r: 46, g: 125, b: 50 } },
      { percent: 100, color: { r: 13, g: 71, b: 161 } }
    ];

    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (cappedPercentage >= colorStops[i].percent && cappedPercentage <= colorStops[i + 1].percent) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    const range = upperStop.percent - lowerStop.percent;
    const factor = range !== 0 ? (cappedPercentage - lowerStop.percent) / range : 0;

    const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
    const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
    const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getGapColor = (value: string | null): string => {
    if (!value || value === '-') return 'transparent';

    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) return 'transparent';

    const cappedValue = Math.min(numericValue, 100);

    const colorStops = [
      { percent: 0, color: { r: 13, g: 71, b: 161 } },
      { percent: 12, color: { r: 46, g: 125, b: 50 } },
      { percent: 24, color: { r: 179, g: 135, b: 0 } },
      { percent: 50, color: { r: 230, g: 81, b: 0 } },
      { percent: 100, color: { r: 156, g: 12, b: 12 } }
    ];

    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (cappedValue >= colorStops[i].percent && cappedValue <= colorStops[i + 1].percent) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    const range = upperStop.percent - lowerStop.percent;
    const factor = range !== 0 ? (cappedValue - lowerStop.percent) / range : 0;

    const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
    const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
    const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

    return `rgb(${r}, ${g}, ${b})`;
  };

  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isLoading, setIsLoading] = React.useState(true);
  const [toursLoaded, setToursLoaded] = React.useState(false);
  const [showsLoaded, setShowsLoaded] = React.useState(false);
  const [slotsLoaded, setSlotsLoaded] = React.useState(false);
  const [songIdsLoaded, setSongIdsLoaded] = React.useState(false);

  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        const { count, error: countError } = await supabase
          .from('user_attended_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
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

  useEffect(() => {
    async function fetchShowsWithReleases() {
      if (!currentTour || shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        const { count, error: countError } = await supabase
          .from('releases_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allReleaseShows: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('releases_shows')
            .select('show_id')
            .in('show_id', showIds)
            .range(start, end);
          
          if (error) throw error;
          
          if (data) {
            allReleaseShows = [...allReleaseShows, ...data];
          }
        }
        
        const releaseSet = new Set(allReleaseShows.map(item => item.show_id));
        setShowsWithReleases(releaseSet);
      } catch (error) {
        console.error('Error fetching shows with releases:', error);
      }
    }
    
    if (shows.length > 0) {
      fetchShowsWithReleases();
    }
  }, [shows, currentTour]);

  useEffect(() => {
    const fetchShowRatings = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        const { data, error } = await supabase
          .from('show_ratings')
          .select('show_id, rating')
          .in('show_id', showIds);
        
        if (error) throw error;
        
        const ratings: Record<string, number> = {};
        shows.forEach(show => {
          const showRatingsData = data?.filter(r => r.show_id === show.show_id) || [];
          if (showRatingsData.length > 0) {
            const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
            ratings[show.show_id] = Math.round(average * 100) / 100;
          } else {
            ratings[show.show_id] = 0;
          }
        });
        
        setShowRatings(ratings);
      } catch (error) {
        console.error('Error fetching show ratings:', error);
      }
    };
    
    fetchShowRatings();
  }, [shows]);

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

  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`);
    }
  };

  const getColumnBackgroundColor = (column: string): string => {
    const colorMap: { [key: string]: string } = {
      'Set_1_Opener': '#047857',
      'Set_1_Closer': '#1e40af',
      'Set_2_Opener': '#10b981',
      'Set_3_Opener': '#10b981',
      'Set_4_Opener': '#10b981',
      'Set_5_Opener': '#10b981',
      'Set_2_Closer': '#3b82f6',
      'Set_3_Closer': '#3b82f6',
      'Set_4_Closer': '#3b82f6',
      'Set_5_Closer': '#3b82f6',
      'Encore_1': '#be123c',
      'Encore_2': '#f43f5e',
      'Encore_3': '#f43f5e'
    };
    return colorMap[column] || '';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rating' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" /> :
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  const sortData = (data: Show[]) => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'rating') {
        aValue = showRatings[a.show_id] || 0;
        bValue = showRatings[b.show_id] || 0;
      } else if (sortColumn === 'attendees') {
        aValue = attendeeCounts[a.show_id] || 0;
        bValue = attendeeCounts[b.show_id] || 0;
      } else {
        aValue = a[sortColumn as keyof Show];
        bValue = b[sortColumn as keyof Show];
      }

      if (sortColumn === 'show_rarity') {
        aValue = aValue && aValue !== '-' ? parseFloat(aValue.replace('%', '')) : -1;
        bValue = bValue && bValue !== '-' ? parseFloat(bValue.replace('%', '')) : -1;
      } else if (sortColumn === 'show_gap') {
        aValue = aValue ? parseFloat(aValue) : -1;
        bValue = bValue ? parseFloat(bValue) : -1;
      } else if (sortColumn === 'show_length') {
        const timeToSeconds = (timeStr: string | null) => {
          if (!timeStr) return -1;
          const [hours, minutes, seconds] = timeStr.split(':').map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        };
        aValue = timeToSeconds(aValue as string | null);
        bValue = timeToSeconds(bValue as string | null);
      } else if (sortColumn === 'show_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue === null) aValue = '';
      if (bValue === null) bValue = '';

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  React.useEffect(() => {
    if (toursLoaded && showsLoaded && slotsLoaded && songIdsLoaded) {
      setIsLoading(false);
    }
  }, [toursLoaded, showsLoaded, slotsLoaded, songIdsLoaded]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    if (isDropdownOpen && dropdownListRef.current) {
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

  // Initialize tour from URL or redirect to 2025 Fall
  React.useEffect(() => {
    async function initializeTour() {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('tour, tour_canonid, tour_id, tour_showfields')
          .order('tour_canonid', { ascending: true });

        if (error) throw error;

        setTours(data || []);

        // If no tour in URL, redirect to 2025 Fall
        if (!tour) {
          const winter2025 = data?.find(t => t.tour === '2025 Fall');
          if (winter2025) {
            navigate(`/tours/${winter2025.tour_id}`, { replace: true });
          }
          return;
        }

        // Validate that the tour_id in URL exists
        const tourData = data?.find(t => t.tour_id === tour);
        
        if (tourData) {
          // Valid tour_id - set it
          setCurrentTour(tourData.tour);
          setCurrentTourId(tourData.tour_id);
          setCurrentTourShowFields(tourData.tour_showfields || false);
        } else {
          // Invalid tour_id - redirect to 2025 Fall
          const winter2025 = data?.find(t => t.tour === '2025 Fall');
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

  React.useEffect(() => {
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
        setSongIdsLoaded(true);
      }
    };

    fetchSongIds();
  }, []);

  React.useEffect(() => {
    if (tour !== previousTourId) {
      setIsLoading(true);
      setPreviousTourId(tour || null);
    }
  }, [tour, previousTourId]);

  React.useEffect(() => {
    if (!currentTour) return;

    setIsLoading(true);
    setShowsLoaded(false);
    setSlotsLoaded(false);

    async function fetchAllData() {
      try {
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
            show_rarity,
            show_gap,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            setlist_entries (
              entry_length,
              entry_song,
              entry_short,
              last_count,
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

        const [showsResult, placementsResult, slotsResult] = await Promise.all([
          showsPromise,
          placementsPromise,
          slotsPromise
        ]);

        if (showsResult.error) throw showsResult.error;
        if (placementsResult.error) throw placementsResult.error;
        if (slotsResult.error) throw slotsResult.error;

        const processedShows = showsResult.data?.map(show => {
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

          let show_length = null;
          if (totalSeconds > 0) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            show_length = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }

          // Format rarity with % symbol if it exists
          const show_rarity = show.show_rarity !== null && show.show_rarity !== undefined
            ? `${show.show_rarity.toFixed(2)}%`
            : null;

          // Format gap as string with 2 decimal places if it exists
          const show_gap = show.show_gap !== null && show.show_gap !== undefined
            ? show.show_gap.toFixed(2)
            : null;

          return {
            ...show,
            show_length,
            show_rarity,
            show_gap,
            venue_id: show.subvenues?.venues?.venue_id,
            attended: attendedShowIds.includes(show.show_id)
          };
        });

        const transformedData = slotsResult.data?.map(show => {
          const slots: any = {
            show_id: show.show_id,
            Show_Date: show.show_date
          };

          const placementEntries: { [key: string]: Array<SongEntryWithId> } = {};

          show.setlist_entries?.forEach(entry => {
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

          Object.entries(placementEntries).forEach(([key, entries]) => {
            entries.sort((a, b) => a.setnum - b.setnum);
            slots[key] = entries;
          });

          return slots;
        });

        const columnsWithData = new Set<string>();
        transformedData?.forEach(show => {
          Object.entries(show).forEach(([key, value]) => {
            if (value && key !== 'show_id' && key !== 'Show_Date') {
              columnsWithData.add(key);
            }
          });
        });

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

        const hasAnySetlistEntries = processedShows?.some(show =>
          show.setlist_entries && show.setlist_entries.length > 0
        );
        setHasTourSetlistEntries(hasAnySetlistEntries || false);
        setShows(processedShows || []);
        setHasSlotEntries(hasEntries);
        setSlots(transformedData || []);
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

  React.useEffect(() => {
    async function fetchPlacementData() {
      if (!currentTour || showsLoaded === false) return;

      try {
        const showIds = shows.map(show => show.show_id);

        if (showIds.length === 0) return;

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

        const songCategoryMap: Record<string, number> = {};
        const songArtworkMap: Record<string, string> = {};

        songsData?.forEach(song => {
          songCategoryMap[song.song] = song.categories?.category_canonid || 999;
          if (song.categories?.category_artwork) {
            songArtworkMap[song.song] = song.categories.category_artwork;
          }
        });

        const processedTopSlots = processTourDataWithCategories(entriesData || [], songCategoryMap, songArtworkMap);
        setTopSlots(processedTopSlots);
      } catch (error) {
        console.error('Error fetching placement data:', error);
      }
    }

    const processTourDataWithCategories = (
      entries: Array<{ entry_placement: string; entry_song: string; entry_show?: string }>,
      songCategoryMap: Record<string, number>,
      songArtworkMap: Record<string, string>
    ) => {
      const showOpeners: Record<string, number> = {};
      const setOpeners: Record<string, number> = {};
      const setClosers: Record<string, number> = {};
      const encores: Record<string, number> = {};

      const uniqueCombinations = new Set<string>();

      entries.forEach(entry => {
        const placement = entry.entry_placement || '';
        const show = entry.entry_show || '';
        const song = entry.entry_song;

        const uniqueKey = `${show}|${placement}|${song}`;

        if (!uniqueCombinations.has(uniqueKey)) {
          uniqueCombinations.add(uniqueKey);

          if (placement === "Set 1 Opener") {
            showOpeners[song] = (showOpeners[song] || 0) + 1;
          }

          if (placement.includes("Opener")) {
            setOpeners[song] = (setOpeners[song] || 0) + 1;
          }

          if (placement.includes("Closer")) {
            setClosers[song] = (setClosers[song] || 0) + 1;
          }

          if (placement.includes("Encore")) {
            encores[song] = (encores[song] || 0) + 1;
          }
        }
      });

      const hasShowOpeners = Object.keys(showOpeners).length > 0;
      const hasSetOpeners = Object.keys(setOpeners).length > 0;
      const hasSetClosers = Object.keys(setClosers).length > 0;
      const hasEncores = Object.keys(encores).length > 0;

      if (!hasShowOpeners && !hasSetOpeners && !hasSetClosers && !hasEncores) {
        return [];
      }

      const formatSlotData = (data: Record<string, number>, title: string): SlotData => {
        const sortedData = Object.entries(data)
          .map(([song, count]) => ({
            song,
            count,
            categoryCanonId: songCategoryMap[song] || 999,
            artwork: songArtworkMap[song] || undefined
          }))
          .sort((a, b) => {
            if (a.count !== b.count) {
              return b.count - a.count;
            }

            if (a.categoryCanonId !== b.categoryCanonId) {
              return a.categoryCanonId - b.categoryCanonId;
            }

            return a.song.localeCompare(b.song);
          })
          .slice(0, 8)
          .map(({ song, count, artwork }) => ({ left: song, right: count, artwork }));

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
              className={`text-fifth text-[0.875rem] leading-[0.75rem] font-trad transition-colors text-fifth table-link cursor-pointer inline ${
                index < songs.length - 1 ? 'mr-1' : ''
              }`}
            >
              {cleanSongName(song.song)}
            </a>
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between mb-6 items-center">
          <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Tours</h1>
          <div className="relative" ref={dropdownRef}>
            <div className="hidden md:block">
              <button
                className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
              >
                {currentTour || 'Select Tour'}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
        <div className="flex justify-between mb-6 items-center">
          <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Tours</h1>
          <div className="relative" ref={dropdownRef}>
            <div className="hidden md:block">
              <button
                className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
              >
                Select Tour
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">No tours found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Tours</h1>
        <div className="relative" ref={dropdownRef}>
          <div className="md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-lg bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
            >
              <Search className="w-6 h-6" />
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Select Tour"
            >
              <div className="space-y-0">
                <div className="divide-y divide-white/10">
                  {tours.map((tour) => (
                    <button
                      key={tour.tour}
                      onClick={() => {
                        setCurrentTourId(tour.tour_id);
                        setCurrentTour(tour.tour);
                        navigate(`/tours/${tour.tour_id}`);
                        setIsModalOpen(false);
                      }}
                      className="w-full text-left px-4 py-1 text-sm font-semibold hover:bg-secondary transition-colors"
                    >
                      <span className="text-fifth">{tour.tour}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
            >
              {currentTour}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
            <div
              ref={dropdownListRef}
              className={`absolute py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto ${
                window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-80 max-h-96'
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
                  className={`w-full text-left px-4 py-1 text-sm font-medium hover:bg-secondary transition-colors ${
                    currentTour === tour.tour ? 'bg-tertiary' : ''
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
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">No shows found for {currentTour}</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
                {currentTour}
              </h2>
              <span className="text-fifth font-semibold text-lg whitespace-nowrap pl-4">{shows.length} {shows.length === 1 ? 'Show' : 'Shows'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    {[
                      { key: 'show_date', label: 'Date' },
                      ...(user ? [{ key: 'attended', label: <Check size={16} className="text-fifth" strokeWidth={4} /> }] : []),
                      { key: 'show_group', label: 'Group' },
                      { key: 'show_length', label: 'Length' },
                      { key: 'show_rarity', label: 'Rarity' },
                      { key: 'show_gap', label: 'Gap' },
                      { key: 'show_subvenue', label: 'Venue' },
                      { key: 'show_venue_location', label: 'Location' },
                      { key: 'rating', label: 'Rating' },
                      { 
                        key: 'setlist', 
                        label: (
                          <div className="flex justify-center items-center">
                            <div className="text-primary bg-[#006400] rounded p-1">
                              <FileMusic size={16} strokeWidth={2} />
                            </div>
                          </div>
                        )
                      },
                      { 
                        key: 'releases', 
                        label: (
                          <div className="flex justify-center items-center">
                            <div className="text-primary bg-[#7c2128] rounded p-1">
                              <AudioLines size={16} strokeWidth={2} />
                            </div>
                          </div>
                        )
                      },
                      { key: 'attendees', label: <Users size={16} className="text-fifth" strokeWidth={2} /> },
                      { key: 'wl_link', label: <img src={wlImage} alt="WysteriaLane" className="w-4 h-4" /> },
                      { key: 'show_detail', label: 'Detail' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => key !== 'attended' && key !== 'setlist' && key !== 'releases' && key !== 'wl_link' ? handleSort(key) : null}
                        className={`${key === 'show_length' || key === 'show_rarity' || key === 'show_date' || key === 'rating' || key === 'attendees' ? 'text-center' : 'text-left'}
                          text-s font-semibold text-fifth whitespace-nowrap 
                          ${key !== 'attended' && key !== 'setlist' && key !== 'releases' && key !== 'wl_link' ? 'px-2 py-1 cursor-pointer hover:bg-black/10' : key === 'setlist' || key === 'releases' ? 'w-8 px-1 py-0.5 text-center' : 'w-8 px-1 py-1 text-center'}`}
                      >
                        <div className={`flex items-center ${key === 'show_length' || key === 'attended' || key === 'show_rarity' || key === 'show_gap' || key === 'show_date' || key === 'rating' || key === 'setlist' || key === 'users' || key === 'releases' || key === 'wl_link' ? 'justify-center' : ''} gap-1`}>
                          {label}
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
                        } hover:bg-tertiary/40 transition-colors text-xs`}
                    >
                      <td className="px-2 py-0.5 text-center whitespace-nowrap">
                        <span className="font-medium text-fifth">
                          <button
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                            className="transition-colors table-link"
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
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_group}</td>
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                        {show.show_length || ''}
                      </td>
                      <td className="px-2 py-0 whitespace-nowrap text-center">
                        {show.show_rarity ? (
                          <span
                            className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                            style={{
                              backgroundColor: getRarityColor(show.show_rarity)
                            }}
                          >
                            {show.show_rarity}
                          </span>
                        ) : (
                          <span className="text-fifth"></span>
                        )}
                      </td>
                      <td className="px-2 py-0 whitespace-nowrap text-center">
                        {show.show_gap ? (
                          <span
                            className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                            style={{
                              backgroundColor: getGapColor(show.show_gap)
                            }}
                          >
                            {show.show_gap}
                          </span>
                        ) : (
                          <span className="text-fifth"></span>
                        )}
                      </td>
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                        <button
                          onClick={() => navigateToVenue(show)}
                          className="hover:underline transition-colors"
                        >
                          {show.show_subvenue}
                        </button>
                      </td>
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                        {show.show_venue_location}
                      </td>
                      <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                        <div className="relative flex items-center justify-center group">
                          <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-30' : ''}`}>
                            {[1, 2, 3, 4, 5].map((starNumber) => {
                              const rating = showRatings[show.show_id] || 0;
                              const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

                              return (
                                <div key={starNumber} className="relative">
                                  <Star
                                    size={16}
                                    className="text-secondary"
                                    fill="none"
                                    stroke="currentColor"
                                  />
                                  <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: `${fillPercentage * 100}%` }}
                                  >
                                    <Star
                                      size={16}
                                      className="text-tertiary"
                                      fill="currentColor"
                                      stroke="currentColor"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {showRatings[show.show_id] > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-fifth pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              {showRatings[show.show_id].toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="w-8 text-center align-middle">
                        {showsWithSetlists.has(show.show_id) && (
                          <div className="flex justify-center items-center h-full">
                            <button
                              onClick={() => {
                                navigate(`/setlist/${show.show_id}`, { state: { openChangesModal: true } });
                              }}
                              className="text-[#006400] hover:text-primary hover:bg-[#006400] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                            >
                              <FileMusic size={14.5} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="w-8 text-center align-middle">
                        {showsWithReleases.has(show.show_id) && (
                          <div className="flex justify-center items-center h-full">
                            <button
                              onClick={() => navigate(`/setlist/${show.show_id}`)}
                              className="text-[#7c2128] hover:text-primary hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                            >
                              <AudioLines size={14.5} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="w-8 text-center text-fifth">
                        <span className="text-xs font-medium">
                          {attendeeCounts[show.show_id] || 0}
                        </span>
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
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                        {show.show_detail && show.show_detail}
                        {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
                        {show.show_alert && <span className="text-[#CE1126] font-medium">[{show.show_alert}]</span>}
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
        <div className="mt-4">
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-secondary mb-2">
              Slots
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    <th
                      className="w-[85px] min-w-[85px] pr-2 py-1 text-center text-s font-semibold text-fifth">
                      Date
                    </th>
                    {activeColumns.map(column => (
                      <th
                        key={column}
                        className="px-2 py-1 text-left text-s font-semibold text-primary"
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
                        } hover:bg-tertiary/40 transition-colors text-xs`}
                    >
                      <td className="w-[85px] min-w-[85px] pr-2 py-1 text-center whitespace-nowrap">
                        <span className="font-medium text-fifth">
                          <button
                            onClick={() => navigate(`/setlist/${slot.show_id}`)}
                            className="transition-colors table-link"
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
                          className="px-2 py-0.5 text-left align-middle"
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
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <TourSongSpread shows={shows} />
            
            {currentTourShowFields && (
              <NotPlayedInTour
                tourId={currentTourId}
                tourName={currentTour}
                showIds={shows.map(show => show.show_id)}
                songIdMap={songIdMap}
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            {topSlots.length > 0 && (
              <TopSlotsCarousel
                slots={topSlots}
                isMobile={windowWidth < 1280}
                songIdMap={songIdMap}
                onSongClick={(songId) => navigate(`/song/${songId}`)}
                tourId={currentTourId}
              />
            )}

            <LongestSongs
              showIds={shows.map(show => show.show_id)}
              songIdMap={songIdMap}
              tourId={currentTourId}
            />
          </div>
        </div>
      )}

      {shows.length > 0 && hasTourSetlistEntries && (
        <div className="mt-4">
          <TourSongsCombined
            shows={shows}
            songIdMap={songIdMap}
            onSongCountChange={setUniqueSongCount}
            uniqueSongCount={uniqueSongCount}
            tourId={currentTourId}
          />
        </div>
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