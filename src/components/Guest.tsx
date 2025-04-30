import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
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
        console.log("Fetching data for guest ID:", guestId);
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
        
        console.log("Guest data:", guestData);

        // Reset selected group when changing guests
        setSelectedGroup(null);

        // Then get all performances - with pagination handling
        let allShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          console.log(`Fetching page ${page} of guest performances...`);
          
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
                  show_tour
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
        console.log(`Fetched a total of ${allShows.length} guest performances across ${page} pages`);
        
        // Process the joined data to get unique shows
        const uniqueShowsMap = {};
        
        allShows.forEach(item => {
          if (item.setlist_entries && item.setlist_entries.shows) {
            const show = item.setlist_entries.shows;
            
            // Use show_id as the key to ensure uniqueness
            uniqueShowsMap[show.show_id] = {
              show_id: show.show_id,
              show_date: show.show_date,
              show_group: show.show_group || '',
              show_subvenue: show.show_subvenue || '',
              show_venue_location: show.show_venue_location || '',
              show_tour: show.show_tour || null
            };
          }
        });
        
        // Convert to array
        const uniqueShows = Object.values(uniqueShowsMap);
        
        console.log("Processed unique shows:", uniqueShows.length);
        
        // Log shows by year
        const showsByYear = {};
        uniqueShows.forEach(show => {
          const year = show.show_date.split('-')[0];
          showsByYear[year] = (showsByYear[year] || 0) + 1;
        });
        console.log("Shows by year:", showsByYear);
        
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
        console.log("Fetching song-to-show mapping for guest ID:", guestId);
        
        let allEntries = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          console.log(`Fetching page ${page} of song-to-show mapping...`);
          
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
        
        console.log(`Mapped ${Object.keys(songShowMapping).length} songs to their shows`);
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

  // Full page loading state with circular progress
  if (loading) {
    return (
      <div className="max-w-[872px] mx-auto">
        <div className="text-center py-12">
          <CircularProgress value={loadingProgress} />
          <p className="text-[#fce7ca]/70 mt-4">Loading guest data...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="max-w-[872px] mx-auto">
        <div className="text-center py-12">
          <p className="text-[#fce7ca]/70">Guest not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[872px] mx-auto">
      <div className="flex justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {guest.guest}
        </h1>
        <GuestSearch />
      </div>
      
      {guest.guest_instrument && (
        <div className="mt-2">
          <div className="text-[#fce7ca] text-sm font-semibold">{guest.guest_instrument}</div>
        </div>
      )}

      <div className="mt-6 mb-8 space-y-6">
        {/* Top row with Song List and Performances by Group side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Song List - Only show if there are performances */}
            {performances.length > 0 && (
              <SongsPlayed 
                guestId={guestId} 
                isLoading={loading} 
                selectedSong={selectedSong}
                onSongClick={handleSongClick}
                CircularProgress={CircularProgress}
              />
            )}

          {/* Performances by Group */}
          {performances.length > 0 ? (
            <div className="bg-[#172330] border border-white/10 rounded-lg p-4 h-full">
              <div className="text-xl font-semibold text-white/90 mb-3">Shows by Group</div>
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
                        className={`text-[#fce7ca] text-sm flex justify-between font-semibold cursor-pointer ${
                          selectedGroup === group ? 'bg-[#594e5f]/40' : 'hover:bg-[#594e5f]/20'
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
          ) : null}
        </div>

        {/* Performance Chart */}
        {performances.length > 0 ? (
          <GuestPerformanceChart 
            performances={performances} 
            selectedGroup={selectedGroup}
            selectedSong={selectedSong}
            songShowMap={songShowMap}
          />
        ) : (
          <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
            <p className="text-[#fce7ca]/90 text-center">
              <span className="font-semibold">{guest.guest}</span> hasn't performed as a guest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}