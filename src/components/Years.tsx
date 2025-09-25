import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search, ArrowUp, ArrowDown, Check, Filter, FileMusic, Users, Star, AudioLines } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import wlImage from '../img/WL.png';

interface Year {
  year: string;
  year_id: string;
}

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
  venue_location: string | null;
  show_venue_location: string;
  show_subvenue_venue: string; // Added for venue navigation
  venue_id?: string; // Added for venue ID
  attended?: boolean; // Added to track if user attended
  show_wl_link?: string | null;
}

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

interface GroupCount {
  group: string;
  count: number;
}

export function Years() {
  const { year } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = React.useState<string>('2025');
  const [currentYearId, setCurrentYearId] = React.useState<string>('');
  const [years, setYears] = React.useState<Year[]>([]);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [filteredShows, setFilteredShows] = React.useState<Show[]>([]);
  const [tours, setTours] = React.useState<TourCount[]>([]);
  const [groups, setGroups] = React.useState<GroupCount[]>([]);
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const dropdownListRef = React.useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredTour, setHoveredTour] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [previousYearId, setPreviousYearId] = useState<string | null>(null);
  const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});
  const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());

  const tourColors = [
    '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', 
    '#9B59B6', '#FF6B81', '#F1C40F', '#34495E',
    '#FFFFFF', '#000000'
  ];

  interface ShowResponse {
    show_iscanon: boolean;
    show_tour: string;
    show_id: string;
    show_date: string;
    show_group: string;
    show_subvenue: string;
    show_detail: string | null;
    show_alert: string | null;
    show_canonid: number | null;
    show_subvenue_venue: string;
    show_venue_location: string;
    show_wl_link?: string | null;
    subvenues?: {
      venues?: {
        venue_id: string;
      };
    };
  }

  const getTourColor = (tourName: string): string => {
    const tour = tours.find(t => t.tour === tourName);
    return tour ? tour.color : 'transparent';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rating' ? 'desc' : 'asc'); // Default desc for ratings
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
      let valueA: any;
      let valueB: any;

      switch (sortColumn) {
        case 'show_date':
          valueA = new Date(a.show_date).getTime();
          valueB = new Date(b.show_date).getTime();
          break;
        case 'rating':
          valueA = showRatings[a.show_id] || 0;
          valueB = showRatings[b.show_id] || 0;
          break;
        case 'show_group':
          valueA = a.show_group || '';
          valueB = b.show_group || '';
          break;
        case 'show_subvenue':
          valueA = a.show_subvenue || '';
          valueB = b.show_subvenue || '';
          break;
        case 'show_venue_location':
          valueA = a.show_venue_location || '';
          valueB = b.show_venue_location || '';
          break;
        case 'show_detail':
          valueA = a.show_detail || '';
          valueB = b.show_detail || '';
          break;
        case 'attendee_count':
          valueA = attendeeCounts[a.show_id] || 0;
          valueB = attendeeCounts[b.show_id] || 0;
          break;
        default:
          // Default to date sorting
          valueA = new Date(a.show_date).getTime();
          valueB = new Date(b.show_date).getTime();
      }

      // Handle string comparisons
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        if (comparison !== 0) {
          return sortDirection === 'asc' ? comparison : -comparison;
        }
      } else {
        // Handle numeric comparisons
        if (valueA !== valueB) {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
      }

      // Secondary sort by show_date if primary sort values are equal
      if (sortColumn !== 'show_date') {
        const dateA = new Date(a.show_date).getTime();
        const dateB = new Date(b.show_date).getTime();
        if (dateA !== dateB) {
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      // Tertiary sort by show_canonid
      const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
      const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
      if (canonIdA !== canonIdB) {
        return sortDirection === 'asc' ? canonIdA - canonIdB : canonIdB - canonIdA;
      }

      // Final sort by show_group
      const groupA = a.show_group || '';
      const groupB = b.show_group || '';
      return groupA.localeCompare(groupB);
    });
  };

  // Helper function to navigate to venue pages
  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.show_subvenue_venue) {
      // If we don't have venue_id but have the venue name, use that
      navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`);
    }
  };

  // Toggle group selection for filtering
  const toggleGroupSelection = (group: string) => {
    setSelectedGroups(prevSelected => {
      if (prevSelected.includes(group)) {
        return prevSelected.filter(g => g !== group);
      } else {
        return [...prevSelected, group];
      }
    });
  };

  // Clear all group filters
  const clearGroupFilters = () => {
    setSelectedGroups([]);
  };

  // Fetch attendee counts for all shows
  useEffect(() => {
    const fetchAttendeeCounts = async () => {
      if (filteredShows.length === 0) return;
      
      try {
        const showIds = filteredShows.map(s => s.show_id);
        
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
        filteredShows.forEach(show => {
          counts[show.show_id] = 0;
        });
        
        allData.forEach(record => {
          counts[record.show_id] = (counts[record.show_id] || 0) + 1;
        });
        
        // Log detailed breakdown
        filteredShows.forEach(show => {
          const count = counts[show.show_id];
        });
        
        // Log summary statistics
        const showsWithAttendees = Object.values(counts).filter(count => count > 0).length;
        const totalAttendees = Object.values(counts).reduce((sum, count) => sum + count, 0);
        const avgAttendeesPerShow = showsWithAttendees > 0 ? (totalAttendees / showsWithAttendees).toFixed(1) : 0;
        
        setAttendeeCounts(counts);
      } catch (error) {
        console.error('❌ Error fetching attendee counts:', error);
      }
    };
    
    fetchAttendeeCounts();
  }, [filteredShows, currentYear, selectedGroups, shows.length]);

  // Fetch shows with setlists
  useEffect(() => {
    async function fetchShowsWithSetlists() {
      if (!currentYear) return;
      
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
  }, [shows, currentYear]);

  // Fetch shows with releases (with pagination)
  useEffect(() => {
    async function fetchShowsWithReleases() {
      if (!currentYear || shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        // First get the total count
        const { count, error: countError } = await supabase
          .from('releases_shows')
          .select('*', { count: 'exact', head: true })
          .in('show_id', showIds);
        
        if (countError) throw countError;
        
        // Fetch in batches of 1000
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
  }, [shows, currentYear]);

  // Apply group filtering to shows
  useEffect(() => {
    if (selectedGroups.length === 0) {
      setFilteredShows(shows);
    } else {
      setFilteredShows(shows.filter(show => selectedGroups.includes(show.show_group)));
    }
  }, [shows, selectedGroups]);

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

  useEffect(() => {
    if (!year) {
      navigate('/years/2025', { replace: true });
    }
  }, [year, navigate]);

  useEffect(() => {
    const fetchShowRatings = async () => {
      if (filteredShows.length === 0) return;
      
      try {
        const showIds = filteredShows.map(s => s.show_id);
        
        const { data, error } = await supabase
          .from('show_ratings')
          .select('show_id, rating')
          .in('show_id', showIds);
        
        if (error) throw error;
        
        // Calculate averages for each show
        const ratings: Record<string, number> = {};
        filteredShows.forEach(show => {
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
  }, [filteredShows]);
  
  // Effect to handle dropdown opening/closing and scrolling to current year
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Scroll to the current year when dropdown opens
    if (isDropdownOpen && dropdownListRef.current) {
      // Find the button for the current year
      const currentYearButton = dropdownListRef.current.querySelector(`button[key="${currentYear}"]`);
      if (currentYearButton) {
        // Scroll the current year button into view
        currentYearButton.scrollIntoView({ block: 'center' });
      } else {
        // Alternative approach: find all buttons and look for one with the current year text
        const buttons = dropdownListRef.current.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.trim() === currentYear) {
            button.scrollIntoView({ block: 'center' });
            break;
          }
        }
      }
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, currentYear]);
  
  React.useEffect(() => {
    async function fetchYears() {
      try {
        const { data, error } = await supabase
          .from('years')
          .select('year, year_id')
          .order('year', { ascending: true });

        if (error) {
          throw error;
        }

        // Find the 2025 year_id for initial navigation
        const year2025 = data?.find(y => y.year === '2025');
        if (year2025 && !year) {
          navigate(`/years/${year2025.year_id}`, { replace: true });
          setCurrentYearId(year2025.year_id);
          setCurrentYear('2025');
        }

        setYears(data || []);
      } catch (error) {
        console.error('Error fetching years:', error);
      }
    }

    fetchYears();
  }, [year, navigate]);

  // Effect to handle URL year_id changes
  React.useEffect(() => {
    // If the year parameter changes, set loading to true
    if (year !== previousYearId) {
      setLoading(true);
      setPreviousYearId(year || null);
      // Reset group filters when changing years
      setSelectedGroups([]);
    }

    if (year && years.length > 0) {
      const yearData = years.find(y => y.year_id === year);
      if (yearData) {
        setCurrentYear(yearData.year);
        setCurrentYearId(yearData.year_id);
      }
    }
  }, [year, years, previousYearId]);

  React.useEffect(() => {
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_tour,
            tours(tour,tour_canonid,tour_id)
          `)
          .eq('show_year', currentYear);
  
        if (error) {
          throw error;
        }
  
        const tourCounts = {};
        data.forEach(item => {
          if (tourCounts[item.show_tour]) {
            tourCounts[item.show_tour].count++;
          } else {
            tourCounts[item.show_tour] = {
              count: 1,
              tour_canonid: item.tours?.tour_canonid,
              tour_id: item.tours?.tour_id,
              tour: item.show_tour
            };
          }
        });
  
        // Create transformed tours array (without colors initially)
        const transformedTours = Object.entries(tourCounts).map(([tourName, { count, tour_canonid, tour_id, tour }]) => ({
          tour_count: `${tourName} (${count})`,
          tour_canonid: tour_canonid || 0,
          tour_id: tour_id || '',
          tour: tourName
        }));
  
        // Sort by tour_canonid first
        const sortedTours = transformedTours.sort((a, b) => a.tour_canonid - b.tour_canonid);
        
        // Then assign colors based on the sorted order
        const toursWithColors = sortedTours.map((tour, index) => ({
          ...tour,
          color: tourColors[index % tourColors.length]
        }));
  
        setTours(toursWithColors);
      } catch (error) {
        console.error('Error fetching tours:', error);
      }
    }
  
    fetchTours();
  }, [currentYear]);

  // Effect to extract unique groups and their counts
  React.useEffect(() => {
    const groupCounts: Record<string, number> = {};
    
    shows.forEach(show => {
      const group = show.show_group;
      if (group) {
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      }
    });
    
    const groupsArray: GroupCount[] = Object.entries(groupCounts)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => a.group.localeCompare(b.group));
    
    setGroups(groupsArray);
  }, [shows]);

  React.useEffect(() => {
    async function fetchShows() {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select<any, ShowResponse>(`
            show_iscanon,
            show_tour,
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_canonid,
            show_subvenue_venue,
            show_venue_location,
            show_wl_link,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .eq('show_year', currentYear)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        if (error) {
          throw error;
        }

        // Process venue IDs and mark attended shows
        const processedData = data?.map(show => ({
          ...show,
          venue_id: show.subvenues?.venues?.venue_id,
          attended: attendedShowIds.includes(show.show_id)
        }));

        setShows(processedData || []);
        setFilteredShows(processedData || []);
      } catch (error) {
        console.error('Error fetching shows:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShows();
  }, [currentYear, attendedShowIds]);

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Years</h1>
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
              title="Select Year"
            >
              <div className="space-y-0">
                <div className="grid grid-cols-3 gap-2">
                  {years.map((year) => (
                    <button
                      key={year.year}
                      onClick={() => {
                        setCurrentYearId(year.year_id);
                        setCurrentYear(year.year);
                        navigate(`/years/${year.year_id}`);
                        setIsModalOpen(false);
                      }}
                      className="w-full text-center px-3 py-1 text-lg rounded-lg hover:bg-primary bg-tertiary transition-colors font-semibold border border-secondary"
                    >
                      <span className="text-fifth">{year.year}</span>
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
              {currentYear}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
          <div 
            ref={dropdownListRef}
            className={`absolute py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto ${
              window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-24 max-h-96'
            }`}
          >
              {years.map((year) => (
                <button
                  key={year.year}
                  onClick={() => {
                    setCurrentYearId(year.year_id);
                    setCurrentYear(year.year);
                    navigate(`/years/${year.year_id}`);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-1 text-sm font-medium hover:bg-secondary transition-colors ${
                    currentYear === year.year ? 'bg-tertiary' : ''
                  }`}
                >
                  {year.year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shows Table - Full Width */}
      <div className="mb-8 overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-fifth mt-4">Loading shows...</p>
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
            <p className="text-fifth">
              {shows.length === 0 
                ? `No shows found for ${currentYear}` 
                : `No shows match the selected filters. ${" "}
                  <button 
                    className="text-[#a9682e] underline hover:text-[#7b4e23]"
                    onClick={clearGroupFilters}
                  >
                    Clear filters
                  </button>`
              }
            </p>
          </div>
        ) : (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
                {currentYear} Shows
              </h2>
              {selectedGroups.length > 0 && (
                <button
                  onClick={clearGroupFilters}
                  className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-lg border border-secondary hover:bg-red-600 transition-colors text-xs font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    <th className="w-1 px-0 py-1"></th>
                    <th 
                      className="px-3 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('show_date')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Date
                      </div>
                    </th>
                    {user && (
                      <th className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth">
                        <Check size={16} className="text-fifth" strokeWidth={4} />
                      </th>
                    )}
                    <th 
                      className="px-2 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('show_group')}
                    >
                      <div className="flex items-center gap-1">
                        Group
                      </div>
                    </th>
                    <th 
                      className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('show_subvenue')}
                    >
                      <div className="flex items-center gap-1">
                        Venue
                      </div>
                    </th>
                    <th 
                      className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('show_venue_location')}
                    >
                      <div className="flex items-center gap-1">
                        Location
                      </div>
                    </th>
                    <th 
                      className="px-2 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('rating')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Rating
                      </div>
                    </th>
                    <th className="w-8 px-1 py-0.5 text-center align-middle text-s font-semibold text-fifth">
                      <div className="flex justify-center items-center">
                        <div className="text-primary bg-[#006400] rounded p-1">
                          <FileMusic size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </th>
                    <th className="w-8 px-1 py-0.5 text-center align-middle text-s font-semibold text-fifth">
                      <div className="flex justify-center items-center">
                        <div className="text-primary bg-[#7c2128] rounded p-1">
                          <AudioLines size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </th>
                    <th 
                      className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('attendee_count')}
                    >
                      <div className="flex justify-center items-center">
                        <Users size={16} className="text-fifth" strokeWidth={2} />
                      </div>
                    </th>
                    <th className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth">
                      <div className="flex justify-center items-center">
                        <img src={wlImage} alt="WysteriaLane" className="w-4 h-4" />
                      </div>
                    </th>
                    <th 
                      className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('show_detail')}
                    >
                      <div className="flex items-center gap-1">
                        Detail
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortData(filteredShows).map((show, index) => (
                    <tr
                      key={show.show_id}
                      className={`${
                        index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                      } hover:bg-tertiary/40 transition-colors text-xs`}
                    >
                      <td 
                        style={{ 
                          width: '5px',
                          padding: 0,
                          backgroundColor: getTourColor(show.show_tour)
                        }}
                        onMouseEnter={(e) => {
                          setHoveredTour(show.show_tour);
                          setMousePosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                          setMousePosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredTour(null)}
                      >
                        {hoveredTour === show.show_tour && (
                          <div 
                            className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary min-w-max z-[9999]"
                            style={{
                              left: `${mousePosition.x + 10}px`,
                              top: `${mousePosition.y - 10}px`
                            }}
                          >
                            <div className="font-medium">{show.show_tour}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-0.5 text-fifth whitespace-nowrap">
                        <span className="font-medium">
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
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                        <button
                          onClick={() => navigateToVenue(show)}
                          className="hover:underline transition-colors"
                        >
                          {show.show_subvenue}
                        </button>
                      </td>
                      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_venue_location}</td>
                      <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                        <div className="relative flex items-center group">
                          {/* Stars with hover-based transparency */}
                          <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-30' : ''}`}>
                            {[1, 2, 3, 4, 5].map((starNumber) => {
                              const rating = showRatings[show.show_id] || 0;
                              const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

                              return (
                                <div key={starNumber} className="relative">
                                  {/* Background star (empty) */}
                                  <Star
                                    size={16}
                                    className="text-secondary"
                                    fill="none"
                                    stroke="currentColor"
                                  />
                                  {/* Foreground star (filled) */}
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
                          {/* Rating text overlaid on stars - only visible on hover */}
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
                                // Navigate with a state parameter to open the modal
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
                        {attendeeCounts[show.show_id] > 0 && (
                          <span className="text-xs font-medium">{attendeeCounts[show.show_id]}</span>
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
        )}
      </div>

      {/* Two Column Layout for Tours and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[35%_calc(65%-1rem)] gap-4">
        {/* Tours Container */}
        <div className="bg-primary border border-secondary rounded-lg p-3 w-full">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
            {currentYear} Tours
          </h2>
          <div className="space-y-1.5">
            {loading ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
              </div>
            ) : tours.length === 0 ? (
              <p className="text-fifth text-xs text-center py-2">No tours found</p>
            ) : (
              tours.map((tour) => (
                <div key={tour.tour_count} className="text-fifth text-xs flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded flex-shrink-0 border border-secondary"
                    style={{ backgroundColor: tour.color }}
                  />
                  <div className="flex-1 text-left leading-tight">
                    <a 
                      href={`/tours/${tour.tour_id}`}
                      className="hover:underline transition-colors font-semibold text-left"
                    >
                      {tour.tour_count.split(' (')[0]}
                    </a>
                    {' (' + tour.tour_count.split(' (')[1]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Group Filter Container */}
        <div className="bg-primary border border-secondary rounded-lg p-3 w-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
              Filter by Group
            </h2>
            {selectedGroups.length > 0 && (
              <button
                onClick={clearGroupFilters}
                className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-lg border border-secondary hover:bg-red-600 transition-colors text-xs font-semibold"
              >
                <span>Clear</span>
                <Filter className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {loading ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
              </div>
            ) : groups.length === 0 ? (
              <p className="text-fifth text-xs text-center py-2">No groups found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groups.map((groupData) => (
                  <button
                    key={groupData.group}
                    onClick={() => toggleGroupSelection(groupData.group)}
                    className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                      selectedGroups.includes(groupData.group)
                        ? 'bg-tertiary text-fifth hover:underline border border-secondary'
                        : 'bg-canvas text-fifth hover:underline border border-secondary'
                    }`}
                  >
                    {groupData.group} <span className="font-light">({groupData.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}