import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Show {
  setlist_entries?: Array<{
    entry_song: string;
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
  className = "" // Add this
}) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = React.useState<'song' | 'count' | 'category' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const calculateSongStats = (): SongStats[] => {
    const songMap = new Map<string, { song_id: string; count: number; category: string; categoryCanonId: number }>();

    shows.forEach(show => {
      const uniqueSongsInShow = new Set<string>();
      
      show.setlist_entries?.forEach(entry => {
        if (!uniqueSongsInShow.has(entry.entry_song)) {
          uniqueSongsInShow.add(entry.entry_song);
          
          const currentStats = songMap.get(entry.entry_song) || { 
            song_id: '',
            count: 0, 
            category: '',
            categoryCanonId: 0 
          };
          
          // Get category_canonid from the correct path based on your data structure
          const categoryCanonId = entry.songs?.categories?.category_canonid || 
                                entry.songs?.category_canonid || 
                                0;
                                
          // Check if we have the song ID in the songIdMap or from the entry directly
          const songId = entry.songs?.song_id || songIdMap[entry.entry_song] || currentStats.song_id;
          
          songMap.set(entry.entry_song, {
            song_id: songId,
            count: currentStats.count + 1,
            category: entry.songs?.song_category || currentStats.category,
            categoryCanonId: categoryCanonId
          });
        }
      });
    });

    return Array.from(songMap.entries()).map(([song, stats]) => ({
      song,
      song_id: stats.song_id,
      count: stats.count,
      category: stats.category,
      categoryCanonId: stats.categoryCanonId
    }));
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

  const handleSort = (column: 'song' | 'count' | 'category') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: 'song' | 'count' | 'category') => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-white/90" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-white/90" />;
  };

  const handleRowClick = (song_id: string) => {
    navigate(`/song/${song_id}`);
  };

  return (
    <div className={`${!hideTitle ? "bg-[#172330] border border-white/10 rounded-lg p-4" : ""} ${className}`}>
      {!hideTitle && (
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          {uniqueSongCount} Songs Played
        </h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-[#0e151b] border-y border-white/10">
              <th 
                className="px-4 py-1 text-center text-s font-semibold text-white/90 cursor-pointer hover:bg-white/5 whitespace-nowrap"
                onClick={() => handleSort('count')}
              >
                <div className="text-center gap-1">
                  #
                  {getSortIcon('count')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-left text-s font-semibold text-white/90 cursor-pointer hover:bg-white/5 whitespace-nowrap"
                onClick={() => handleSort('song')}
              >
                <div className="flex items-center gap-1">
                  Song
                  {getSortIcon('song')}
                </div>
              </th>
              <th 
                className="px-4 py-1 text-left text-s font-semibold text-white/90 cursor-pointer hover:bg-white/5 whitespace-nowrap"
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
                  index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                } hover:bg-white/10 transition-colors text-xs`}
              >
                <td className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap text-center">{stat.count}</td>
                <td 
                  className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap cursor-pointer"
                  onClick={() => handleRowClick(stat.song_id)}
                >
                  <span className="font-semibold hover:text-white transition-colors table-link">
                    {stat.song}
                  </span>
                </td>
                <td 
                  className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap"
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