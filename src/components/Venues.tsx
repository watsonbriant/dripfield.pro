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
    async function fetchVenues() {
      try {
        // Set initial loading progress
        setLoadingProgress(5);

        // Fetch all subvenues joined with their parent venues to get venue_id
        // Using a join query to get venue_id from the venues table
        const { data: subvenues, error: subvenuesError } = await supabase
          .from('subvenues')
          .select(`
            subvenue,
            subvenue_venue,
            subvenue_venue_location,
            venues!inner (
              venue_id
            )
          `)
          .order(sortField === 'subvenue' ? 'subvenue' : 
                 sortField === 'subvenue_venue_location' ? 'subvenue_venue_location' : 
                 'subvenue', 
                { ascending: sortDirection === 'asc' });
        
        if (subvenuesError) throw subvenuesError;
        
        // Update progress after fetching venue data
        setLoadingProgress(30);
        
        // If no venues, complete loading
        if (!subvenues || subvenues.length === 0) {
          setVenues([]);
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500); // Small delay for animation
          return;
        }

        // Process venues in batches to update progress
        const batchSize = Math.max(1, Math.floor(subvenues.length / 10)); // Process roughly in 10 batches
        const processedVenues = [];
        
        for (let i = 0; i < subvenues.length; i += batchSize) {
          const batch = subvenues.slice(i, i + batchSize);
          
          // Process this batch
          const batchResults = await Promise.all(
            batch.map(async (subvenue) => {
              const [gooseShows, otherShows] = await Promise.all([
                supabase
                  .from('shows')
                  .select('count', { count: 'exact' })
                  .eq('show_group', 'Goose')
                  .eq('show_subvenue_venue', subvenue.subvenue_venue),
                supabase
                  .from('shows')
                  .select('count', { count: 'exact' })
                  .neq('show_group', 'Goose')
                  .eq('show_subvenue_venue', subvenue.subvenue_venue)
              ]);
          
              return {
                subvenue: subvenue.subvenue,
                subvenue_venue: subvenue.subvenue_venue,
                subvenue_venue_location: subvenue.subvenue_venue_location,
                venue_id: subvenue.venues.venue_id, // Get venue_id from the joined venues table
                goose_show_count: gooseShows.count || 0,
                other_show_count: otherShows.count || 0
              };
            })
          );
          
          processedVenues.push(...batchResults);
          
          // Update loading progress based on how much we've processed
          const progressPercentage = 30 + (i + batch.length) / subvenues.length * 60;
          setLoadingProgress(Math.min(90, Math.round(progressPercentage)));
        }
        
        let sortedVenues = [...processedVenues];
        
        // Sort after fetching when sorting by show counts (which aren't in the DB query)
        if (sortField === 'goose_show_count' || sortField === 'other_show_count') {
          sortedVenues.sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];
            
            if (sortDirection === 'asc') {
              return valueA - valueB;
            } else {
              return valueB - valueA;
            }
          });
        }
        
        // Complete loading
        setLoadingProgress(100);
        setVenues(sortedVenues);
        
        // Small delay before removing the loading screen for smooth transition
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
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return null; // Return null instead of an empty div
    }
    
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline-block ml-1" />
    );
  };

  // CircularProgress component
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
            stroke="#3c3545" 
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius} 
            fill="transparent" 
            stroke="#fce7ca" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute text-lg font-bold text-[#fce7ca]">
          {Math.round(value)}%
        </div>
      </div>
    );
  };

  // If loading, show the loading state with circular progress
  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Venues</h1>
          <VenueSearch />
        </div>
        
        <div className="text-center py-12">
          <CircularProgress value={loadingProgress} />
          <p className="text-[#fce7ca]/70 mt-4">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Venues</h1>
        <VenueSearch />
      </div>
      
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
        {venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#fce7ca]/70">No venues found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-[#0e151b] border-y border-white/10">
                    <th 
                      className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('subvenue')}
                    >
                      Venue <SortIcon field="subvenue" />
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('subvenue_venue_location')}
                    >
                      Location <SortIcon field="subvenue_venue_location" />
                    </th>
                    <th 
                      className="px-4 py-2 text-s font-semibold text-white/90 cursor-pointer"
                      onClick={() => handleSort('goose_show_count')}
                    >
                      <div className="flex items-center justify-center">
                        <img src={gooseLogo} alt="goose" className="h-6" />
                        {sortField === 'goose_show_count' && (
                          <SortIcon field="goose_show_count" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-center text-s font-semibold text-white/90 cursor-pointer"
                      onClick={() => handleSort('other_show_count')}
                    >
                      <div className="flex items-center justify-center">
                        Other
                        {sortField === 'other_show_count' && (
                          <SortIcon field="other_show_count" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {venues.map((venue, index) => (
                    <tr
                      key={venue.subvenue}
                      className={`${
                        index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                      } hover:bg-white/10 transition-colors text-xs cursor-pointer`}
                      onClick={() => navigate(`/venue/${venue.venue_id}`)}
                    >
                      <td className="px-4 py-1 text-[#fce7ca]/90 font-semibold whitespace-nowrap">
                        <span className="hover:underline">
                          {venue.subvenue}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                        {venue.subvenue_venue_location}
                      </td>
                      <td className="px-4 py-1 text-[#fce7ca]/90 text-center whitespace-nowrap">
                        {venue.goose_show_count}
                      </td>
                      <td className="px-4 py-1 text-[#fce7ca]/90 text-center whitespace-nowrap">
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