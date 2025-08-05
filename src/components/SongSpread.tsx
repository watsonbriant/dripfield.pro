import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// Update the interface to match the structure we actually have
interface SetlistEntry {
  entry_song: string;
  entry_short?: string;  // Added this field
  song_category?: string;
  category_canonid?: number;
  song_originalartist?: string;
  category_artwork?: string;
  songs: {
    song_id: string;
    song_category: string;
    song_originalartist: string | null;
    categories: {
      category_canonid: number;
      category_artwork: string | null;
    };
  };
}

interface SongSpreadProps {
  setlist: SetlistEntry[];
}

const SongSpread: React.FC<SongSpreadProps> = ({ setlist }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});
  
  // Create a set of songs that should be excluded
  const excludedTerms = ['fake', 'tease', 'reprise'];
  
  // Use useMemo to calculate songsToExclude only when setlist changes
  const songsToExclude = useMemo(() => {
    const excluded = new Set<string>();
    
    // Group entries by song name
    const songEntries = setlist.reduce((acc, entry) => {
      if (!acc[entry.entry_song]) {
        acc[entry.entry_song] = [];
      }
      acc[entry.entry_song].push(entry);
      return acc;
    }, {} as Record<string, SetlistEntry[]>);

    // Determine which songs should be excluded
    Object.entries(songEntries).forEach(([songName, entries]) => {
      const allEntriesHaveExcludedTerms = entries.every(entry => 
        entry.entry_short && 
        excludedTerms.some(term => 
          entry.entry_short.toLowerCase().includes(term.toLowerCase())
        )
      );
      
      if (allEntriesHaveExcludedTerms) {
        excluded.add(songName);
      }
    });
    
    return excluded;
  }, [setlist]);
  
  // Fetch artwork for categories directly from the database
  useEffect(() => {
    const fetchCategoryArtwork = async () => {
      try {
        // Extract unique category names from the setlist (excluding filtered songs)
        const categories = [...new Set(
          setlist
            .filter(entry => !songsToExclude.has(entry.entry_song))
            .map(entry => entry.songs?.song_category)
            .filter(Boolean)
        )];
        
        if (categories.length > 0) {
          // Fetch artwork for these categories from the categories table
          const { data, error } = await supabase
            .from('categories')
            .select('category, category_artwork')
            .in('category', categories);
            
          if (error) {
            console.error('Error fetching category artwork:', error);
            return;
          }
          
          // Create a mapping of category names to artwork URLs
          const artworkMap = data.reduce((map, item) => {
            if (item.category && item.category_artwork) {
              map[item.category] = item.category_artwork;
            }
            return map;
          }, {} as Record<string, string>);

          setCategoryArtwork(artworkMap);
        }
      } catch (error) {
        console.error('Failed to fetch category artwork:', error);
      }
    };
    
    fetchCategoryArtwork();
  }, [setlist]); // Removed songsToExclude from dependencies

  // Count unique songs per category and collect songs for each category
  const categoryData = setlist.reduce((acc, entry) => {
    // Skip excluded songs
    if (songsToExclude.has(entry.entry_song)) {
      return acc;
    }
    
    const category = entry.songs?.song_category || 'undefined';
    
    const songKey = `${entry.entry_song}-${category}`;
    
    // Only count each unique song once
    if (!acc.songsSeen.has(songKey)) {
      acc.songsSeen.add(songKey);
      acc.counts[category] = (acc.counts[category] || 0) + 1;
      
      // Initialize songs array if it doesn't exist
      if (!acc.songs[category]) {
        acc.songs[category] = [];
      }
      
      // Add song to category's song list with original artist if applicable
      const hasArtist = ['Cover Songs', 'Live Collaborations'].includes(category);
      const originalArtist = entry.songs?.song_originalartist;
      
      const songWithArtist = hasArtist && originalArtist
        ? { 
            song: entry.entry_song,
            artist: originalArtist,
            isSpecialCategory: true
          }
        : { 
            song: entry.entry_song,
            isSpecialCategory: false
          };
      
      const songExists = acc.songs[category].some(s => s.song === songWithArtist.song);
      
      if (!songExists) {
        acc.songs[category].push(songWithArtist);
      }
    }
    
    return acc;
  }, { 
    counts: {} as Record<string, number>, 
    songs: {} as Record<string, any[]>, 
    songsSeen: new Set<string>()
  });

  // Sort songs alphabetically within each category
  Object.keys(categoryData.songs).forEach(category => {
    categoryData.songs[category].sort((a, b) => a.song.localeCompare(b.song));
  });

  // Create a map of categories to their canonids
  const categoryCanonIds = setlist.reduce((acc, entry) => {
    // Skip excluded songs
    if (songsToExclude.has(entry.entry_song)) {
      return acc;
    }
    
    // Determine the correct category
    const category = entry.songs?.song_category || 'undefined';
    
    // Try to find the canonid in multiple possible locations
    if (category !== 'undefined') {
      // Direct canonid property
      if (entry.songs?.categories?.category_canonid !== undefined) {
        acc[category] = entry.songs.categories.category_canonid;
      } else if (entry.category_canonid !== undefined) {
        acc[category] = entry.category_canonid;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by count (descending) then by canonid (ascending)
  const sortedCategories = Object.entries(categoryData.counts)
    .map(([category, count]) => ({
      category,
      count,
      canonid: categoryCanonIds[category] || 0,
      artwork: categoryArtwork[category] || null,
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
      <h2 className="text-lg font-semibold text-black mb-4">Song Spread</h2>
      <div className="space-y-1.5">
        {sortedCategories.map(({ category, count, songs, artwork }) => (
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
                className="h-full bg-[#f9ae37] rounded border border-black relative flex items-center"
                style={{ 
                  width: `${(count / maxCount) * 100}%`,
                  minWidth: '48px'
                }}
              >
                {artwork && (
                  <img 
                    src={artwork} 
                    alt=""
                    onError={(e) => {
                      console.error(`Failed to load image for ${category}. URL was:`, artwork);
                      e.currentTarget.style.display = 'none';
                    }}
                    className="h-4 w-4 ml-0.5 object-cover rounded-sm"
                  />
                )}
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
                    {song.isSpecialCategory && song.artist && <>&nbsp;&nbsp;[{song.artist}]</>}
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