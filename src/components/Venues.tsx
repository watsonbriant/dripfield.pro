import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronUp, ChevronDown } from 'lucide-react';
import gooseLogo from '../img/Goose.png';
import { VenueSearch } from './VenueSearch';

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
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 inline-block ml-1 text-black" /> :
      <ChevronDown className="w-4 h-4 inline-block ml-1 text-black" />;
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
            stroke="#f9ae37" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute text-lg font-bold text-black">
          {Math.round(value)}%
        </div>
      </div>
    );
  };

  // If loading, show the loading state with circular progress
  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Venues</h1>
          <VenueSearch />
        </div>
        
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <CircularProgress value={loadingProgress} />
          <p className="text-black mt-4">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Venues</h1>
        <VenueSearch />
      </div>
      
      <div className="bg-primary border border-black rounded-lg p-3">
        {venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black">No venues found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    <th 
                      className="px-4 py-1 text-left text-s font-bold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('subvenue')}
                    >
                      <div className="flex items-center gap-1">
                        Venue
                        {getSortIcon('subvenue')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('subvenue_venue_location')}
                    >
                      <div className="flex items-center gap-1">
                        Location
                        {getSortIcon('subvenue_venue_location')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-1 text-center text-s font-semibold text-black cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('goose_show_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <img src={gooseLogo} alt="goose" className="h-6" />
                        {getSortIcon('goose_show_count')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-1 text-center text-s font-semibold text-black cursor-pointer hover:bg-black/10"
                      onClick={() => handleSort('other_show_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Other
                        {getSortIcon('other_show_count')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {venues.map((venue, index) => (
                    <tr
                      key={venue.subvenue}
                      className={`${
                        index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                      } hover:bg-black/10 transition-colors text-xs cursor-pointer`}
                      onClick={() => navigate(`/venue/${venue.venue_id}`)}
                    >
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        <span className="font-semibold hover:text-[#a9682e] transition-colors table-link">
                          {venue.subvenue}
                        </span>
                      </td>
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        {venue.subvenue_venue_location}
                      </td>
                      <td className="px-4 py-0.5 text-black text-center whitespace-nowrap">
                        {venue.goose_show_count}
                      </td>
                      <td className="px-4 py-0.5 text-black text-center whitespace-nowrap">
                        {venue.other_show_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}