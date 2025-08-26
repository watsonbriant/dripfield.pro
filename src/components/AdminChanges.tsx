import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShowChangeModal from './ShowChangeModal';

interface ShowData {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_canonid: number | null;
}

interface ShowChangeData {
  show_change_uuid: string;
  show_id: string;
  change_order: number;
  change_type: string;
  change: string;
}

export const AdminChanges: React.FC = () => {
  const [shows, setShows] = useState<ShowData[]>([]);
  const [showChanges, setShowChanges] = useState<ShowChangeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Initialize selectedShow from localStorage or null
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  
  const [selectedChange, setSelectedChange] = useState<ShowChangeData | null>(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isNewChange, setIsNewChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const showDataLoadedRef = useRef(false);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all shows on component mount, but only once
  useEffect(() => {
    if (!mountedRef.current) {
      fetchShows();
      mountedRef.current = true;
    }
  }, []);

  // Load the selected show from localStorage after shows are loaded
  useEffect(() => {
    // Only proceed if shows are loaded and we haven't already restored the selected show
    if (shows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true;
      
      try {
        // Get the stored show ID
        const storedShowId = localStorage.getItem('adminChangesSelectedShowId');
        
        if (storedShowId) {
          // Find the show in our loaded shows array
          const storedShow = shows.find(show => show.show_id === storedShowId);
          
          if (storedShow) {
            setSelectedShow(storedShow);
            fetchShowChanges(storedShowId);
          }
        }
      } catch (error) {
        console.error('Error restoring selected show from localStorage:', error);
      }
    }
  }, [shows]);

  // Handle visibility change to reload data if needed when returning to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If we have a selected show, refresh its changes
        if (selectedShow) {
          fetchShowChanges(selectedShow.show_id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedShow]);

  // Format date as MM.DD.YY
  const formatDate = (dateString: string): string => {
    try {
      return dateString
        .split('-')
        .slice(1)
        .concat(dateString.substring(2, 4))
        .join('.');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Fetch all shows from the database with pagination
  async function fetchShows() {
    try {
      setLoading(true);
      setLoadingProgress(5);
      
      // Use pagination to fetch all shows
      let allShowsData: ShowData[] = [];
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid')
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsLast: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allShowsData = [...allShowsData, ...data];
          page++;
          
          // Update progress
          setLoadingProgress(Math.min(95, 5 + (page * 15)));
          
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      setShows(allShowsData || []);
      
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching shows:', error);
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }

  // Fetch show changes for a specific show
  async function fetchShowChanges(showId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('show_changes')
        .select(`
          show_change_uuid,
          show_id,
          change_order,
          change_type,
          change
        `)
        .eq('show_id', showId)
        .order('change_order', { ascending: true });
  
      if (error) throw error;
      setShowChanges(data || []);
    } catch (error) {
      console.error('Error fetching show changes:', error);
      setShowChanges([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter shows based on search term
  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const formattedDate = formatDate(show.show_date);
      const canonidText = show.show_canonid ? `[${show.show_canonid}]` : '';
      const displayText = `${formattedDate} ${canonidText} [${show.show_group} — ${show.show_venue_location}]`;
      return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [shows, searchTerm]);

  // Handle show selection
  const handleShowSelect = (show: ShowData) => {
    setSelectedShow(show);
    fetchShowChanges(show.show_id);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    // Save the selected show ID to localStorage
    try {
      localStorage.setItem('adminChangesSelectedShowId', show.show_id);
    } catch (error) {
      console.error('Error saving selected show to localStorage:', error);
    }
  };

  // Handle change selection for editing
  const handleChangeSelect = (change: ShowChangeData) => {
    setSelectedChange(change);
    setIsNewChange(false);
    setIsChangeModalOpen(true);
  };

  // Handle creating a new change
  const handleCreateNewChange = () => {
    if (!selectedShow) return;
    
    const newChange: ShowChangeData = {
      show_change_uuid: '', // Will be assigned by database
      show_id: selectedShow.show_id,
      change_order: showChanges.length > 0 
        ? Math.max(...showChanges.map(c => c.change_order)) + 1 
        : 1,
      change_type: '',
      change: ''
    };
    
    setSelectedChange(newChange);
    setIsNewChange(true);
    setIsChangeModalOpen(true);
  };

  // Handle saving a change
  const handleSaveChange = () => {
    if (selectedShow) {
      fetchShowChanges(selectedShow.show_id);
    }
    setIsChangeModalOpen(false);
  };

  return (
    <div>
      {/* Header with right-aligned dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Show Changes Management</h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
          >
            Select Show
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search shows..."
                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                {loading && loadingProgress < 100 ? (
                  <div className="flex flex-col justify-center items-center p-4 h-16">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    <p className="text-xs text-black/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
                  </div>
                ) : (
                  <>
                    {filteredShows.map((show) => (
                      <button
                        key={show.show_id}
                        onClick={() => handleShowSelect(show)}
                        className="w-full text-left px-2 py-1 text-sm text-black hover:bg-canvas transition-colors"
                      >
                        <span className="font-semibold">
                          {formatDate(show.show_date)}
                        </span>
                          {show.show_canonid ? ` [${show.show_canonid}]` : ''} 
                          &nbsp;[{show.show_group} — {show.show_venue_location}]
                      </button>
                    ))}
                    {filteredShows.length === 0 && !loading && (
                      <div className="px-2 py-1 text-sm text-black/60 italic">
                        No shows found
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected show display */}
      {selectedShow && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h4 className="text-lg text-black font-medium">
                {formatDate(selectedShow.show_date)}
                &nbsp;[{selectedShow.show_group}]
              </h4>
              <div className="text-sm text-black/70">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </div>
            </div>
            
            {/* Add New Change Button */}
            <button
              onClick={handleCreateNewChange}
              className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fourth"></div>
            </div>
          ) : (
            <>
              {showChanges.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr className="bg-canvas border-y border-black/10">
                        <th className="px-2 py-1 text-center text-s font-semibold text-black whitespace-nowrap">Order</th>
                        <th className="px-2 py-1 text-center text-s font-semibold text-black whitespace-nowrap">Type</th>
                        <th className="px-2 py-1 text-left text-s font-semibold text-black whitespace-nowrap">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {showChanges.map((change, index) => (
                        <tr 
                          key={change.show_change_uuid} 
                          className={`${
                            index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                          } hover:bg-tertiary/40 transition-colors text-xs cursor-pointer`}
                          onClick={() => handleChangeSelect(change)}
                        >
                          <td className="px-2 py-0.5 text-black font-light whitespace-nowrap text-center">{change.change_order}</td>
                          <td className="px-2 py-0.5 text-black font-light whitespace-nowrap text-center">{change.change_type}</td>
                          <td className="px-2 py-0.5 text-black font-light">
                            <div 
                              className="[&_a]:font-medium"
                              dangerouslySetInnerHTML={{ __html: change.change }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-black rounded-lg p-6 text-center">
                  <p className="text-black/70">No changes found for this show.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Show message when no show is selected */}
      {!selectedShow && !loading && (
        <div className="border border-black rounded-lg p-6 text-center">
          <p className="text-black/70">Select a show to view its changes.</p>
        </div>
      )}

      {/* Show loading indicator for initial data fetch */}
      {loading && loadingProgress < 100 && !selectedShow && (
        <div className="flex flex-col justify-center items-center h-56">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
          <p className="text-black/70 mt-4">Loading shows ({Math.round(loadingProgress)}%)</p>
        </div>
      )}

      {/* Show Change Modal */}
      <ShowChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        change={selectedChange}
        onSave={handleSaveChange}
        isNewChange={isNewChange}
      />
    </div>
  );
};

export default AdminChanges;