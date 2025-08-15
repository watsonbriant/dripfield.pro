import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GuestSearch } from './GuestSearch';
import GuestPerformanceChart from './GuestPerformanceChart';
import { SongsPlayed } from './SongsPlayed';

interface SongShowMap {
  [songName: string]: string[]; // Maps song names to array of show_ids
}

interface GuestInfo {
  guest: string;
  guest_category: string;
  guest_instrument: string;
  guest_displayname: string;
}

interface Performance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_tour: string | null;
  tour_id: string | null;
  venue_id: string;
}

// CircularProgress component for reuse
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
          stroke="#f9ae37" 
          strokeWidth="8"
          strokeOpacity="0.3"
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

export function Guest() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [previousGuestId, setPreviousGuestId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [songShowMap, setSongShowMap] = useState<SongShowMap>({});

  useEffect(() => {
    // If the guestId parameter changes, set loading to true
    if (guestId !== previousGuestId) {
      setLoading(true);
      setLoadingProgress(0);
      setPreviousGuestId(guestId || null);
    }

    async function fetchGuestData() {
      if (!guestId) return;

      try {
        setLoadingProgress(5);
        
        // First get the guest info
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .select(`
            guest,
            guest_category,
            guest_instrument,
            guest_displayname
          `)
          .eq('guest_id', guestId)
          .single();

        if (guestError) throw guestError;
        setGuest(guestData);
        setLoadingProgress(20);

        // Reset selected group when changing guests
        setSelectedGroup(null);

        // Then get all performances - with pagination handling
        let allShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data: showsData, error: showsError, count } = await supabase
            .from('setlist_entry_guests')
            .select(`
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_show,
                shows:entry_show(
                  show_id,
                  show_date,
                  show_group,
                  show_subvenue,
                  show_venue_location,
                  show_tour,
                  tours:show_tour(
                    tour_id
                  ),
                  subvenues:show_subvenue(
                    subvenue,
                    subvenue_venue,
                    venues:subvenue_venue(
                      venue,
                      venue_id
                    )
                  )
                )
              )
            `, { count: 'exact' })
            .eq('guest_id', guestId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (showsError) throw showsError;
          
          if (showsData && showsData.length > 0) {
            allShows = [...allShows, ...showsData];
            page++;
            
            // Update progress based on pagination
            // Reserve 20-70% of progress for this step
            const paginationProgress = 20 + (page * 10);
            setLoadingProgress(Math.min(70, paginationProgress));
            
            // If we got fewer records than the page size, we're done
            hasMore = showsData.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(75);
        
        // Process the joined data to get unique shows
        const uniqueShowsMap = {};

        allShows.forEach(item => {
          if (item.setlist_entries && item.setlist_entries.shows) {
            const show = item.setlist_entries.shows;
            
            // Extract venue_id from the nested relationship
            const venueId = show.subvenues?.venues?.venue_id || '';
            const tourId = show.tours?.tour_id || null;  // Add this line

            // Use show_id as the key to ensure uniqueness
            uniqueShowsMap[show.show_id] = {
              show_id: show.show_id,
              show_date: show.show_date,
              show_group: show.show_group || '',
              show_subvenue: show.show_subvenue || '',
              show_venue_location: show.show_venue_location || '',
              show_tour: show.show_tour || null,
              tour_id: tourId,  // Add this line
              venue_id: venueId
            };
          }
        });
        
        // Convert to array
        const uniqueShows = Object.values(uniqueShowsMap);
        
        // Log shows by year
        const showsByYear = {};
        uniqueShows.forEach(show => {
          const year = show.show_date.split('-')[0];
          showsByYear[year] = (showsByYear[year] || 0) + 1;
        });
        
        // Sort by date string
        uniqueShows.sort((a, b) => a.show_date.localeCompare(b.show_date));
        
        setPerformances(uniqueShows);
        setLoadingProgress(90);
      } catch (error) {
        console.error('Error fetching guest data:', error);
      }
    }

    async function fetchSongShowMap() {
      if (!guestId) return;
      
      try {
        
        let allEntries = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('setlist_entry_guests')
            .select(`
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_song,
                entry_show,
                songs:entry_song(
                  song
                )
              )
            `)
            .eq('guest_id', guestId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        // Process data to map songs to shows
        const songShowMapping: SongShowMap = {};
        
        allEntries.forEach(item => {
          if (item.setlist_entries?.songs?.song && item.setlist_entries?.entry_show) {
            const songName = item.setlist_entries.songs.song;
            const showId = item.setlist_entries.entry_show;
            
            if (!songShowMapping[songName]) {
              songShowMapping[songName] = [];
            }
            
            if (!songShowMapping[songName].includes(showId)) {
              songShowMapping[songName].push(showId);
            }
          }
        });
        
        setSongShowMap(songShowMapping);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching song-show map:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }
    
    // Run both fetches together
    if (guestId) {
      // Sequential fetching to track progress better
      fetchGuestData().then(() => fetchSongShowMap());
    }
  }, [guestId]);

  // Handle group selection
  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const handleSongClick = (song: string) => {
    setSelectedSong(currentSong => currentSong === song ? null : song);
  };

  // Full page loading state with pulses instead of circular progress
  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading guest data...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <p className="text-black">Guest not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[936px] mx-auto">
      <div className="flex justify-between">
        <h2 className="text-2xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">
          {guest.guest}
        </h2>
        <GuestSearch />
      </div>
      
      {guest.guest_instrument && (
        <div className="mb-4">
          <div className="text-black text-sm font-semibold">{guest.guest_instrument}</div>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {/* Top row with Song List and Performances by Group side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Song List - Only show if there are performances */}
          {performances.length > 0 && (
            <div className="h-full">
              <div className="bg-primary rounded-lg p-3 border border-black w-full h-full">
                <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">Songs Played</h2>
                <div className="max-h-[320px] overflow-y-auto">
                  <SongsPlayed 
                    guestId={guestId} 
                    isLoading={loading} 
                    selectedSong={selectedSong}
                    onSongClick={handleSongClick}
                    CircularProgress={CircularProgress}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Performances by Group */}
          {performances.length > 0 ? (
            <div className="h-full">
              <div className="bg-primary rounded-lg p-3 border border-black w-full h-full">
                <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">Shows by Group</h2>
                <div className="max-h-[320px] overflow-y-auto">
                  <div className="space-y-1">
                    {Object.entries(
                      performances.reduce((acc, show) => {
                        const group = show.show_group || 'Unknown';
                        acc[group] = (acc[group] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([groupA, countA], [groupB, countB]) => {
                        // First sort by count (descending)
                        if (countB !== countA) {
                          return countB - countA;
                        }
                        // Then by group name (alphabetically)
                        return groupA.localeCompare(groupB);
                      })
                      .map(([group, count]) => (
                        <div 
                          key={group} 
                          className={`text-black text-sm flex justify-between font-semibold cursor-pointer ${
                            selectedGroup === group ? 'bg-[#f9ae37]/40' : 'hover:bg-[#f9ae37]/20'
                          }`}
                          onClick={() => handleGroupClick(group)}
                        >
                          <span>{group}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Performance Chart */}
        {performances.length > 0 ? (
          <div className="overflow-x-auto">
            <GuestPerformanceChart 
              performances={performances} 
              selectedGroup={selectedGroup}
              selectedSong={selectedSong}
              songShowMap={songShowMap}
            />
          </div>
        ) : (
          <div className="bg-primary border border-black rounded-lg p-4">
            <p className="text-black text-center">
              <span className="font-semibold">{guest.guest}</span> hasn't performed as a guest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}