import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type Guest = {
  guest_id: string;
  guest: string;
  guest_category: string;
  song_count: number;
  show_count: number;
};

type GuestsByCategory = {
  [category: string]: {
    guests: Guest[];
    count: number;
  };
};

// CircularProgress component - same as in AttendanceStats
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
          stroke="#dad0bc" 
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

interface UserGuestsProps {
  userId?: string;
}

const UserGuests: React.FC<UserGuestsProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [guestsByCategory, setGuestsByCategory] = useState<GuestsByCategory>({});
  const [error, setError] = useState<string | null>(null);
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
    const fetchUserGuests = async () => {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // 1. Get user's attended shows with pagination
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
        
        if (!allAttendedShows || allAttendedShows.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        const showIds = allAttendedShows.map(show => show.show_id);
        
        // Split showIds into chunks for batch processing
        const showIdChunks = [];
        const chunkSize = 200; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        // 2. Get setlist entries for those shows with pagination and chunking
        let allSetlistEntries = [];
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('setlist_entries')
              .select('entry_id, entry_show')
              .in('entry_show', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allSetlistEntries = [...allSetlistEntries, ...data];
              page++;
              
              // Update progress based on pagination and chunks (20-40%)
              const progressPerChunk = 20 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(40, 20 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allSetlistEntries || allSetlistEntries.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        const entryIds = allSetlistEntries.map(entry => entry.entry_id);
        
        // Create a mapping of entry_id to show_id for later use
        const entryToShowMap: Record<string, string> = {};
        allSetlistEntries.forEach(entry => {
          entryToShowMap[entry.entry_id] = entry.entry_show;
        });
        
        // Split entryIds into chunks for batch processing
        const entryIdChunks = [];
        
        for (let i = 0; i < entryIds.length; i += chunkSize) {
          entryIdChunks.push(entryIds.slice(i, i + chunkSize));
        }
        
        // 3. Get guest appearances for those setlist entries with pagination and chunking
        let allGuestJoins = [];
        
        for (let i = 0; i < entryIdChunks.length; i++) {
          const currentChunk = entryIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('setlist_entry_guests')
              .select('setlist_entry_id, guest_id')
              .in('setlist_entry_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allGuestJoins = [...allGuestJoins, ...data];
              page++;
              
              // Update progress based on pagination and chunks (40-60%)
              const progressPerChunk = 20 / entryIdChunks.length;
              const chunkProgress = (i / entryIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(60, 40 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allGuestJoins || allGuestJoins.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        // Get unique guest IDs
        const guestIds = [...new Set(allGuestJoins.map(join => join.guest_id))];
        
        // Split guestIds into chunks for batch processing if needed
        const guestIdChunks = [];
        
        for (let i = 0; i < guestIds.length; i += chunkSize) {
          guestIdChunks.push(guestIds.slice(i, i + chunkSize));
        }
        
        // 4. Get guest details with pagination and chunking
        let allGuests = [];
        
        for (let i = 0; i < guestIdChunks.length; i++) {
          const currentChunk = guestIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('guests')
              .select('guest_id, guest, guest_category')
              .in('guest_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allGuests = [...allGuests, ...data];
              page++;
              
              // Update progress based on pagination and chunks (60-80%)
              const progressPerChunk = 20 / guestIdChunks.length;
              const chunkProgress = (i / guestIdChunks.length) * 20;
              const pageProgress = (page * progressPerChunk) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(80, 60 + chunkProgress + pageProgress));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        if (!allGuests || allGuests.length === 0) {
          setLoadingProgress(100);
          setTimeout(() => setLoading(false), 500);
          return;
        }
        
        setLoadingProgress(85);
        
        // 5. Process data to count guest appearances by category
        const guestMap: Record<string, Guest> = {};
        const guestSongs: Record<string, Set<string>> = {};
        const guestShows: Record<string, Set<string>> = {};
        
        // Initialize tracking structures
        allGuests.forEach(guest => {
          const guestId = guest.guest_id;
          guestSongs[guestId] = new Set();
          guestShows[guestId] = new Set();
          
          guestMap[guestId] = {
            guest_id: guestId,
            guest: guest.guest,
            guest_category: guest.guest_category,
            song_count: 0,
            show_count: 0
          };
        });
        
        setLoadingProgress(90);
        
        // Count songs and shows for each guest
        allGuestJoins.forEach(join => {
          const guestId = join.guest_id;
          const entryId = join.setlist_entry_id;
          const showId = entryToShowMap[entryId];
          
          if (guestId && entryId) {
            guestSongs[guestId].add(entryId);
          }
          
          if (guestId && showId) {
            guestShows[guestId].add(showId);
          }
        });
        
        // Update guest objects with counts
        Object.keys(guestMap).forEach(guestId => {
          guestMap[guestId].song_count = guestSongs[guestId]?.size || 0;
          guestMap[guestId].show_count = guestShows[guestId]?.size || 0;
        });
        
        setLoadingProgress(95);
        
        // Group by category
        const groupedGuests: GuestsByCategory = {};
        
        Object.values(guestMap).forEach(guest => {
          const category = guest.guest_category;
          
          if (!groupedGuests[category]) {
            groupedGuests[category] = {
              guests: [],
              count: 0
            };
          }
          
          groupedGuests[category].guests.push(guest);
          groupedGuests[category].count = groupedGuests[category].guests.length;
        });
        
        // Sort guests within each category by song count descending
        for (const category in groupedGuests) {
          groupedGuests[category].guests.sort((a, b) => b.song_count - a.song_count);
        }
        
        setGuestsByCategory(groupedGuests);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching user guests:', error);
        setError('Failed to load guest data');
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };
    
    fetchUserGuests();
  }, [effectiveUserId]);

  // Get loading message based on profile ownership
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading guest data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} guest data...`;
    }
  };

  // Get error message based on profile ownership
  const getErrorMessage = () => {
    if (isOwnProfile) {
      return error || "Failed to load guest data";
    } else if (username) {
      return `Failed to load ${username}'s guest data`;
    } else {
      return "Failed to load guest data";
    }
  };

  // Get empty state message based on profile ownership
  const getEmptyStateMessage = () => {
    if (isOwnProfile) {
      return "You haven't seen any shows with guest appearances yet.";
    } else if (username) {
      return `${username} hasn't seen any shows with guest appearances yet.`;
    } else {
      return "This user hasn't seen any shows with guest appearances yet.";
    }
  };

  // Early returns for different states
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-fifth mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary p-3 rounded-lg border border-secondary">
        <div className="text-center text-red-500 py-8">{getErrorMessage()}</div>
      </div>
    );
  }

  if (Object.keys(guestsByCategory).length === 0) {
    return (
      <div className="bg-primary p-3 rounded-lg border border-secondary">
        <div className="text-center text-fifth py-12">
          <p>{getEmptyStateMessage()}</p>
        </div>
      </div>
    );
  }

  // Helper function to render each category's guest table
  const renderGuestTable = (category: string, guests: Guest[], count: number) => {
    // Map database category names to display names
    const categoryDisplayNames: Record<string, string> = {
      'Goose (current)': 'Current Goose Members',
      'Goose (former)': 'Former Goose Members',
      'Guest': 'Guests',
      'Group': 'Groups'
    };
    
    // Use the mapped display name or fallback to the original category name
    const displayName = categoryDisplayNames[category] || category;
    
    // Generate a color for the category header based on the category name
    let headerBgColor = '';
    switch(category) {
      case 'Goose (current)':
        headerBgColor = 'bg-[#006400]'; // Dark green
        break;
      case 'Goose (former)':
        headerBgColor = 'bg-[#7C2128]'; // Burgundy
        break;
      case 'Guest':
        headerBgColor = 'bg-tertiary'; // Using the tertiary color
        break;
      case 'Group':
        headerBgColor = 'bg-[#019B7A]'; // Teal
        break;
      default:
        headerBgColor = 'bg-[#E17401]'; // Orange (default)
    }
    
    return (
      <div className="bg-primary p-3 rounded-lg border border-secondary" key={category}>
        <h2 className="text-lg font-medium bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">{displayName}</h2>
      
        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                <th className="px-4 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap w-[40%]">Guest</th>
                <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap w-[30%]"># of Songs</th>
                <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap w-[30%]"># of Shows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {guests.map((guest, index) => (
                <tr
                  key={guest.guest_id}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/guest/${guest.guest_id}`)}
                      className="font-medium hover:underline transition-colors"
                    >
                      {guest.guest}
                    </button>
                  </td>
                  <td className="px-4 py-0.5 text-center text-fifth font-light whitespace-nowrap">{guest.song_count}</td>
                  <td className="px-4 py-0.5 text-center text-fifth font-light whitespace-nowrap">{guest.show_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Main render
  return (
    <div className="space-y-4 max-w-[1280px] mx-auto">
      {/* Render all categories in alphabetical order */}
      {Object.keys(guestsByCategory)
        .sort((a, b) => a.localeCompare(b)) // Sort categories alphabetically
        .map(category => renderGuestTable(
          category,
          guestsByCategory[category].guests,
          guestsByCategory[category].count
        ))}
    </div>
  );
};

export default UserGuests;