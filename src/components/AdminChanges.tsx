import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ShowChangeModal from './ShowChangeModal';
import { getShowDisplayData } from '../utils/showUtils';

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

// Custom hooks
const useShows = () => {
  const [shows, setShows] = useState<ShowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mountedRef = useRef(false);

  const fetchShows = async () => {
    try {
      setLoading(true);
      setLoadingProgress(5);
      
      let allShowsData: ShowData[] = [];
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_date, show_group, show_subvenue, show_venue_location, show_canonid')
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allShowsData = [...allShowsData, ...data];
          page++;
          setLoadingProgress(Math.min(95, 5 + (page * 15)));
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      setShows(allShowsData || []);
      setLoadingProgress(100);
      setTimeout(() => setLoading(false), 300);
    } catch (error) {
      console.error('Error fetching shows:', error);
      setLoadingProgress(100);
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    if (!mountedRef.current) {
      fetchShows();
      mountedRef.current = true;
    }
  }, []);

  return { shows, loading, loadingProgress };
};

const useShowChanges = () => {
  const [showChanges, setShowChanges] = useState<ShowChangeData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShowChanges = async (showId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('show_changes')
        .select('show_change_uuid, show_id, change_order, change_type, change')
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
  };

  return { showChanges, loading, fetchShowChanges };
};

// UI Components
const ShowDropdown: React.FC<{
  shows: ShowData[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  loading: boolean;
  loadingProgress: number;
  onShowSelect: (show: ShowData) => void;
  selectedShow?: ShowData | null;
}> = ({ shows, searchTerm, setSearchTerm, isDropdownOpen, setIsDropdownOpen, loading, loadingProgress, onShowSelect, selectedShow }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedShowRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, setIsDropdownOpen]);

  // Scroll to selected show when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && selectedShow && selectedShowRef.current && scrollContainerRef.current) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (selectedShowRef.current && scrollContainerRef.current) {
          selectedShowRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [isDropdownOpen, selectedShow]);

  return (
    <div className="relative" ref={dropdownRef}>
    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium">
      Show <ChevronDown className="w-4 h-4" />
    </button>
    {isDropdownOpen && (
      <div className="absolute right-0 bg-primary border border-fourth shadow-xl z-50 w-80 max-h-96 overflow-y-auto">
        <div className="p-1">
          <div className="relative">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search shows..." className="w-full px-2 py-0.5 pr-8 border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60" />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
          </div>
        </div>
        <div ref={scrollContainerRef} className="max-h-64 overflow-y-auto divide-y divide-black/10">
          {loading && loadingProgress < 100 ? (
            <div className="flex flex-col justify-center items-center p-3 h-16">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-xs text-fifth mt-2">Loading shows ({Math.round(loadingProgress)}%)</p>
            </div>
          ) : (
            <>
              {shows.map((show) => (
                <button
                  key={show.show_id}
                  ref={selectedShow && show.show_id === selectedShow.show_id ? selectedShowRef : null}
                  onClick={() => onShowSelect(show)}
                  className={`w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors ${
                    selectedShow && show.show_id === selectedShow.show_id ? 'bg-tertiary/40' : ''
                  }`}
                >
                  {(() => {
                    const { dateStr, canonIdStr, locationStr } = getShowDisplayData(show);
                    return (
                      <>
                        <span className="font-medium">{dateStr}</span>
                        {canonIdStr}
                        {locationStr}
                      </>
                    );
                  })()}
                </button>
              ))}
              {shows.length === 0 && !loading && <div className="px-2 py-0.5 text-xs text-fifth text-center">No shows found</div>}
            </>
          )}
        </div>
      </div>
    )}
  </div>
  );
};

