import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import SetlistEntryModal from './SetlistEntryModal';

interface ShowData {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
}

interface SetlistEntryData {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_setorder: number;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string | null;
  entry_coachnotes: string | null;
  entry_show: string;
  entry_new: string | null;
}

export const AdminSetlist: React.FC = () => {
  const [shows, setShows] = useState<ShowData[]>([]);
  const [setlistEntries, setSetlistEntries] = useState<SetlistEntryData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Initialize selectedShow from localStorage or null
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  
  const [selectedEntry, setSelectedEntry] = useState<SetlistEntryData | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNewEntry, setIsNewEntry] = useState(false);
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
        const storedShowId = localStorage.getItem('adminSelectedShowId');
        
        if (storedShowId) {
          // Find the show in our loaded shows array
          const storedShow = shows.find(show => show.show_id === storedShowId);
          
          if (storedShow) {
            setSelectedShow(storedShow);
            fetchSetlistEntries(storedShowId);
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
        // If we have a selected show, refresh its entries
        if (selectedShow) {
          fetchSetlistEntries(selectedShow.show_id);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedShow]);

  // Format date as MM.DD.YY using formatInTimeZone to handle timezones properly
  const formatDate = (dateString: string): string => {
    try {
      // For direct display in the dropdown, ensure consistent formatting
      return dateString
        .split('-')
        .slice(1)
        .concat(dateString.substring(2, 4))
        .join('.');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if any error occurs
    }
  };

  // Format time display from interval
  const formatTimeDisplay = (interval: string | null) => {
    if (!interval) return "";
    
    // Handle PostgreSQL interval format like "00:08:34"
    if (interval.includes(":")) {
      return interval;
    }
    
    return interval;
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
      const pageSize = 1000; // Adjust based on your database size
      
      while (hasMore) {
        
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_date, show_group, show_subvenue, show_venue_location')
          .order('show_date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allShowsData = [...allShowsData, ...data];
          page++;
          
          // Update progress (5-95%)
          setLoadingProgress(Math.min(95, 5 + (page * 15)));
          
          // If we got fewer records than the page size, we're done
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      setShows(allShowsData || []);
      
      setLoadingProgress(100);
      // Small delay to ensure smooth transition
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

  // Fetch setlist entries for a specific show
  async function fetchSetlistEntries(showId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
          entry_id, 
          entry_set, 
          entry_setnum, 
          entry_setorder,
          entry_song, 
          entry_short, 
          entry_segue, 
          entry_length, 
          entry_placement, 
          entry_coachnotes,
          entry_new,
          entry_show
        `)
        .eq('entry_show', showId)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true });
  
      if (error) throw error;
      setSetlistEntries(data || []);
    } catch (error) {
      console.error('Error fetching setlist entries:', error);
      setSetlistEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter shows based on search term
  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const formattedDate = formatDate(show.show_date);
      const displayText = `${formattedDate} [${show.show_group} — ${show.show_venue_location}]`;
      return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [shows, searchTerm]);

  // Handle show selection
  const handleShowSelect = (show: ShowData) => {
    setSelectedShow(show);
    fetchSetlistEntries(show.show_id);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    // Save the selected show ID to localStorage
    try {
      localStorage.setItem('adminSelectedShowId', show.show_id);
    } catch (error) {
      console.error('Error saving selected show to localStorage:', error);
    }
  };

  // Get background color for placement similar to the FullSetlistDisplay component
  const getPlacementColor = (placement: string | null): string => {
    if (!placement) return 'transparent';
    
    const colorMap: { [key: string]: string } = {
      'Set 1 Opener': '#006400',
      'Set 1 Closer': '#995905',
      'Set 2 Opener': '#019B7A',
      'Set 3 Opener': '#019B7A',
      'Set 4 Opener': '#019B7A',
      'Set 5 Opener': '#019B7A',
      'Set 2 Closer': '#E17401',
      'Set 3 Closer': '#E17401',
      'Set 4 Closer': '#E17401',
      'Set 5 Closer': '#E17401',
      'Encore 1': '#7C2128',
      'Encore 2': '#CE1126',
      'Encore 3': '#AF1E2D'
    };
    
    if (placement.startsWith('Main Set')) {
      return 'transparent';
    }
    
    return colorMap[placement] || '#0c1d27';
  };

  // Handle setlist entry selection for editing
  const handleEntrySelect = (entry: SetlistEntryData) => {
    setSelectedEntry(entry);
    setIsNewEntry(false);
    setIsEntryModalOpen(true);
  };

  // Handle creating a new setlist entry
  const handleCreateNewEntry = () => {
    if (!selectedShow) return;
    
    const newEntry: SetlistEntryData = {
      entry_id: '', // This will be assigned by the database
      entry_set: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_set : '',
      entry_setnum: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_setnum : 1,
      entry_setorder: 0, // This will be calculated by your application
      entry_song: '',
      entry_short: null,
      entry_segue: null,
      entry_length: null,
      entry_placement: null,
      entry_coachnotes: null,
      entry_new: 'FALSE', // Add this line
      entry_show: selectedShow.show_id
    };
    
    setSelectedEntry(newEntry);
    setIsNewEntry(true);
    setIsEntryModalOpen(true);
  };

  // Handle saving an entry - this ensures the table refreshes when an entry is added or edited
  const handleSaveEntry = () => {
    if (selectedShow) {
      fetchSetlistEntries(selectedShow.show_id);
    }
    setIsEntryModalOpen(false);
  };

  return (
    <div>
      {/* Header with right-aligned dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-white/90 font-semibold">Setlist Management</h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-1.5 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors text-sm whitespace-nowrap font-semibold"
          >
            Select Show
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search shows..."
                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-border-primary bg-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border-primary/20">
                {loading && loadingProgress < 100 ? (
                  <div className="flex flex-col justify-center items-center p-4 h-16">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-xs text-primary/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
                  </div>
                ) : (
                  <>
                    {filteredShows.map((show) => (
                      <button
                        key={show.show_id}
                        onClick={() => handleShowSelect(show)}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-surface-secondary transition-colors"
                      >
                        {formatDate(show.show_date)} [{show.show_group} — {show.show_venue_location}]
                      </button>
                    ))}
                    {filteredShows.length === 0 && !loading && (
                      <div className="px-2 py-1 text-sm text-gray-500 italic">
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-lg text-[#fce7ca]/90 font-medium">
                {formatDate(selectedShow.show_date)} [{selectedShow.show_group}]
              </h4>
              <div className="text-sm text-white/70 mt-1">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </div>
            </div>
            
            {/* Add New Entry Button - similar to the Add New Song button in AdminSong */}
            <button
              onClick={handleCreateNewEntry}
              className="flex items-center gap-2 bg-tertiary text-white px-1.5 py-1.5 rounded-lg hover:bg-tertiary/90 transition-colors text-sm whitespace-nowrap font-semibold"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tertiary"></div>
            </div>
          ) : (
            <>
              {setlistEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr className="bg-[#0e151b] border-y border-white/10">
                        <th className="px-2 py-1 text-center text-s font-semibold text-white/90 whitespace-nowrap">S</th>
                        <th className="px-2 py-1 text-center text-s font-semibold text-white/90 whitespace-nowrap">#</th>
                        <th className="px-2 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">Song</th>
                        <th className="px-2 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">Short</th>
                        <th className="px-2 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">&gt;</th>
                        <th className="px-2 py-1 text-center text-s font-semibold text-white/90 whitespace-nowrap">Placement</th>
                        <th className="px-2 py-1 text-center text-s font-semibold text-white/90 whitespace-nowrap">Length</th>
                        <th className="px-2 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {setlistEntries.map((entry, index) => (
                        <tr 
                          key={entry.entry_id} 
                          className={`${
                            index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                          } hover:bg-white/10 transition-colors text-xs cursor-pointer`}
                          onClick={() => handleEntrySelect(entry)}
                        >
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap text-center">{entry.entry_set}</td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap text-center">{entry.entry_setnum}</td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap font-semibold">{entry.entry_song}</td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap">
                            {entry.entry_short || ""}
                          </td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap">
                            {entry.entry_segue || ""}
                          </td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap">
                            <div 
                              className="px-2 py-0.5 rounded-md text-center font-semibold"
                              style={{ 
                                backgroundColor: getPlacementColor(entry.entry_placement),
                                color: getPlacementColor(entry.entry_placement) !== 'transparent' ? 'white' : '#fce7ca90'
                              }}
                            >
                              {entry.entry_placement || ""}
                            </div>
                          </td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 text-center whitespace-nowrap">{formatTimeDisplay(entry.entry_length)}</td>
                          <td className="px-2 py-0.5 text-[#fce7ca]/90 whitespace-nowrap">
                            {entry.entry_coachnotes || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-white/10 rounded-lg p-6 text-center">
                  <p className="text-white/70">No setlist entries found for this show.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Show message when no show is selected */}
      {!selectedShow && !loading && (
        <div className="border border-white/10 rounded-lg p-6 text-center">
          <p className="text-white/70">Select a show to view its setlist.</p>
        </div>
      )}

      {/* Show loading indicator for initial data fetch */}
      {loading && loadingProgress < 100 && !selectedShow && (
        <div className="flex flex-col justify-center items-center h-56">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tertiary"></div>
          <p className="text-[#fce7ca]/70 mt-4">Loading shows ({Math.round(loadingProgress)}%)</p>
        </div>
      )}

      {/* Setlist Entry Modal */}
      <SetlistEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        isNewEntry={isNewEntry}
      />
    </div>
  );
};

export default AdminSetlist;