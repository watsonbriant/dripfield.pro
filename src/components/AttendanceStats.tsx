import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Building2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface TourCount {
  tour: string;
  count: number;
  tour_canonid: number;
  tour_id: string;
}

interface AttendanceStatsData {
  showsCount: number;
  venuesCount: number;
  songsCount: number;
  tourCounts: TourCount[];
}

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
          stroke="#e5e5e5" 
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

interface AttendanceStatsProps {
  userId?: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showsCount, setShowsCount] = useState<number>(0);
  const [venuesCount, setVenuesCount] = useState<number>(0);
  const [songsCount, setsongsCount] = useState<number>(0);
  const [tourCounts, setTourCounts] = useState<TourCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Fetch username if viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            return;
          }
          
          if (data?.username) {
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Error in username fetch:', error);
        }
      };
      
      fetchUsername();
    }
  }, [userId, isOwnProfile, user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        if (!effectiveUserId) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }

        // Get user's attended shows with pagination
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            // Update progress based on pagination (5-20%)
            setLoadingProgress(Math.min(20, 5 + (page * 3)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(22);
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }

        // Extract show IDs
        const showIds = allAttendedShows.map(record => record.show_id);
        
        // Count total shows
        setShowsCount(showIds.length);
        setLoadingProgress(25);

        // Split showIds into chunks for processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        setLoadingProgress(30);

        // Count unique venues with pagination and chunking
        let allVenueData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('shows')
              .select(`
                show_id,
                show_subvenue,
                subvenues(
                  subvenue_venue,
                  venues(venue)
                )
              `)
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allVenueData = [...allVenueData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (30-50%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(50, 30 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        // Get unique venues
        const uniqueVenues = new Set();
        allVenueData.forEach(show => {
          if (show.subvenues && show.subvenues.subvenue_venue) {
            uniqueVenues.add(show.subvenues.subvenue_venue);
          }
        });
        
        setVenuesCount(uniqueVenues.size);
        setLoadingProgress(55);
        
        // Count unique songs with pagination and chunking
        let allSongData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('setlist_entries')
              .select('entry_song')
              .in('entry_show', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allSongData = [...allSongData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (55-75%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(75, 55 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        // Get unique songs
        const uniqueSongs = new Set();
        allSongData.forEach(entry => {
          if (entry.entry_song) {
            uniqueSongs.add(entry.entry_song);
          }
        });
        
        setsongsCount(uniqueSongs.size);
        setLoadingProgress(80);

        // Get tour counts with pagination and chunking
        let allTourData = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('shows')
              .select(`
                show_id,
                show_tour,
                tours(
                  tour,
                  tour_canonid,
                  tour_id
                )
              `)
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allTourData = [...allTourData, ...data];
              page++;
              
              // Update progress based on pagination and chunks (80-95%)
              const progressPerChunk = 15 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 15;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(95, 80 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }

        // Count shows per tour
        const tourCountMap: Record<string, { count: number; tour: string; tour_canonid: number; tour_id: string }> = {};

        allTourData.forEach(show => {
          if (show.show_tour && show.tours) {
            const tourName = show.tours.tour;
            const canonId = show.tours.tour_canonid;
            const tourId = show.tours.tour_id;
            
            if (!tourCountMap[tourName]) {
              tourCountMap[tourName] = { 
                count: 0,
                tour: tourName,
                tour_canonid: canonId || 0,
                tour_id: tourId
              };
            }
            
            tourCountMap[tourName].count += 1;
          }
        });
        
        // Convert to array and sort by tour_canonid
        const sortedTours = Object.values(tourCountMap).sort(
          (a, b) => a.tour_canonid - b.tour_canonid
        );
        
        setTourCounts(sortedTours);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
        
      } catch (error) {
        console.error('Error fetching attendance stats:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchStats();
  }, [effectiveUserId]);

  // Get appropriately personalized text based on profile ownership
  const getTitle = () => {
    if (isOwnProfile) {
      return "Attendance Stats";
    } else if (username) {
      return `Attendance Stats`;
    } else {
      return "Attendance Stats";
    }
  };

  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading stats...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} stats...`;
    }
  };

  const getShowsLabel = () => {
    if (isOwnProfile) {
      return "Shows Attended";
    } else {
      return "Shows Attended";
    }
  };

  const getVenuesLabel = () => {
    if (isOwnProfile) {
      return "Venues Visited";
    } else {
      return "Venues Visited";
    }
  };

  const getSongsLabel = () => {
    if (isOwnProfile) {
      return "Songs Seen";
    } else {
      return "Songs Seen";
    }
  };

  const getToursLabel = () => {
    if (isOwnProfile) {
      return "Tours Attended";
    } else {
      return "Tours Attended";
    }
  };

  const getNoToursMessage = () => {
    if (isOwnProfile) {
      return "No tour data available";
    } else if (username) {
      return `${username} hasn't attended any tours yet`;
    } else {
      return "No tour data available";
    }
  };

  return (
    <div className="bg-primary p-4 rounded-lg border border-black">
      <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-3">{getTitle()}</h3>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-black mt-4">{getLoadingMessage()}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Desktop view - cards */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            <div className="bg-canvas p-3 rounded-md relative border border-black">
              <div className="text-black text-sm font-semibold">{getShowsLabel()}</div>
              <div className="text-2xl font-bold text-black mt-1">{showsCount}</div>
              <Calendar className="h-5 w-5 text-[#a9682e] absolute bottom-2 right-2" />
            </div>
            <div className="bg-canvas p-3 rounded-md relative border border-black">
              <div className="text-black text-sm font-semibold">{getVenuesLabel()}</div>
              <div className="text-2xl font-bold text-black mt-1">{venuesCount}</div>
              <Building2 className="h-5 w-5 text-[#a9682e] absolute bottom-2 right-2" />
            </div>
            <div className="bg-canvas p-3 rounded-md relative border border-black">
              <div className="text-black text-sm font-semibold">{getSongsLabel()}</div>
              <div className="text-2xl font-bold text-black mt-1">{songsCount}</div>
              <Music className="h-5 w-5 text-[#a9682e] absolute bottom-2 right-2" />
            </div>
          </div>
          
          {/* Mobile view - list */}
          <div className="md:hidden space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Calendar className="h-4 w-4 text-[#a9682e] mr-2" />
                <span className="text-[#f9ae37] font-semibold">{showsCount}</span>
                <span className="text-black font-semibold ml-2">{getShowsLabel()}</span>
              </li>
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-[#a9682e] mr-2" />
                <span className="text-[#f9ae37] font-semibold">{venuesCount}</span>
                <span className="text-black font-semibold ml-2">{getVenuesLabel()}</span>
              </li>
              <li className="flex items-center">
                <Music className="h-4 w-4 text-[#a9682e] mr-2" />
                <span className="text-[#f9ae37] font-semibold">{songsCount}</span>
                <span className="text-black font-semibold ml-2">{getSongsLabel()}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-3">{getToursLabel()}</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
              {tourCounts.length === 0 ? (
                <p className="text-black/60 italic">{getNoToursMessage()}</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {tourCounts.map((tour) => (
                    <li 
                      key={tour.tour}
                      className="text-left"
                    >
                      <button 
                        onClick={() => navigate(`/tours/${tour.tour_id}`)}
                        className="text-black hover:text-[#a9682e] hover:underline font-semibold"
                      >
                        {tour.tour}
                      </button>
                      <span className="text-black/90 ml-2">({tour.count})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStats;