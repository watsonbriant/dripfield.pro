import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SetlistEntryModal from './SetlistEntryModal';

interface ShowData {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_canonid: number | null;
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
  
  // Status tracking for save operations
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');

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
          .select('show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid')
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsLast: true })
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
      const canonidText = show.show_canonid ? `[${show.show_canonid}]` : '';
      const displayText = `${formattedDate} ${canonidText} [${show.show_group} — ${show.show_venue_location}]`;
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
      entry_id: '', 
      entry_set: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_set : '',
      entry_setnum: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_setnum + 1 : 1, // Changed: +1 here
      entry_setorder: 0,
      entry_song: '',
      entry_short: null,
      entry_segue: null,
      entry_length: null,
      entry_placement: null, // We'll handle this in the modal
      entry_coachnotes: null,
      entry_new: 'FALSE',
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
    
    // Reset status after 2 seconds
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };
  
  // Handle save status updates from modal
  const handleSaveStatusUpdate = (status: 'idle' | 'processing' | 'done' | 'error') => {
    setSaveStatus(status);
  };
  
  // Get header styling based on save status
  const getHeaderStyle = () => {
    switch (saveStatus) {
      case 'processing':
        return 'bg-black text-primary';
      case 'done':
        return 'bg-green-600 text-primary';
      case 'error':
        return 'bg-red-600 text-primary';
      default:
        return 'bg-fourth text-primary';
    }
  };
  
  // Get header text based on save status
  const getHeaderText = () => {
    switch (saveStatus) {
      case 'processing':
        return 'Processing...';
      case 'done':
        return 'Done!';
      case 'error':
        return 'Error.';
      default:
        return 'Setlist Management';
    }
  };

  return (
    <div>
      {/* Header with right-aligned dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-lg font-semibold text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary transition-colors ${getHeaderStyle()}`}>
          {getHeaderText()}
        </h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-fourth text-primary px-4 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium"
          >
            Select Show
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search shows..."
                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                {loading && loadingProgress < 100 ? (
                  <div className="flex flex-col justify-center items-center p-4 h-16">
                    <div className="animate-spin rounded-lg h-5 w-5 border-t-2 border-b-2 border-secondary"></div>
                    <p className="text-xs text-fifth/70 mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
                  </div>
                ) : (
                  <>
                    {filteredShows.map((show) => (
                      <button
                        key={show.show_id}
                        onClick={() => handleShowSelect(show)}
                        className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-canvas transition-colors"
                      >
                        <span className="font-medium">
                          {formatDate(show.show_date)}
                        </span>
                          {show.show_canonid ? ` [${show.show_canonid}]` : ''} 
                          &nbsp;[{show.show_group} — {show.show_venue_location}]
                      </button>
                    ))}
                    {filteredShows.length === 0 && !loading && (
                      <div className="px-2 py-1 text-sm text-fifth/60 italic">
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
              <h4 className="text-lg text-fifth font-medium">
                {formatDate(selectedShow.show_date)}
                &nbsp;[{selectedShow.show_group}]
              </h4>
              <div className="text-sm text-fifth/70 font-light">
                {selectedShow.show_subvenue} — {selectedShow.show_venue_location}
              </div>
            </div>
            
            {/* Add New Entry Button - similar to the Add New Song button in AdminSong */}
            <button
              onClick={handleCreateNewEntry}
              className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-lg h-8 w-8 border-t-2 border-b-2 border-fourth"></div>
            </div>
          ) : (
            <>
              {setlistEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr className="bg-canvas border-y border-secondary/10">
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">S</th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">#</th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">Song</th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">Short</th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">&gt;</th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">Placement</th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">Length</th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {setlistEntries.map((entry, index) => (
                        <tr 
                          key={entry.entry_id} 
                          className={`${
                            index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                          } hover:bg-tertiary/40 transition-colors text-xs cursor-pointer`}
                          onClick={() => handleEntrySelect(entry)}
                        >
                          <td className="px-2 py-0.5 font-light text-fifth whitespace-nowrap text-center">{entry.entry_set}</td>
                          <td className="px-2 py-0.5 font-light text-fifth whitespace-nowrap text-center">{entry.entry_setnum}</td>
                          <td className="px-2 py-0.5 text-fifth whitespace-nowrap font-medium">{entry.entry_song}</td>
                          <td className="px-2 py-0.5 font-light text-fifth whitespace-nowrap">
                            {entry.entry_short || ""}
                          </td>
                          <td className="px-2 py-0.5 font-light text-fifth whitespace-nowrap">
                            {entry.entry_segue || ""}
                          </td>
                          <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                            <div 
                              className="px-2 py-0.5 rounded-md text-center font-medium"
                              style={{ 
                                backgroundColor: getPlacementColor(entry.entry_placement),
                                color: getPlacementColor(entry.entry_placement) !== 'transparent' ? 'white' : 'black'
                              }}
                            >
                              {entry.entry_placement || ""}
                            </div>
                          </td>
                          <td className="px-2 py-0.5 font-light text-fifth text-center whitespace-nowrap">{formatTimeDisplay(entry.entry_length)}</td>
                          <td className="px-2 py-0.5 font-light text-fifth whitespace-nowrap">
                            {entry.entry_coachnotes || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-secondary rounded-lg p-6 text-center">
                  <p className="text-fifth/70">No setlist entries found for this show.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Show message when no show is selected */}
      {!selectedShow && !loading && (
        <div className="border border-secondary rounded-lg p-6 text-center">
          <p className="text-fifth/70">Select a show to view its setlist.</p>
        </div>
      )}

      {/* Show loading indicator for initial data fetch */}
      {loading && loadingProgress < 100 && !selectedShow && (
        <div className="flex flex-col justify-center items-center h-56">
          <div className="animate-spin rounded-lg h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
          <p className="text-fifth/70 mt-4">Loading shows ({Math.round(loadingProgress)}%)</p>
        </div>
      )}

      {/* Setlist Entry Modal */}
      <SetlistEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        onSaveStatusUpdate={handleSaveStatusUpdate}
        isNewEntry={isNewEntry}
      />
    </div>
  );
};

export default AdminSetlist;