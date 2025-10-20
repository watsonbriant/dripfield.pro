import React, { useState } from 'react';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { Modal } from './Modal';
import { CircularProgress } from './ui/CircularProgress';

interface SongCount {
  song: string;
  play_count: number;
  category?: string;
  category_canonid?: number;
  original_artist?: string;
}

interface SongsPlayedProps {
  PersonnelID: string | undefined;
  isLoading: boolean;
  selectedSong: string | null;
  onSongClick: (song: string) => void;
  CircularProgress?: React.FC<{ value: number }>;
  cleanSongName?: (songName: string) => string;
  songs: SongCount[];
  songSpreadData: any[];
  loadingProgress: number;
}

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork?: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

export function SongsPlayed({ 
  PersonnelID, 
  isLoading, 
  selectedSong, 
  onSongClick,
  CircularProgress = CircularProgress,
  cleanSongName,
  songs,
  songSpreadData,
  loadingProgress
}: SongsPlayedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'song' | 'count'>('count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);

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
  
  if (isLoading) {
    return (
      <div className="max-h-[320px] overflow-y-auto">
        <div className="flex items-center justify-center py-6">
          <CircularProgress value={loadingProgress} />
        </div>
      </div>
    );
  }
  
  // Calculate max count for song spread bars
  const maxCount = Math.max(...songSpreadData.map(cat => cat.count));
  
  return (
    <div>
      <div className="pl-2 pr-2 flex justify-between items-center mb-3">
        <h2 className="text-fifth text-sm flex justify-between font-light">
          {songs.length} Unique Songs
        </h2>
        <button 
          onClick={() => setIsSpreadModalOpen(true)} 
          className="text-fifth hover:text-tertiary transition-colors"
          aria-label="Show song spread"
        >
          <ChartBarDecreasing size={18} />
        </button>
      </div>
      
      {/* Search input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-canvas border border-secondary rounded-md px-3 py-1.5 text-sm text-fifth focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
        />
      </div>
      
      {sortedSongs.length > 0 ? (
        <div className="relative">
          {/* Sticky table header */}
          <div className="sticky top-0 z-10 bg-primary grid grid-cols-2 text-sm text-fifth border-b border-secondary pb-1 mb-2">
            <div 
              className="cursor-pointer hover:text-tertiary font-medium flex items-center"
              onClick={() => handleSortClick('song')}
            >
              <span>Song</span>
              {sortBy === 'song' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
            <div 
              className="cursor-pointer hover:text-tertiary font-medium text-right flex items-center justify-end"
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
            <div>
              {sortedSongs.map((song, index) => (
                <div 
                  key={index} 
                  onClick={() => onSongClick(song.song)}
                  className={`flex justify-between text-sm cursor-pointer ${
                    selectedSong === song.song 
                      ? 'bg-tertiary/80' 
                      : 'hover:bg-tertiary/40'
                  }`}
                >
                  <span className="pl-2 truncate font-trad text-fifth">{cleanSongName ? cleanSongName(song.song) : song.song}</span>
                  <span className="pr-2 text-fifth font-base">{song.play_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-fifth/70 text-center py-4">
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
          {songSpreadData.map(({ category, count, songs, artwork }) => (
            <div key={category}>
              <div className="text-fifth text-sm font-medium">
                {category}
              </div>
              <div className="h-5 rounded overflow-hidden">
                <div 
                  className="h-full bg-secondary border-secondary rounded relative flex items-center"
                  style={{ 
                    width: `${(count / maxCount) * 100}%`,
                    minWidth: count < 10 ? '42px' : count < 100 ? '51px' : count < 1000 ? '60px' : '69px'
                  }}
                >
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt=""
                      onError={(e) => {
                        console.error(`Failed to load image for ${category}:`, artwork);
                        e.currentTarget.style.display = 'none';
                      }}
                      className="h-4 w-4 ml-0.5 object-cover rounded-sm"
                    />
                  )}
                  <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                    <span className="text-fifth text-sm font-semibold">{count}</span>
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