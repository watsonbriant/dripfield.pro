import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Show {
  setlist_entries?: Array<{
    entry_song: string;
    entry_length?: string | null;
    entry_short?: string | null;
    songs?: {
      song_id?: string;
      song_category?: string;
      categories?: {
        category_canonid?: number;
      };
    };
  }>;
}

interface SongStats {
  song: string;
  song_id: string;
  count: number;
  category: string;
  categoryCanonId: number;
  longest: string | null;  // Add this
  shortest: string | null;
}

interface Props {
  shows: Show[];
  songIdMap?: { [songName: string]: string };
  onSongCountChange?: (count: number) => void;
  uniqueSongCount?: number;
  hideTitle?: boolean;
  className?: string; // Add this
}

const TourSongStats: React.FC<Props> = ({ 
  shows, 
  songIdMap = {}, 
  onSongCountChange, 
  uniqueSongCount, 
  hideTitle = false,
  className = ""
}) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = React.useState<'song' | 'count' | 'category' | 'longest' | 'shortest' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  // Parse PostgreSQL interval format to seconds
  const parseDuration = (interval: string | undefined | null): number | null => {
    if (!interval) return null;
    
    // Handle PostgreSQL interval format (e.g., "00:05:23" or "01:23:45")
    const match = interval.match(/^(?:(\d+):)?(\d+):(\d+)$/);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return null;
  };

  // Format seconds to MM:SS or H:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert formatted duration back to seconds for sorting
  const durationToSeconds = (duration: string | null): number => {
    if (!duration) return 0;
    
    const parts = duration.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const calculateSongStats = (): SongStats[] => {
    const songMap = new Map<string, { 
      song_id: string; 
      count: number; 
      category: string; 
      categoryCanonId: number;
      durations: number[]; // Store all durations in seconds
    }>();
  
    shows.forEach(show => {
      const uniqueSongsInShow = new Set<string>();
      
      show.setlist_entries?.forEach(entry => {
        // Get the current stats regardless of whether we've seen this song in this show
        const currentStats = songMap.get(entry.entry_song) || { 
          song_id: '',
          count: 0, 
          category: '',
          categoryCanonId: 0,
          durations: []
        };
        
        // Only increment count once per show
        const shouldIncrementCount = !uniqueSongsInShow.has(entry.entry_song);
        if (shouldIncrementCount) {
          uniqueSongsInShow.add(entry.entry_song);
        }
        
        const categoryCanonId = entry.songs?.categories?.category_canonid || 
                              entry.songs?.category_canonid || 
                              0;
                              
        const songId = entry.songs?.song_id || songIdMap[entry.entry_song] || currentStats.song_id;
        
        // Always parse duration if available (not just for first occurrence)
        // But exclude aborted, fake, and tease entries
        const excludedShorts = ['aborted', 'fake', 'tease'];
        const newDurations = [...currentStats.durations];

        if (!excludedShorts.includes(entry.entry_short?.toLowerCase() || '')) {
          const durationInSeconds = parseDuration(entry.entry_length);
          if (durationInSeconds !== null) {
            newDurations.push(durationInSeconds);
          }
        }
        
        songMap.set(entry.entry_song, {
          song_id: songId,
          count: shouldIncrementCount ? currentStats.count + 1 : currentStats.count,
          category: entry.songs?.song_category || currentStats.category,
          categoryCanonId: categoryCanonId,
          durations: newDurations
        });
      });
    });
  
    return Array.from(songMap.entries()).map(([song, stats]) => {
      const durations = stats.durations;
      let longest = null;
      let shortest = null;
      
      if (durations.length > 0) {
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        longest = formatDuration(maxDuration);
        shortest = formatDuration(minDuration);
      }
      
      return {
        song,
        song_id: stats.song_id,
        count: stats.count,
        category: stats.category,
        categoryCanonId: stats.categoryCanonId,
        longest,
        shortest
      };
    });
  };

  const sortedSongStats = React.useMemo(() => {
    const stats = calculateSongStats();
    
    if (!sortColumn) {
      // Default sort order
      return stats.sort((a, b) => {
        // First sort by count (descending)
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        
        // Then by category_canonid (ascending)
        if (a.categoryCanonId !== b.categoryCanonId) {
          return a.categoryCanonId - b.categoryCanonId;
        }
        
        // Finally by song name (ascending)
        return a.song.localeCompare(b.song);
      });
    } else {
      // User-selected sort
      return stats.sort((a, b) => {
        if (sortColumn === 'song') {
          const comparison = a.song.localeCompare(b.song);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else if (sortColumn === 'category') {
          const comparison = a.categoryCanonId - b.categoryCanonId;
          return sortDirection === 'asc' ? comparison : -comparison;
        } else if (sortColumn === 'longest') {
          const aSeconds = durationToSeconds(a.longest);
          const bSeconds = durationToSeconds(b.longest);
          const comparison = bSeconds - aSeconds;
          return sortDirection === 'asc' ? -comparison : comparison;
        } else if (sortColumn === 'shortest') {
          const aSeconds = durationToSeconds(a.shortest);
          const bSeconds = durationToSeconds(b.shortest);
          const comparison = bSeconds - aSeconds;
          return sortDirection === 'asc' ? -comparison : comparison;
        } else {
          const comparison = b.count - a.count;
          return sortDirection === 'asc' ? -comparison : comparison;
        }
      });
    }
  }, [shows, sortColumn, sortDirection, songIdMap]);

  // Now we have a separate useEffect that doesn't create a circular dependency
  useEffect(() => {
    if (onSongCountChange) {
      // Calculate the stats directly here instead of using sortedSongStats
      const stats = calculateSongStats();
      onSongCountChange(stats.length);
    }
  }, [shows, songIdMap, onSongCountChange]);

  const handleSort = (column: 'song' | 'count' | 'category' | 'longest' | 'shortest') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: 'song' | 'count' | 'category' | 'longest' | 'shortest') => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-black" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-black" />;
  };

  const handleRowClick = (song_id: string) => {
    navigate(`/song/${song_id}`);
  };

  return (
    <div className={`${!hideTitle ? "bg-primary border border-black rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-4">
          {uniqueSongCount} Songs Played
        </h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-canvas border-y border-white/10">
              <th 
                className="px-4 py-1 text-center text-s font-semibold text-black cursor-pointer hover:bg-black/10 whitespace-nowrap"
                onClick={() => handleSort('count')}
              >
                <div className="text-center gap-1">
                  #
                  {getSortIcon('count')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-left text-s font-semibold text-black cursor-pointer hover:bg-black/10 whitespace-nowrap"
                onClick={() => handleSort('song')}
              >
                <div className="flex items-center gap-1">
                  Song
                  {getSortIcon('song')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-center text-s font-semibold text-black cursor-pointer hover:bg-black/10 whitespace-nowrap"
                onClick={() => handleSort('longest')}
              >
                <div className="flex items-center justify-center gap-1">
                  Longest
                  {getSortIcon('longest')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-center text-s font-semibold text-black cursor-pointer hover:bg-black/10 whitespace-nowrap"
                onClick={() => handleSort('shortest')}
              >
                <div className="flex items-center justify-center gap-1">
                  Shortest
                  {getSortIcon('shortest')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-left text-s font-semibold text-black cursor-pointer hover:bg-black/10 whitespace-nowrap"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon('category')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedSongStats.map((stat, index) => (
              <tr
                key={stat.song}
                className={`${
                  index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                } hover:bg-black/10 transition-colors text-xs`}
              >
                <td className="px-4 py-0.5 text-black whitespace-nowrap text-center">{stat.count}</td>
                <td 
                  className="px-4 py-0.5 text-black whitespace-nowrap cursor-pointer"
                  onClick={() => handleRowClick(stat.song_id)}
                >
                  <span className="font-semibold hover:text-[#a9682e] transition-colors table-link">
                    {stat.song}
                  </span>
                </td>
                <td className="px-4 py-0.5 text-black whitespace-nowrap text-center">
                  {stat.longest || ''}
                </td>
                <td className="px-4 py-0.5 text-black whitespace-nowrap text-center">
                  {stat.shortest || ''}
                </td>
                <td 
                  className="px-4 py-0.5 text-black whitespace-nowrap"
                >
                  {stat.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TourSongStats;