import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { Star } from 'lucide-react';
import { VenueSearch } from './VenueSearch';
import VenueSongMatrix from './VenueSongMatrix';

interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_tour: string | null;
  tours: {
    tour_id: string;
  } | null;
  show_detail: string | null;
  show_alert: string | null;
}

interface VenueData {
  venue: string;
  venue_location: string;
  subvenues: {
    subvenue: string;
    show_count: number;
  }[];
}

export function Venue() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [songIdMap, setSongIdMap] = useState<{ [songName: string]: string }>({});
  const [yearIdMap, setYearIdMap] = useState<{ [year: string]: string }>({});
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchVenueData() {
      if (!venueId) return;
      
      try {
        // Decode the venue ID from the URL
        const decodedVenueId = decodeURIComponent(venueId);
        let venueData = null;
        
        // First try to get venue by exact name match
        const { data: venueByName, error: nameError } = await supabase
          .from('venues')
          .select(`
            venue,
            venue_location,
            subvenues (
              subvenue
            )
          `)
          .eq('venue', decodedVenueId);
          
        if (!nameError && venueByName && venueByName.length > 0) {
          venueData = venueByName[0];
        } else {
          // If that fails, check if it looks like a UUID
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (uuidPattern.test(decodedVenueId)) {
            const { data: venueById, error: idError } = await supabase
              .from('venues')
              .select(`
                venue,
                venue_location,
                subvenues (
                  subvenue
                )
              `)
              .eq('venue_id', decodedVenueId);
              
            if (!idError && venueById && venueById.length > 0) {
              venueData = venueById[0];
            }
          }
          
          // If both lookups failed, as a last resort try a partial name match
          if (!venueData) {
            const { data: venueByPartialName, error: partialNameError } = await supabase
              .from('venues')
              .select(`
                venue,
                venue_location,
                subvenues (
                  subvenue
                )
              `)
              .ilike('venue', `%${decodedVenueId}%`);
              
            if (!partialNameError && venueByPartialName && venueByPartialName.length > 0) {
              venueData = venueByPartialName[0];
            }
          }
        }
        
        // If still no data, throw an error
        if (!venueData) {
          throw new Error(`Venue not found: ${decodedVenueId}`);
        }

        // Then get show counts for each subvenue
        const subvenueShowCounts = await Promise.all(
          venueData.subvenues.map(async (sub: any) => {
            const { count } = await supabase
              .from('shows')
              .select('*', { count: 'exact', head: true })
              .eq('show_subvenue', sub.subvenue);
            
            return {
              subvenue: sub.subvenue,
              show_count: count || 0
            };
          })
        );

        // Process venue data
        const processedVenue = {
          venue: venueData.venue,
          venue_location: venueData.venue_location,
          subvenues: subvenueShowCounts
        };

        setVenue(processedVenue);

        // Fetch all shows at this venue
        const { data: showsData, error: showsError } = await supabase
          .from('shows')
          .select(`
            show_id,
            show_date,
            show_group,
            show_subvenue,
            show_tour,
            tours!show_tour(
              tour_id
            ),
            show_detail,
            show_alert
          `)
          .eq('show_subvenue_venue', venueData.venue)
          .order('show_date', { ascending: true });

        if (showsError) throw showsError;
        setShows(showsData || []);
        
        // Fetch song IDs for navigation in the song matrix
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('song, song_id');
        
        if (songsError) throw songsError;
        
        // Build a map of song names to song IDs
        const songMap: { [songName: string]: string } = {};
        if (songsData) {
          songsData.forEach(song => {
            songMap[song.song] = song.song_id;
          });
        }
        setSongIdMap(songMap);
        
        // Fetch year IDs for navigation in the song matrix
        const { data: yearsData, error: yearsError } = await supabase
          .from('years')
          .select('year, year_id');
        
        if (yearsError) throw yearsError;
        
        // Build a map of years to year IDs
        const yearMap: { [year: string]: string } = {};
        if (yearsData) {
          yearsData.forEach(yearData => {
            yearMap[yearData.year] = yearData.year_id;
          });
        }
        setYearIdMap(yearMap);
      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenueData();
  }, [venueId]);

  useEffect(() => {
    const fetchShowRatings = async () => {
      if (shows.length === 0) return;
      
      try {
        const showIds = shows.map(s => s.show_id);
        
        const { data, error } = await supabase
          .from('show_ratings')
          .select('show_id, rating')
          .in('show_id', showIds);
        
        if (error) throw error;
        
        // Calculate averages for each show
        const ratings: Record<string, number> = {};
        shows.forEach(show => {
          const showRatingsData = data?.filter(r => r.show_id === show.show_id) || [];
          if (showRatingsData.length > 0) {
            const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
            ratings[show.show_id] = Math.round(average * 100) / 100;
          } else {
            ratings[show.show_id] = 0;
          }
        });
        
        setShowRatings(ratings);
      } catch (error) {
        console.error('Error fetching show ratings:', error);
      }
    };
    
    fetchShowRatings();
  }, [shows]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-tertiary animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading venue data...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <p className="text-fifth">Venue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[936px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 mb-1 mr-2">
          <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">
            {venue.venue}
          </h2>
          {venue.venue_location && (
            <div className="bg-secondary text-fifth text-xs font-medium px-2 py-1 rounded-lg border border-secondary whitespace-nowrap">
              {venue.venue_location}
            </div>
          )}
        </div>
        <VenueSearch />
      </div>

      <div className="space-y-4 mb-8">
        {/* Shows List */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">Shows</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-canvas border-y border-secondary/10">
                  <th className="px-4 py-2 text-center text-s font-semibold text-fifth w-12">Date</th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Group</th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Venue</th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Tour</th>
                  <th className="px-4 py-2 text-center text-s font-semibold text-fifth">Rating</th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-fifth">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {shows.map((show, index) => (
                  <tr
                    key={show.show_id}
                    className={`${
                      index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-tertiary/40 transition-colors text-xs`}
                  >
                    <td className="px-4 py-1 text-fifth whitespace-nowrap text-center">
                      <button
                        onClick={() => navigate(`/setlist/${show.show_id}`)}
                        className="font-medium hover:underline transition-colors table-link"
                      >
                        {formatInTimeZone(
                          new Date(show.show_date),
                          'UTC',
                          'MM.dd.yy'
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">
                      {show.show_group}
                    </td>
                    <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">
                      {show.show_subvenue}
                    </td>
                    <td className="px-4 py-1 text-fifth font-light whitespace-nowrap">
                      {show.show_tour && (
                        <button
                          onClick={() => navigate(`/tours/${show.tours?.tour_id}`)}
                          className="hover:underline transition-colors"
                        >
                          {show.show_tour}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-1 text-fifth whitespace-nowrap">
                      <div className="relative flex items-center justify-center group">
                        {/* Stars with hover-based transparency */}
                        <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-30' : ''}`}>
                          {[1, 2, 3, 4, 5].map((starNumber) => {
                            const rating = showRatings[show.show_id] || 0;
                            const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

                            return (
                              <div key={starNumber} className="relative">
                                {/* Background star (empty) */}
                                <Star
                                  size={16}
                                  className="text-secondary"
                                  fill="none"
                                  stroke="currentColor"
                                />
                                {/* Foreground star (filled) */}
                                <div
                                  className="absolute inset-0 overflow-hidden"
                                  style={{ width: `${fillPercentage * 100}%` }}
                                >
                                  <Star
                                    size={16}
                                    className="text-tertiary"
                                    fill="currentColor"
                                    stroke="currentColor"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Rating text overlaid on stars - only visible on hover */}
                        {showRatings[show.show_id] > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-fifth pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            {showRatings[show.show_id].toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-1 text-fifth whitespace-nowrap">
                      {show.show_detail && show.show_detail}
                      {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
                      {show.show_alert && 
                        <span className="text-red-600 font-medium">
                          [{show.show_alert}]
                        </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Venue Song Matrix */}
        {shows.length > 0 && (
          <div className="overflow-x-auto">
            <VenueSongMatrix 
              shows={shows}
              songIdMap={songIdMap}
              yearIdMap={yearIdMap}
            />
          </div>
        )}
      </div>
    </div>
  );
}