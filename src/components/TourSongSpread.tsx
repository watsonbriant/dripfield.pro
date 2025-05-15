import React, { useState } from 'react';

interface SetlistEntry {
  entry_song: string;
  songs: {
    song_category: string;
    song_originalartist: string | null;
    categories: {
      category_canonid: number;
    };
  };
}

interface Show {
  show_id: string;
  setlist_entries?: SetlistEntry[];
}

interface TourSongSpreadProps {
  shows: Show[];
}

const TourSongSpread: React.FC<TourSongSpreadProps> = ({ shows }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Count songs per category and collect songs for each category
  const categoryData = shows.reduce((acc, show) => {
    // Track unique songs for this show
    const showSongKeys = new Set<string>();
    
    show.setlist_entries?.forEach(entry => {
      const songKey = `${entry.entry_song}-${entry.songs.song_category}`;
      const category = entry.songs.song_category || 'undefined';
      
      // Only count each song once per show
      if (!showSongKeys.has(songKey)) {
        showSongKeys.add(songKey);
        acc.counts[category] = (acc.counts[category] || 0) + 1;
        
        // Initialize songs array if it doesn't exist
        if (!acc.songs[category]) {
          acc.songs[category] = [];
        }
        
        // Add song to category's song list with original artist if applicable
        const songWithArtist = ['Cover Songs', 'Live Collaborations'].includes(category) && entry.songs.song_originalartist
          ? { 
              song: entry.entry_song,
              artist: entry.songs.song_originalartist,
              playCount: 1
            }
          : { 
              song: entry.entry_song,
              playCount: 1
            };
        
        // Check if song already exists in the category
        const existingSongIndex = acc.songs[category].findIndex(s => s.song === songWithArtist.song);
        if (existingSongIndex === -1) {
          acc.songs[category].push(songWithArtist);
        } else {
          // Increment play count if song exists
          acc.songs[category][existingSongIndex].playCount++;
        }
      }
    });
    
    return acc;
  }, { counts: {}, songs: {} });

  // Sort songs by play count (descending) then alphabetically
  Object.keys(categoryData.songs).forEach(category => {
    categoryData.songs[category].sort((a, b) => 
      a.song.localeCompare(b.song)
    );
  });

  // Create a map of categories to their canonids
  const categoryCanonIds = shows.reduce((acc, show) => {
    show.setlist_entries?.forEach(entry => {
      if (entry.songs.song_category && entry.songs.categories.category_canonid) {
        acc[entry.songs.song_category] = entry.songs.categories.category_canonid;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by count (descending) then by canonid (ascending)
  const sortedCategories = Object.entries(categoryData.counts)
    .map(([category, count]) => ({
      category,
      count,
      canonid: categoryCanonIds[category] || 0,
      songs: categoryData.songs[category]
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.canonid - b.canonid;
    });

  const maxCount = Math.max(...Object.values(categoryData.counts));

  return (
    <div className="bg-primary border border-black rounded-lg p-3">
      <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-4">
        Song Spread
      </h2>
      <div className="space-y-1.5">
        {sortedCategories.map(({ category, count, songs }) => (
          <div key={category}>
            <div 
              className="text-black text-sm font-semibold cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredCategory(category);
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {category}
            </div>
            <div 
              className="h-5 rounded overflow-hidden cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredCategory(category);
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div 
                className="h-full bg-[#f9ae37] rounded border border-black relative"
                style={{ 
                  width: `${(count / maxCount) * 100}%`,
                  minWidth: '25px'
                }}
              >
                <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                  <span className="text-black text-sm font-semibold">{count}</span>
                </div>
              </div>
            </div>
            {hoveredCategory === category && (
              <div 
                className="fixed bg-secondary text-black px-3 py-1 rounded border border-black shadow-lg min-w-max z-[9999] text-xs"
                style={{
                  left: `${mousePosition.x + 10}px`,
                  top: `${mousePosition.y - 10}px`
                }}
              >
                {songs.map((song, index) => (
                  <div key={index}>
                    <span className="font-semibold">{song.song}</span>
                    {song.artist && <>&nbsp;&nbsp;[{song.artist}]</>}
                    &nbsp;&nbsp;[{song.playCount}]
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourSongSpread;