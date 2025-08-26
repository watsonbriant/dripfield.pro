import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';

interface VenueBasic {
  subvenue: string;
  subvenue_venue: string;
  subvenue_venue_location: string;
  venue_id: string; // Added venue_id field
}

interface VenueSearchProps {
  className?: string;
  onModalStateChange?: (isOpen: boolean) => void;
}

export function VenueSearch({ className = '', onModalStateChange }: VenueSearchProps) {
  const navigate = useNavigate();
  const [allVenues, setAllVenues] = React.useState<VenueBasic[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleModalOpen = () => {
    setIsModalOpen(true);
    onModalStateChange?.(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    onModalStateChange?.(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    async function fetchAllVenues() {
      try {
        // Join with venues table to get venue_id
        const { data, error } = await supabase
          .from('subvenues')
          .select(`
            subvenue, 
            subvenue_venue, 
            subvenue_venue_location,
            venues!inner (
              venue_id
            )
          `)
          .order('subvenue', { ascending: true });
    
        if (error) throw error;
        
        // Transform the joined data to include venue_id
        const processedData = data?.map(venue => ({
          subvenue: venue.subvenue,
          subvenue_venue: venue.subvenue_venue,
          subvenue_venue_location: venue.subvenue_venue_location,
          venue_id: venue.venues.venue_id
        })) || [];
        
        setAllVenues(processedData);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    }

    fetchAllVenues();
  }, []);

  const filteredVenues = React.useMemo(() => {
    return allVenues.filter(venue =>
      venue.subvenue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.subvenue_venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.subvenue_venue_location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allVenues, searchTerm]);

  const handleVenueSelect = (venue: VenueBasic) => {
    // Don't set the selected venue to keep showing "Search Venues"
    setSelectedVenue('');
    setIsDropdownOpen(false);
    setIsModalOpen(false);
    setSearchTerm('');
    // Use venue_id for navigation instead of subvenue_venue
    navigate(`/venue/${venue.venue_id}`);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="md:hidden">
        <button
          onClick={handleModalOpen}
          className="p-2 rounded-md bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title="Select Venue"
        >
          <div className="space-y-0">
            <div className="sticky -top-4 bg-primary pb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search venues..."
                className="w-full px-4 py-2 rounded-md border border-secondary bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
            <div className="divide-y divide-black/10">
              {filteredVenues.map((venue) => (
                <button
                  key={`${venue.subvenue}-${venue.subvenue_venue}`}
                  onClick={() => handleVenueSelect(venue)}
                  className="w-full text-left px-4 py-1 text-sm rounded-md hover:bg-black/10 transition-colors font-semibold text-fifth"
                >
                  <span>
                    {venue.subvenue}
                    {venue.subvenue_venue_location && (
                      <>
                        <span className="text-fifth/70">&nbsp;&nbsp;&nbsp;</span>
                        <span className="text-fifth/90 text-xs font-light ml-2">{venue.subvenue_venue_location}</span>
                      </>
                    )}
                  </span>
                </button>
              ))}
              {filteredVenues.length === 0 && (
                <div className="px-4 py-2 text-sm text-fifth/60 italic">
                  No venues found
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
      <div className="hidden md:block">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
        >
          {selectedVenue || 'Search'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-[9999] overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-96 max-h-96'
        }`}>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search venues..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-fifth text-sm focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {filteredVenues.map((venue) => (
              <button
                key={`${venue.subvenue}-${venue.subvenue_venue}`}
                onClick={() => handleVenueSelect(venue)}
                className="w-full text-left px-4 py-1 text-sm text-fifth leading-[1rem] font-medium hover:bg-canvas transition-colors"
              >
                {venue.subvenue}
                {venue.subvenue_venue_location && (
                  <>
                    <span className="text-fifth/70">&nbsp;&nbsp;&nbsp;</span>
                    <span className="text-fifth/90 text-xs font-light ml-2">{venue.subvenue_venue_location}</span>
                  </>
                )}
              </button>
            ))}
            {filteredVenues.length === 0 && (
              <div className="px-4 py-2 text-sm text-fifth/60 italic">
                No venues found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}