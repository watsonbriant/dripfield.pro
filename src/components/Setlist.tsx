import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import FullSetlistDisplay from './FullSetlistDisplay';
import ToggleSwitch from './ToggleSwitch';

interface Tour {
  tour: string;
  tour_canonid: number;
  tour_id: string;
}

interface SetlistEntry {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string;
  entry_coachnotes: string | null;
  entry_setorder: number;
  entry_show: string;
  song_tour_count: string | null;
  last_count: string | null;
  last_show_id: string | null;
  last_show_tour: string | null;
  last_show_subvenue: string | null;
  last_venue: string | null;
  last_venue_location: string | null;
  last_show_date: string | null;
  times_played: string | null;
  shows_since_debut: string | null;
  song_rarity_percentage: string | null;
  times_played_num: string | null;
  shows_since_debut_num: string | null;
  song_category: string;
  song_originalartist?: string;
  category_canonid: number;
  guests: {
    guest_id: string;
    guest_display_name: string;
    guest_canonid: number;
  }[];
}

interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string | null;
  show_detail: string | null;
  show_alert: string | null;
  show_rarity_percentage: string | null;
  total_entry_length: string | null;
  show_canonid: number | null;
}

interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_tour: string;
  show_subvenue: string;
  show_venue_location: string;
  show_detail: string | null;
  show_alert: string | null;
  show_coachnotes: string | null;
  show_callbacks: string | null;
  show_subvenue_venue?: string; // Added for venue navigation
  venue_id?: string; // Added for venue ID
  tours: {
    tour_showfields: boolean;
    tour_id: string; // Add this field
  };
  tour_id?: string; // Add this field to store the tour ID at the top level
}

