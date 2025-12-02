import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronUp, ChevronDown } from 'lucide-react';
import gooseLogo from '../img/Goose2.png';
import { VenueSearch } from './VenueSearch';
import { VenueMap } from './VenueMap';

interface Venue {
  subvenue: string;
  subvenue_venue: string;
  subvenue_venue_location: string;
  venue_id: string; // This is the venue_id from the venues table
  goose_show_count: number;
  other_show_count: number;
}

type SortField = 'subvenue' | 'subvenue_venue_location' | 'goose_show_count' | 'other_show_count';
type SortDirection = 'asc' | 'desc';

export function Venues() {
  const navigate = useNavigate();
  const [venues, setVenues] = React.useState<Venue[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [sortField, setSortField] = React.useState<SortField>('subvenue');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Inside your Venues component, replace the existing fetchVenues function with:
    async function fetchVenues() {
      try {
        // Set initial loading progress
        setLoadingProgress(5);

        // Call the database function directly with the sort parameters
        const { data: venueData, error } = await supabase
          .rpc('get_venues_with_show_counts', {
            sort_field: sortField,
            sort_direction: sortDirection
          });
        
        if (error) throw error;
        
        // Update progress after fetching venue data
        setLoadingProgress(90);
        
        // Set venues directly from the function result
        setVenues(venueData || []);
        
        // Complete loading
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }

    fetchVenues();
  }, [sortField, sortDirection]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Updated CircularProgress component with new color scheme
  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - value / 100);
    
    return (
      <div className="relative inline-flex justify-center items-center">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#e0e0e0" 
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#8ec1b6" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute text-lg font-bold text-fifth">
          {Math.round(value)}%
        </div>
      </div>
    );
  };

  // If loading, show the loading state with circular progress
  if (loading) {
    return (
      <div className="w-full max-w-[1280px]">
        <div className="mb-4">
          <div className="bg-primary border border-fourth">
            <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
              <h1 className="text-sm font-semibold pl-2">
                Venues
              </h1>
              <VenueSearch />
            </div>
          </div>
        </div>
        
        <div className="text-center py-12 bg-primary border border-fourth">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px]">
      <div className="mb-4">
        <div className="bg-primary border border-fourth">
          <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
            <h1 className="text-sm font-semibold pl-2">
              Venues
            </h1>
            <VenueSearch 
              onModalStateChange={setIsSearchModalOpen}
            />
          </div>
        </div>
      </div>
      
      {/* Map Container - hide when search modal is open on mobile */}
      <div className={`${isSearchModalOpen ? 'md:block hidden' : 'block'}`}>
        <VenueMap onVenueClick={(venueId) => navigate(`/venue/${venueId}`)} />
      </div>
      
      {/* List Container */}
      <div className="bg-primary border border-fourth">
        {venues.length === 0 ? (
          <div className="p-2 text-center">
            <p className="text-[0.625rem] text-fifth">No venues found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-fourth border-y border-fourth">
                  <th 
                    className="px-2 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('subvenue')}
                  >
                    <div className="flex items-center gap-1">
                      Venue
                    </div>
                  </th>
                  <th 
                    className="px-2 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('subvenue_venue_location')}
                  >
                    <div className="flex items-center gap-1">
                      Location
                    </div>
                  </th>
                  <th 
                    className="px-2 text-center text-xs font-medium text-white cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('goose_show_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <img src={gooseLogo} alt="goose" className="h-4" />
                    </div>
                  </th>
                  <th 
                    className="px-2 text-center text-xs font-medium text-white cursor-pointer hover:bg-white/20"
                    onClick={() => handleSort('other_show_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Other
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {venues.map((venue, index) => (
                  <tr
                    key={venue.subvenue}
                    className={`${
                      index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                    } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                  >
                    <td className="px-2 text-fifth whitespace-nowrap">
                      <Link
                        to={`/venue/${venue.venue_id}`}
                        className="font-medium hover:underline transition-colors table-link"
                      >
                        {venue.subvenue}
                      </Link>
                    </td>
                    <td className="px-2 text-fifth font-light whitespace-nowrap">
                      {venue.subvenue_venue_location}
                    </td>
                    <td className="px-2 text-fifth font-light text-center whitespace-nowrap">
                      {venue.goose_show_count}
                    </td>
                    <td className="px-2 text-fifth font-light text-center whitespace-nowrap">
                      {venue.other_show_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}