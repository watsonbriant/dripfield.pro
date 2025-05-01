import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { Modal } from './Modal';

interface SongCount {
  song: string;
  play_count: number;
  category?: string;
  category_canonid?: number;
}

interface SongsPlayedProps {
  guestId: string | undefined;
  isLoading: boolean;
  selectedSong: string | null;
  onSongClick: (song: string) => void;
  CircularProgress?: React.FC<{ value: number }>; // Added prop to receive CircularProgress component
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

// Default CircularProgress component if one isn't passed in
const DefaultCircularProgress = ({ value }: { value: number }) => {
  const radius = 30; // Smaller for this component
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-16 h-16" viewBox="0 0 100 100">
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
      <div className="absolute text-sm font-bold text-[#fce7ca]">
        {Math.round(value)}%
      </div>
    </div>
  );
};

export function SongsPlayed({ 
  guestId, 
  isLoading, 
  selectedSong, 
  onSongClick,
  CircularProgress = DefaultCircularProgress
}: SongsPlayedProps) {
  const [songs, setSongs] = useState<SongCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'song' | 'count'>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const [songSpreadData, setSongSpreadData] = useState<SongSpreadItem[]>([]);

  useEffect(() => {
    async function fetchSongs() {
      if (!guestId) return;
      
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // Use the same pagination approach as in the Guest component
        let allEntries = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error, count } = await supabase
            .from('setlist_entry_guests')
            .select(`
              setlist_entry_id,
              setlist_entries:setlist_entry_id(
                entry_song,
                songs:entry_song(
                  song,
                  song_category,
                  song_originalartist,
                  categories:song_category(
                    category_canonid
                  )
                )
              )
            `, { count: 'exact' })
            .eq('guest_id', guestId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            allEntries = [...allEntries, ...data];
            page++;
            
            // Update progress based on pagination
            // Reserve 5-70% of progress for this step
            const paginationProgress = 5 + (page * 15);
            setLoadingProgress(Math.min(70, paginationProgress));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        setLoadingProgress(75);
        
        // Process data to count song occurrences and get song categories
        const songData: Record<string, { 
          count: number, 
          category: string, 
          categoryCanonId?: number,
          originalArtist?: string 
        }> = {};
        
        allEntries.forEach(item => {
          if (item.setlist_entries?.songs?.song) {
            const songName = item.setlist_entries.songs.song;
            const category = item.setlist_entries.songs.song_category;
            const categoryCanonId = item.setlist_entries.songs.categories?.category_canonid;
            const originalArtist = item.setlist_entries.songs.song_originalartist;
            
            if (!songData[songName]) {
              songData[songName] = { 
                count: 0, 
                category, 
                categoryCanonId,
                originalArtist: originalArtist || undefined
              };
            }
            songData[songName].count += 1;
          }
        });

        setLoadingProgress(85);

        // Get category_canonid for each song category
        const categories = [...new Set(Object.values(songData).map(data => data.category))];
        
        let categoryCanonIds: Record<string, number> = {};
        if (categories.length > 0) {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('category, category_canonid')
            .in('category', categories);
            
          if (!categoryError && categoryData) {
            categoryCanonIds = categoryData.reduce((acc, cat) => {
              acc[cat.category] = cat.category_canonid;
              return acc;
            }, {});
          }
        }
        
        // Convert to array format with category information
        const songsArray = Object.entries(songData).map(([song, data]) => ({
          song,
          play_count: data.count,
          category: data.category,
          category_canonid: data.categoryCanonId || categoryCanonIds[data.category] || 9999, // Default high value for sorting unknown categories last
          original_artist: data.originalArtist
        }));
        
        setSongs(songsArray);
        setLoadingProgress(95);
        
        // Prepare data for song spread visualization
        const categorySongs: Record<string, Array<{song: string, playCount: number, artist?: string}>> = {};
        const categoryTotalPerformances: Record<string, number> = {};
        
        // Group songs by category and track total performances
        songsArray.forEach(songData => {
          const category = songData.category || 'Uncategorized';
          
          if (!categorySongs[category]) {
            categorySongs[category] = [];
            categoryTotalPerformances[category] = 0;
          }
          
          categorySongs[category].push({
            song: songData.song,
            playCount: songData.play_count,
            artist: songData.original_artist
          });
          
          // Sum the play counts for total performances in this category
          categoryTotalPerformances[category] += songData.play_count;
        });
        
        // Convert to sorted array for the spread chart
        const spreadData = Object.keys(categoryTotalPerformances).map(category => ({
          category,
          count: categoryTotalPerformances[category], // Total performances, not unique songs
          canonid: categoryCanonIds[category] || 9999,
          songs: categorySongs[category].sort((a, b) => b.playCount - a.playCount)
        })).sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.canonid - b.canonid;
        });
        
        setSongSpreadData(spreadData);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching songs data:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }
    
    fetchSongs();
  }, [guestId]);
  
  // Handle sorting
  const handleSortClick = (column: 'song' | 'count') => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for count, ascending for song name
      setSortBy(column);
      setSortDirection(column === 'count' ? 'desc' : 'asc');
    }
  };
  
  // Filter songs based on search term
  const filteredSongs = songs.filter(song => 
    song.song.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort songs based on current sort settings or default multi-level sort
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'song') {
      // If explicitly sorting by song name
      return sortDirection === 'asc' 
        ? a.song.localeCompare(b.song) 
        : b.song.localeCompare(a.song);
    } else if (sortBy === 'count') {
      // If explicitly sorting by count
      if (a.play_count !== b.play_count) {
        return sortDirection === 'asc' 
          ? a.play_count - b.play_count 
          : b.play_count - a.play_count;
      }
      // If counts are equal, use the default secondary and tertiary sort
      if (a.category_canonid !== b.category_canonid) {
        return a.category_canonid - b.category_canonid;
      }
      return a.song.localeCompare(b.song);
    } else {
      // Default multi-level sorting:
      // 1. Play count (descending)
      if (a.play_count !== b.play_count) {
        return b.play_count - a.play_count;
      }
      // 2. Category canonid (ascending)
      if (a.category_canonid !== b.category_canonid) {
        return a.category_canonid - b.category_canonid;
      }
      // 3. Song name (A-Z)
      return a.song.localeCompare(b.song);
    }
  });
  
  if (isLoading || loading) {
    return (
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4 h-full">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Unique Songs Played</h2>
        <div className="flex items-center justify-center py-6">
          <CircularProgress value={loadingProgress} />
        </div>
      </div>
    );
  }
  
  // Calculate max count for song spread bars
  const maxCount = Math.max(...songSpreadData.map(cat => cat.count));
  
  return (
    <div className="bg-[#172330] border border-white/10 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-white/90">
          {songs.length} Unique Songs Played
        </h2>
        <button 
          onClick={() => setIsSpreadModalOpen(true)} 
          className="text-[#fce7ca] hover:text-white transition-colors"
          aria-label="Show song spread"
        >
          <ChartBarDecreasing size={20} />
        </button>
      </div>
      
      {/* Search input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1f2935] border border-white/10 rounded-md px-3 py-1.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-[#594e5f] bg-primary"
        />
      </div>
      
      {sortedSongs.length > 0 ? (
        <div className="relative">
          {/* Sticky table header */}
          <div className="sticky top-0 z-10 bg-[#172330] grid grid-cols-2 text-sm text-white/80 border-b border-white/10 pb-1 mb-2">
            <div 
              className="cursor-pointer hover:text-white flex items-center"
              onClick={() => handleSortClick('song')}
            >
              <span>Song</span>
              {sortBy === 'song' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-white text-right flex items-center justify-end"
              onClick={() => handleSortClick('count')}
            >
              <span>Count</span>
              {sortBy === 'count' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          </div>
          
          {/* Scrollable song list */}
          <div className="max-h-[234px] overflow-y-auto">
            <div className="space-y-1">
              {sortedSongs.map((song, index) => (
                <div 
                  key={index} 
                  onClick={() => onSongClick(song.song)}
                  className={`flex justify-between text-sm font-semibold cursor-pointer hover:bg-[#594e5f]/20 ${
                    selectedSong === song.song 
                      ? 'text-[#fe6b01] bg-[#594e5f]/30' 
                      : 'text-[#fce7ca]'
                  }`}
                >
                  <span className="truncate">{song.song}</span>
                  <span>{song.play_count}</span>
                </div>
              ))}
            </div>
          </div>
                </div>
              ) : (
                <div className="text-[#fce7ca]/70 text-center py-4">
                  {searchTerm ? 'No songs match your search.' : 'No songs found.'}
                </div>
              )}
              
              {/* Song Spread Modal */}
              <Modal
                isOpen={isSpreadModalOpen}
                onClose={() => setIsSpreadModalOpen(false)}
                title="Song Category Spread"
              >
                <div className="space-y-1.5 max-h-[80vh] overflow-y-auto p-1">
                  {songSpreadData.map(({ category, count, songs }) => (
                    <div key={category}>
                      <div className="text-[#ffffff]/90 text-sm font-semibold">
                        {category}
                      </div>
                      <div className="h-5 rounded overflow-hidden">
                        <div 
                          className="h-full bg-[#594e5f] rounded relative"
                          style={{ 
                            width: `${(count / maxCount) * 100}%`,
                            minWidth: count < 10 ? '24px' : count < 100 ? '32px' : count < 1000 ? '40px' : '48px'
                          }}
                        >
                          <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                            <span className="text-[#fce7ca] text-sm font-semibold">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Modal>
            </div>
          );
        }