export function Setlist() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = React.useState<Show | null>(null);
  const [setlist, setSetlist] = React.useState<SetlistEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [showDates, setShowDates] = React.useState<ShowDate[]>([]);
  const [isShowDatesDropdownOpen, setIsShowDatesDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const dropdownListRef = React.useRef<HTMLDivElement>(null);
  const showDatesDropdownRef = React.useRef<HTMLDivElement>(null);
  const showDatesDropdownListRef = React.useRef<HTMLDivElement>(null);
  const [showCoachNotes, setShowCoachNotes] = React.useState(true);

  const hasCoachNotes = React.useMemo(() => {
    return setlist.some(entry => entry.entry_coachnotes);
  }, [setlist]);
  
  // Helper function to navigate to venue page
  const navigateToVenue = () => {
    if (!show) return;
    
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(show.show_subvenue_venue)}`);
    } else {
      // If we don't have either, use the subvenue or venue location as a fallback
      const venueSearchTerm = show.show_subvenue || show.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (showDatesDropdownRef.current && !showDatesDropdownRef.current.contains(event.target as Node)) {
        setIsShowDatesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for auto-scrolling in the Tours dropdown
  React.useEffect(() => {
    // Scroll to the current tour when dropdown opens
    if (isDropdownOpen && dropdownListRef.current && show?.show_tour) {
      // Find the button for the current tour
      const buttons = dropdownListRef.current.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.trim() === show.show_tour) {
          button.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }
  }, [isDropdownOpen, show?.show_tour]);

  // Effect for auto-scrolling in the Shows dropdown
  React.useEffect(() => {
    // Scroll to the current show when dropdown opens
    if (isShowDatesDropdownOpen && showDatesDropdownListRef.current && showId) {
      // Find the button for the current show
      const buttons = showDatesDropdownListRef.current.querySelectorAll('button');
      for (const button of buttons) {
        if (button.getAttribute('data-show-id') === showId) {
          button.scrollIntoView({ block: 'center' });
          break;
        }
      }
    }
  }, [isShowDatesDropdownOpen, showId]);

  // In the Setlist.jsx component:
  React.useEffect(() => {
    async function fetchShowDates() {
      if (!show?.show_tour) return;
      
      // Clear showDates when tour changes
      setShowDates([]);
      
      try {
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_detail,
            show_alert,
            show_venue_location,
            show_canonid,
            subvenues (
              subvenue_venue,
              venues (
                venue_location
              )
            )
          `)
          .eq('show_tour', show.show_tour)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsLast: true });
    
        if (error) throw error;
    
        const processedShows = data?.map(show => ({
          show_id: show.show_id,
          show_date: show.show_date,
          formatted_show_date: formatInTimeZone(
            new Date(show.show_date), 
            'UTC',
            'MM.dd.yy'
          ),
          show_group: show.show_group,
          show_subvenue: show.show_subvenue,
          show_venue_location: show.show_venue_location,
          show_detail: show.show_detail,
          show_alert: show.show_alert,
          show_rarity_percentage: null,
          total_entry_length: null,
          show_canonid: show.show_canonid
        }));
    
        setShowDates(processedShows || []);
      } catch (error) {
        console.error('Error fetching show dates:', error);
      }
    }
  
    fetchShowDates();
  }, [show?.show_tour, showId]); // Add showId to dependencies

  React.useEffect(() => {
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select('tour, tour_canonid, tour_id')
          .order('tour_canonid', { ascending: true });

        if (error) throw error;
        setTours(data || []);
      } catch (error) {
        console.error('Error fetching tours:', error);
      }
    }

    fetchTours();
  }, []);

  React.useEffect(() => {
    async function fetchSetlist() {
      if (!showId) return;

      try {
        // Fetch show details
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_group,
            show_tour,
            show_subvenue,
            show_venue_location,
            show_detail,
            show_alert,
            show_coachnotes,
            show_canonid,
            show_callbacks,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            ),
            tours!inner(tour_showfields, tour_id)
          `)
          .eq('show_id', showId)
          .single();

        if (showError) throw showError;
        setShow({
          ...showData,
          tour_showfields: showData.tours.tour_showfields,
          show_callbacks: showData.show_callbacks,
          tour_id: showData.tours.tour_id,
          venue_id: showData.subvenues?.venues?.venue_id // Add venue_id from nested query
        });

        // Fetch setlist entries
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_entries')
          .select(`
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_setorder,
            entry_show,
            song_tour_count,
            last_count,
            last_show_id,
            last_show_tour,
            last_show_subvenue,
            last_venue,
            last_venue_location,
            last_show_date,
            times_played,
            shows_since_debut,
            song_rarity_percentage,
            times_played_num,
            shows_since_debut_num,
            songs (
              song_id,
              song_category,
              song_originalartist,
              categories (
                category_canonid
              )
            ),
            setlist_entry_guests(
              guest_id,
              guests(
                guest_displayname,
                guest_canonid,
                guest_instrument
              )
            )
          `)
          .eq('entry_show', showId)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true });
        
        if (setlistError) throw setlistError;
        
        // Transform the data to include guests in the expected format
        const processedSetlist = setlistData?.map(entry => ({
          ...entry,
          song_id: entry.songs?.song_id, // This line needs to be added
          song_category: entry.songs?.song_category,
          song_originalartist: entry.songs?.song_originalartist,
          category_canonid: entry.songs?.categories?.category_canonid,
          guests: entry.setlist_entry_guests?.map(guest => ({
            guest_id: guest.guest_id,
            guest_display_name: guest.guests.guest_displayname,
            guest_canonid: guest.guests.guest_canonid,
            guest_instrument: guest.guests.guest_instrument
          })) || []
        }));
        
        setSetlist(processedSetlist || []);
      } catch (error) {
        console.error('Error fetching setlist:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSetlist();
  }, [showId]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading setlist...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <p className="text-black">Show not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">
          Setlist
        </h1>
        <div className="flex gap-4">
          {hasCoachNotes && (
            <ToggleSwitch
              checked={showCoachNotes}
              onChange={setShowCoachNotes}
            />
          )}
          <div className="relative" ref={showDatesDropdownRef}>
            <div className="md:block">
              <button
                onClick={() => setIsShowDatesDropdownOpen(!isShowDatesDropdownOpen)}
                className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black hover:bg-tertiary transition-colors text-base font-mohr"
              >
                Shows
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {isShowDatesDropdownOpen && (
              <div 
                ref={showDatesDropdownListRef}
                className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto w-64 max-h-96"
              >
                {showDates.map((showDate) => (
                  <button
                    key={showDate.show_id}
                    data-show-id={showDate.show_id}
                    onClick={() => {
                      navigate(`/setlist/${showDate.show_id}`);
                      setIsShowDatesDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${
                      showId === showDate.show_id ? 'bg-[#f9ae37]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="truncate text-black">
                        <span className="font-semibold">
                          {showDate.formatted_show_date} 
                          {showDate.show_venue_location && (
                            <span className="font-normal">
                              {' '}({showDate.show_venue_location})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        {showDate.show_rarity_percentage && (
                          <span className="px-2 py-0.5 bg-canvas rounded border border-black/20 text-black">
                            {showDate.show_rarity_percentage}
                          </span>
                        )}
                        {showDate.total_entry_length && (
                          <span className="px-2 py-0.5 bg-canvas rounded border border-black/20 text-black">
                            {showDate.total_entry_length}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={dropdownRef}>
            <div className="md:hidden">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 rounded-lg bg-[#f9ae37] text-black hover:bg-[#fce7ca]/90 transition-colors border border-black"
              >
                <MapPin className="w-6 h-6" />
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
                Tours
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {isDropdownOpen && (
              <div 
                ref={dropdownListRef}
                className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto w-64 max-h-96"
              >
                {tours.map((tour) => (
                  <button
                    key={tour.tour}
                    onClick={() => {
                      navigate(`/tours/${tour.tour_id}`);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${
                      show?.show_tour === tour.tour ? 'bg-[#f9ae37]' : ''
                    }`}
                  >
                    <span className="text-black">{tour.tour}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Setlist section */}      
      <FullSetlistDisplay 
        setlist={setlist} 
        show={show} 
        showCoachNotes={showCoachNotes}
        showDates={showDates}  // Pass the showDates array
        navigateToVenue={navigateToVenue} // Pass the venue navigation function
        showId={showId}
      />
    </div>
  );
}