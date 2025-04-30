import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, ChevronLeft, Search, X, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue: string;
  show_alert: string | null;
  show_detail: string | null;
  show_year: string;
  attended: boolean;
}

interface AttendShowManagerProps {
  onClose: () => void;
}

const AttendShowManager: React.FC<AttendShowManagerProps> = ({ onClose }) => {
  const { user, addAttendedShow, removeAttendedShow, checkShowAttendance } = useAuth();
  const navigate = useNavigate();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [years, setYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('show_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Function to get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-white/90" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-white/90" />;
  };

  // Function to fetch all available years
  const fetchYears = async () => {
    try {
      const { data, error } = await supabase
        .from('years')
        .select('year')
        .order('year', { ascending: false });

      if (error) throw error;
      if (data) {
        const yearList = data.map(y => y.year);
        setYears(yearList);
        // Set default year to the latest year
        if (yearList.length > 0 && !yearFilter) {
          setYearFilter(yearList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  // Function to fetch attended shows for the user
  const fetchAttendedShowIds = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_attended_shows')
        .select('show_id')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return data.map(item => item.show_id);
    } catch (error) {
      console.error('Error fetching attended shows:', error);
      return [];
    }
  };

  // Function to fetch shows with attendance status
  const fetchShows = useCallback(async () => {
    if (!user || !yearFilter) return;
    
    setLoading(true);
    try {
      // First get all attended show IDs
      const attendedShowIds = await fetchAttendedShowIds();
      
      // Then fetch shows for the selected year
      const { data, error } = await supabase
        .from('shows')
        .select(`
          show_id,
          show_date,
          show_group,
          show_subvenue,
          show_venue_location,
          show_subvenue_venue,
          show_alert,
          show_detail,
          show_year
        `)
        .eq('show_year', yearFilter)
        .order('show_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Map the shows and mark those that are attended
        const showsWithAttendance = data.map(show => ({
          ...show,
          attended: attendedShowIds.includes(show.show_id)
        }));
        
        setShows(showsWithAttendance);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  }, [user, yearFilter]);

  // Fetch years and shows on component mount
  useEffect(() => {
    fetchYears();
  }, []);

  // Fetch shows when year filter changes
  useEffect(() => {
    if (yearFilter) {
      fetchShows();
    }
  }, [yearFilter, fetchShows]);

  // Handle attendance toggle
  const handleAttendanceToggle = async (show: Show) => {
    if (!user) return;
    
    try {
      if (show.attended) {
        await removeAttendedShow(show.show_id);
      } else {
        await addAttendedShow(show.show_id);
      }
      
      // Update the local state to reflect the change
      setShows(prev => 
        prev.map(s => 
          s.show_id === show.show_id ? { ...s, attended: !s.attended } : s
        )
      );
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return dateString
      .split('-')  
      .slice(1)    
      .concat(dateString.substring(2, 4))
      .join('.');
  };

  // Filter and sort shows for display
  const getFilteredAndSortedShows = () => {
    // Filter shows based on search query
    let filteredShows = shows;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredShows = shows.filter(show => 
        show.show_subvenue.toLowerCase().includes(query) ||
        show.show_venue_location.toLowerCase().includes(query) ||
        show.show_group.toLowerCase().includes(query) ||
        (show.show_detail && show.show_detail.toLowerCase().includes(query))
      );
    }
    
    // Sort shows
    return [...filteredShows].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Show];
      let bValue: any = b[sortColumn as keyof Show];
      
      // For dates, compare as dates
      if (sortColumn === 'show_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle null values
      if (aValue === null) aValue = '';
      if (bValue === null) bValue = '';

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'desc' ? comparison : -comparison;
    });
  };

  const filteredShows = getFilteredAndSortedShows();

  return (
    <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
        <div className="flex items-center gap-3 mb-3 lg:mb-0">
          <button
            onClick={onClose}
            className="p-1.5 text-white bg-tertiary hover:bg-tertiary/80 transition-colors border border-white/20 rounded-lg"
            aria-label="Back to attended shows"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-semibold text-white">Manage Attended Shows</h2>
        </div>
        
        <div className="flex gap-3 mt-2 lg:mt-0 w-full lg:w-auto lg:justify-end">
          {/* Search input - 2/3 width on mobile */}
          <div className="relative w-2/3 lg:w-auto">
            <input
              type="text"
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#0e151b] text-[#fce7ca] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary w-full lg:w-48"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#fce7ca]/50 w-4 h-4" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#fce7ca]/50 hover:text-[#fce7ca] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Year filter dropdown - 1/3 width on mobile */}
          <div className="relative w-1/3 lg:w-auto" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 bg-[#0e151b] text-[#fce7ca] border border-white/10 rounded-lg text-sm hover:bg-[#172330] transition-colors w-full justify-between"
            >
              <span>{yearFilter || 'Select Year'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 max-h-64 overflow-y-auto bg-[#0e151b] border border-white/10 rounded-lg shadow-lg z-10 w-full lg:w-32">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setYearFilter(year);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1.5 text-sm ${
                      yearFilter === year
                        ? 'bg-tertiary/80 text-white'
                        : 'text-[#fce7ca]/90 hover:bg-white/10'
                    } transition-colors`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 text-[#fce7ca]/70 text-xs lg:text-sm">
        Check the boxes next to shows you've attended to add them to your list. Uncheck to remove them.
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-[#fce7ca]/70 mt-4">Loading shows...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-2 py-2 text-center text-s font-semibold text-white/90">
                  <Check size={16} className="text-white" strokeWidth={2.5} />
                </th>
                <th 
                  className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('show_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {getSortIcon('show_date')}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('show_group')}
                >
                  <div className="flex items-center gap-1">
                    Group
                    {getSortIcon('show_group')}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('show_subvenue')}
                >
                  <div className="flex items-center gap-1">
                    Venue
                    {getSortIcon('show_subvenue')}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('show_venue_location')}
                >
                  <div className="flex items-center gap-1">
                    Location
                    {getSortIcon('show_venue_location')}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap"
                >
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredShows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-[#fce7ca]/70">
                    {searchQuery ? 'No shows matching your search' : 'No shows found for this year'}
                  </td>
                </tr>
              ) : (
                filteredShows.map((show, index) => (
                  <tr
                    key={show.show_id}
                    className={`${
                      index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                    } hover:bg-white/10 transition-colors text-xs`}
                  >
                    <td className="text-center">
                      <button
                        onClick={() => handleAttendanceToggle(show)}
                        className={`p-0.5 rounded-md transition-all ${
                          show.attended
                            ? 'bg-green-600 hover:bg-red-600 text-white'
                            : 'text-white border-[#fce7ca]/80 hover:bg-green-600 hover:text-white'
                        }`}
                        title={show.attended ? "Remove from attended shows" : "Mark as attended"}
                      >
                        <Check size={14} className={show.attended ? "text-white" : "text-white/60"} />
                      </button>
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/setlist/${show.show_id}`)}
                        className="font-semibold hover:text-white transition-colors table-link"
                      >
                        {formatDate(show.show_date)}
                      </button>
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                      {show.show_group}
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`)}
                        className="hover:text-white hover:underline transition-colors"
                      >
                        {show.show_subvenue}
                      </button>
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/70 whitespace-nowrap">
                      {show.show_venue_location}
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/70 whitespace-nowrap">
                      {show.show_detail || (show.show_alert && 
                        <span className="text-tertiary">
                          <strong>[{show.show_alert}]</strong>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendShowManager;