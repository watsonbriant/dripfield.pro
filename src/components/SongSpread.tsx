import React, { useState } from 'react';

interface SetlistEntry {
  entry_song: string;
  song_category: string;
  category_canonid?: number;
  song_originalartist?: string;
}

interface SongSpreadProps {
  setlist: SetlistEntry[];
}

const SongSpread: React.FC<SongSpreadProps> = ({ setlist }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Count unique songs per category and collect songs for each category
  const categoryData = setlist.reduce((acc, entry) => {
    const songKey = `${entry.entry_song}-${entry.song_category}`;
    const category = entry.song_category || 'undefined';
    
    if (!acc.songsSeen.has(songKey)) {
      acc.songsSeen.add(songKey);
      acc.counts[category] = (acc.counts[category] || 0) + 1;
      
      // Initialize songs array if it doesn't exist
      if (!acc.songs[category]) {
        acc.songs[category] = [];
      }
      
      // Add song to category's song list with original artist if applicable
      const songWithArtist = ['Cover Songs', 'Live Collaborations'].includes(category) && entry.song_originalartist
        ? { 
            song: entry.entry_song,
            artist: entry.song_originalartist,
            isSpecialCategory: true
          }
        : { 
            song: entry.entry_song,
            isSpecialCategory: false
          };
        
      const songExists = acc.songs[category].some(s => 
        (typeof s === 'string' && s === songWithArtist.song) ||
        (typeof s === 'object' && s.song === songWithArtist.song)
      );
      
      if (!songExists) {
        acc.songs[category].push(songWithArtist);
      }
    }
    return acc;
  }, { counts: {}, songs: {}, songsSeen: new Set() });

  // Sort songs alphabetically within each category
  Object.keys(categoryData.songs).forEach(category => {
    categoryData.songs[category].sort((a, b) => {
      const songA = typeof a === 'string' ? a : a.song;
      const songB = typeof b === 'string' ? b : b.song;
      return songA.localeCompare(songB);
    });
  });

  // Create a map of categories to their canonids
  const categoryCanonIds = setlist.reduce((acc, entry) => {
    if (entry.song_category && entry.category_canonid) {
      acc[entry.song_category] = entry.category_canonid;
    }
    return acc;
  }, {});

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
    <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Song Spread</h3>
      <div className="space-y-1.5">
        {sortedCategories.map(({ category, count, songs }) => (
          <div key={category}>
            <div 
              className="text-[#ffffff]/90 text-sm font-semibold cursor-pointer"
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
                className="h-full bg-[#594e5f] rounded relative"
                style={{ 
                  width: `${(count / maxCount) * 100}%`,
                  minWidth: '22px'
                }}
              >
                <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                  <span className="text-[#fce7ca] text-sm font-semibold">{count}</span>
                </div>
              </div>
            </div>
            {hoveredCategory === category && (
              <div 
                className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1.5 rounded shadow-lg min-w-max z-[9999] text-xs"
                style={{
                  left: `${mousePosition.x + 10}px`,
                  top: `${mousePosition.y - 10}px`
                }}
              >
                {songs.map((song, index) => (
                  <div key={index}>
                    {typeof song === 'string' ? (
                      <span className="font-semibold">{song}</span>
                    ) : (
                      <>
                        <span className="font-semibold">{song.song}</span>
                        {song.isSpecialCategory && song.artist && <>&nbsp;&nbsp;[{song.artist}]</>}
                      </>
                    )}
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

export default SongSpread;