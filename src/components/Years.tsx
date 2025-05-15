import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search, ArrowUp, ArrowDown, Check, Filter } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';

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

  const tourColors = [
    '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', 
    '#9B59B6', '#FF6B81', '#F1C40F', '#FFFFFF',
    '#34495E'
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
      // Primary sort by show_date
      const dateA = new Date(a.show_date).getTime();
      const dateB = new Date(b.show_date).getTime();
      if (dateA !== dateB) {
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Secondary sort by show_canonid (handle nulls appropriately)
      const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
      const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
      if (canonIdA !== canonIdB) {
        return sortDirection === 'asc' ? canonIdA - canonIdB : canonIdB - canonIdA;
      }
      
      // Tertiary sort by show_group
      const groupA = a.show_group || '';
      const groupB = b.show_group || '';
      const groupComparison = groupA.localeCompare(groupB);
      return sortDirection === 'asc' ? groupComparison : -groupComparison;
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
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1 pb-0.5 rounded-full border border-black">Years</h1>
        <div className="relative" ref={dropdownRef}>
          <div className="md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-lg bg-[#fce7ca] text-primary hover:bg-[#fce7ca]/90 transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Select Year"
            >
              <div className="space-y-0">
                <div className="grid grid-cols-3">
                  {years.map((year) => (
                    <button
                      key={year.year}
                      onClick={() => {
                        setCurrentYearId(year.year_id);
                        setCurrentYear(year.year);
                        navigate(`/years/${year.year_id}`);
                        setIsModalOpen(false);
                      }}
                      className="w-full text-center px-4 py-3 text-sm rounded-lg hover:bg-white/10 transition-colors font-semibold border border-white/10"
                    >
                      <span className="text-[#fce7ca]">{year.year}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-1.5 rounded-lg border border-black hover:bg-surface-secondary transition-colors text-sm font-semibold"
            >
              {currentYear}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
          <div 
            ref={dropdownListRef}
            className={`absolute py-1 bg-[#fce7ca] border border-black rounded-lg shadow-lg z-50 overflow-y-auto ${
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
                  className={`w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors ${
                    currentYear === year.year ? 'bg-surface-secondary' : ''
                  }`}
                >
                  {year.year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 mb-8">
        <div className="col-span-1 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-black mt-4">Loading shows...</p>
            </div>
          ) : filteredShows.length === 0 ? (
            <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
              <p className="text-black">
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
            <div className="bg-primary border border-black rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">
                  {currentYear} Shows
                </h2>
                {selectedGroups.length > 0 && (
                  <button
                    onClick={clearGroupFilters}
                    className="flex items-center gap-2 bg-[#fce7ca] text-primary px-2 py-1 rounded-lg border border-border-primary hover:bg-[#fce7ca]/90 transition-colors text-xs font-semibold"
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
                        className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                        onClick={() => handleSort('show_date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {getSortIcon('show_date')}
                        </div>
                      </th>
                      {user && (
                        <th className="w-8 px-1 py-1 text-center text-s font-semibold text-black">
                          <Check size={16} className="text-black" strokeWidth={4} />
                        </th>
                      )}
                      <th 
                        className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                        onClick={() => handleSort('show_group')}
                      >
                        <div className="flex items-center gap-1">
                          Group
                          {getSortIcon('show_group')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                        onClick={() => handleSort('show_subvenue')}
                      >
                        <div className="flex items-center gap-1">
                          Venue
                          {getSortIcon('show_subvenue')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                        onClick={() => handleSort('show_venue_location')}
                      >
                        <div className="flex items-center gap-1">
                          Location
                          {getSortIcon('show_venue_location')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                        onClick={() => handleSort('show_detail')}
                      >
                        <div className="flex items-center gap-1">
                          Detail
                          {getSortIcon('show_detail')}
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
                        } hover:bg-black/10 transition-colors text-xs`}
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
                              className="fixed bg-secondary text-black px-3 py-1 rounded border border-black shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}
                            >
                              <div className="font-semibold">{show.show_tour}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-0.5 text-black whitespace-nowrap">
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
                                <div className="rounded-full p-1 bg-green-600">
                                  <Check size={12} className="text-white" strokeWidth={4} />
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-0.5 text-black whitespace-nowrap">{show.show_group}</td>
                        <td className="px-4 py-0.5 text-black whitespace-nowrap">
                          <button
                            onClick={() => navigateToVenue(show)}
                            className="hover:text-[#a9682e] hover:underline transition-colors"
                          >
                            {show.show_subvenue}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-black whitespace-nowrap">{show.show_venue_location}</td>
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
          )}
        </div>
        
        <div className="col-span-1 lg:order-last">
          {/* Tours Container */}
          <div className="bg-primary border border-black rounded-lg p-3 w-full mb-4">
            <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-2">
              {currentYear} Tours
            </h2>
            <div className="space-y-1.5">
              {loading ? (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                  </div>
                </div>
              ) : tours.length === 0 ? (
                <p className="text-black text-xs text-center py-2">No tours found</p>
              ) : (
                tours.map((tour) => (
                  <div key={tour.tour_count} className="text-black text-xs flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded flex-shrink-0 border border-black"
                      style={{ backgroundColor: tour.color }}
                    />
                    <div>
                      <button 
                        onClick={() => navigate(`/tours/${tour.tour_id}`)}
                        className="hover:text-[#a9682e] transition-colors font-semibold"
                      >
                        {tour.tour_count.split(' (')[0]}
                      </button>
                      {' (' + tour.tour_count.split(' (')[1]}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Group Filter Container */}
          <div className="bg-primary border border-black rounded-lg p-3 w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">
                Filter by Group
              </h2>
              {selectedGroups.length > 0 && (
                <button
                  onClick={clearGroupFilters}
                  className="flex items-center gap-2 bg-[#fce7ca] text-primary px-2 py-1 rounded-lg border border-border-primary hover:bg-[#fce7ca]/90 transition-colors text-xs font-semibold"
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
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                    <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                  </div>
                </div>
              ) : groups.length === 0 ? (
                <p className="text-black text-xs text-center py-2">No groups found</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((groupData) => (
                    <button
                      key={groupData.group}
                      onClick={() => toggleGroupSelection(groupData.group)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        selectedGroups.includes(groupData.group)
                          ? 'bg-[#f9ae37] text-black border border-black'
                          : 'bg-canvas text-black hover:text-[#a9682e] border border-black'
                      }`}
                    >
                      {groupData.group} ({groupData.count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}