const ChangesTable: React.FC<{ showChanges: ShowChangeData[]; onChangeSelect: (change: ShowChangeData) => void; }> = ({ showChanges, onChangeSelect }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse min-w-max">
      <thead>
        <tr className="bg-canvas border-y border-fourth/10">
          <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">Order</th>
          <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">Type</th>
          <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap">Change</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/5">
        {showChanges.map((change, index) => (
          <tr key={change.show_change_uuid} className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'} hover:bg-tertiary/40 transition-colors text-[0.625rem] cursor-pointer`} onClick={() => onChangeSelect(change)}>
            <td className="px-2 font-light text-fifth whitespace-nowrap text-center">{change.change_order}</td>
            <td className="px-2 font-light text-fifth whitespace-nowrap text-center">{change.change_type}</td>
            <td className="px-2 font-light text-fifth">
              <div className="[&_a]:font-medium" dangerouslySetInnerHTML={{ __html: change.change }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const AdminChanges: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  const [selectedChange, setSelectedChange] = useState<ShowChangeData | null>(null);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isNewChange, setIsNewChange] = useState(false);
  const showDataLoadedRef = useRef(false);

  const { shows, loading: showsLoading, loadingProgress } = useShows();
  const { showChanges, loading: changesLoading, fetchShowChanges } = useShowChanges();


  // Load the selected show from localStorage after shows are loaded
  useEffect(() => {
    if (shows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true;
      try {
        const storedShowId = localStorage.getItem('adminSelectedShowId');
        if (storedShowId) {
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

  // Sync selected show when localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminSelectedShowId' && e.newValue) {
        const newShowId = e.newValue;
        if (!selectedShow || selectedShow.show_id !== newShowId) {
          const newShow = shows.find(show => show.show_id === newShowId);
          if (newShow) {
            setSelectedShow(newShow);
            fetchShowChanges(newShowId);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedShow, shows]);

  // Handle visibility change to reload data and sync selected show
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if the selected show has changed in localStorage
        try {
          const storedShowId = localStorage.getItem('adminSelectedShowId');
          if (storedShowId && (!selectedShow || selectedShow.show_id !== storedShowId)) {
            const storedShow = shows.find(show => show.show_id === storedShowId);
            if (storedShow) {
              setSelectedShow(storedShow);
              fetchShowChanges(storedShowId);
            }
          } else if (selectedShow) {
            fetchShowChanges(selectedShow.show_id);
          }
        } catch (error) {
          console.error('Error syncing selected show:', error);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedShow, shows]);

  // Format date as MM.DD.YY
  const formatDate = (dateString: string): string => {
    try {
      return dateString.split('-').slice(1).concat(dateString.substring(2, 4)).join('.');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };


  // Filter shows based on search term
  const filteredShows = React.useMemo(() => {
    return shows.filter(show => {
      const formattedDate = formatDate(show.show_date);
      const canonidText = show.show_canonid ? `[${show.show_canonid}]` : '';
      const displayText = `${formattedDate} ${canonidText} [${show.show_group} — ${show.show_venue_location}]`;
      return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [shows, searchTerm]);

  // Handler functions
  const handleShowSelect = (show: ShowData) => {
    setSelectedShow(show);
    fetchShowChanges(show.show_id);
    setIsDropdownOpen(false);
    setSearchTerm('');
    try {
      localStorage.setItem('adminSelectedShowId', show.show_id);
    } catch (error) {
      console.error('Error saving selected show to localStorage:', error);
    }
  };

  const handleChangeSelect = (change: ShowChangeData) => {
    setSelectedChange(change);
    setIsNewChange(false);
    setIsChangeModalOpen(true);
  };

  const handleCreateNewChange = () => {
    if (!selectedShow) return;
    const newChange: ShowChangeData = {
      show_change_uuid: '',
      show_id: selectedShow.show_id,
      change_order: showChanges.length > 0 ? Math.max(...showChanges.map(c => c.change_order)) + 1 : 1,
      change_type: '',
      change: ''
    };
    setSelectedChange(newChange);
    setIsNewChange(true);
    setIsChangeModalOpen(true);
  };

  const handleSaveChange = () => {
    if (selectedShow) fetchShowChanges(selectedShow.show_id);
    setIsChangeModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
          Show Changes Management
        </h3>
        <ShowDropdown 
          shows={filteredShows} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          isDropdownOpen={isDropdownOpen} 
          setIsDropdownOpen={setIsDropdownOpen} 
          loading={showsLoading} 
          loadingProgress={loadingProgress} 
          onShowSelect={handleShowSelect}
          selectedShow={selectedShow}
        />
      </div>

      {selectedShow && (
        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <div>
              <h4 className="text-sm text-fifth font-medium">{formatDate(selectedShow.show_date)} &nbsp;[{selectedShow.show_group}]</h4>
              <div className="text-xs text-fifth/70">{selectedShow.show_subvenue} — {selectedShow.show_venue_location}</div>
            </div>
            <button onClick={handleCreateNewChange} className="flex items-center gap-2 bg-fourth text-white px-1 py-[3px] border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {changesLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
            </div>
          ) : showChanges.length > 0 ? (
            <ChangesTable showChanges={showChanges} onChangeSelect={handleChangeSelect} />
          ) : (
            <div className="border border-fourth bg-primary p-3 text-center">
              <p className="text-xs text-fifth">No changes found for this show.</p>
            </div>
          )}
        </div>
      )}

      {!selectedShow && !showsLoading && (
        <div className="border border-fourth bg-primary p-3 text-center">
          <p className="text-xs text-fifth">Select a show to view its changes.</p>
        </div>
      )}

      {showsLoading && loadingProgress < 100 && !selectedShow && (
        <div className="flex flex-col justify-center items-center h-56">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-xs text-fifth mt-4">Loading shows ({Math.round(loadingProgress)}%)</p>
        </div>
      )}

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