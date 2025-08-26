import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SongSearch } from './SongSearch';

interface Song {
  song: string;
  song_category: string;
  song_originalartist: string;
  song_id: string;
  song_categoryorder: number;
}

type Category = {
  category: string;
  category_canonid: number;
  category_display_name: string;
  category_color1: string;
  category_color2: string;
  category_artwork: string;
  category_type: string;
};

export function Songs() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive columns hook
  const useResponsiveColumns = () => {
    const [columnCount, setColumnCount] = useState(1);
    
    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width >= 1280) {
          setColumnCount(4);
        } else if (width >= 1024) {
          setColumnCount(3);
        } else if (width >= 640) {
          setColumnCount(2);
        } else {
          setColumnCount(1);
        }
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return columnCount;
  };

  const currentColumnCount = useResponsiveColumns();

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch categories
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('category_canonid', { ascending: true });
        
        if (catError) throw catError;
        
        // Fetch all songs
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .eq('song_placeholder', false)
          .order('song_categoryorder', { ascending: true });
        
        if (songsError) throw songsError;
        
        setCategories(categoriesData || []);
        setSongs(songsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Group songs by category
  const songsByCategory = React.useMemo(() => {
    const grouped: Record<string, Song[]> = {};
    
    categories.forEach(category => {
      const categorySongs = songs.filter(
        song => song.song_category === category.category
      );
      
      const sortedSongs = categorySongs.sort((a, b) => {
        if (a.song_categoryorder !== b.song_categoryorder) {
          return a.song_categoryorder - b.song_categoryorder;
        }
        return a.song.localeCompare(b.song);
      });
      
      grouped[category.category] = sortedSongs;
    });
    
    return grouped;
  }, [songs, categories]);

  // Separate categories into sections
  const sectionedCategories = React.useMemo(() => {
    // Filter by category_type
    const gooseCategories = categories.filter(cat => 
      ['Goose', 'Goose Misc', 'Ted Tapes'].includes(cat.category_type)
    );
    
    const coverCategories = categories.filter(cat => 
      ['Cover Songs', 'Live Collaborations'].includes(cat.category_type)
    );
    
    const otherCategories = categories.filter(cat => 
      cat.category_type === 'Goose-adjacent'
    );
    
    return { 
      goose: gooseCategories, 
      covers: coverCategories, 
      other: otherCategories 
    };
  }, [categories]);

  // Create columns for category layout
  const createCategoryColumns = (sectionCategories: Category[], numColumns: number = 4) => {
    const sortedCategories = [...sectionCategories].sort(
      (a, b) => a.category_canonid - b.category_canonid
    );
    
    if (numColumns === 1) {
      return [sortedCategories];
    }
    
    const totalCategories = sortedCategories.length;
    const result: Category[][] = Array.from({ length: numColumns }, () => []);
    
    const rowsNeeded = Math.ceil(totalCategories / numColumns);
    
    const grid: Category[][] = [];
    for (let i = 0; i < rowsNeeded; i++) {
      grid.push([]);
      for (let j = 0; j < numColumns; j++) {
        const index = i + j * rowsNeeded;
        if (index < totalCategories) {
          grid[i].push(sortedCategories[index]);
        }
      }
    }
    
    for (let col = 0; col < numColumns; col++) {
      for (let row = 0; row < rowsNeeded; row++) {
        if (grid[row] && grid[row][col]) {
          result[col].push(grid[row][col]);
        }
      }
    }
    
    return result;
  };

  // Create columns for each section
  const gooseColumns = React.useMemo(() => 
    createCategoryColumns(sectionedCategories.goose, currentColumnCount),
    [sectionedCategories.goose, currentColumnCount]
  );

  const coversColumns = React.useMemo(() => 
    createCategoryColumns(sectionedCategories.covers, Math.min(currentColumnCount, 2)),
    [sectionedCategories.covers, currentColumnCount]
  );

  const otherColumns = React.useMemo(() => 
    createCategoryColumns(sectionedCategories.other, currentColumnCount),
    [sectionedCategories.other, currentColumnCount]
  );

  // Render a category section
  const renderCategorySection = (columns: Category[][], title: string, sectionType: 'goose' | 'covers' | 'other') => {
    if (columns.flat().length === 0) return null;
    
    const getCoverSongGridClass = () => {
      if (sectionType !== 'covers') return "space-y-0";
      return `grid ${
        currentColumnCount === 4 || (currentColumnCount === 2 && window.innerWidth < 1024) 
          ? 'grid-cols-2' 
          : 'grid-cols-1'
      } gap-x-2 gap-y-0`;
    };
    
    const songListClass = getCoverSongGridClass();
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          {title}
        </h3>
        <div className={`grid grid-cols-1 ${
          sectionType === 'covers' 
            ? 'sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2' 
            : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        } gap-6`}>
          {columns.map((columnCategories, columnIndex) => (
            <div key={`${title}-column-${columnIndex}`} className="flex flex-col gap-6">
              {columnCategories.map(category => {
                const categorySongs = songsByCategory[category.category] || [];
                
                return (
                  <div 
                    key={category.category} 
                    className="bg-primary rounded-lg p-3 border border-secondary h-auto w-full relative"
                  >
                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-secondary">
                      <h4 className="text-lg font-medium text-fifth leading-[1.25rem] pl-0.5">
                        {category.category}
                      </h4>
                      {category.category_artwork && (
                        <div className="h-7 flex-shrink-0">
                          <img 
                            src={category.category_artwork} 
                            alt={`${category.category} artwork`}
                            className="h-full object-contain rounded border border-secondary"
                          />
                        </div>
                      )}
                    </div>
                    <ul className={songListClass}>
                      {categorySongs.map(song => (
                        <li 
                          key={song.song_id} 
                          className="text-xs hover:bg-tertiary/40 transition-colors py-0.5 px-1 rounded cursor-pointer"
                          onClick={() => navigate(`/song/${song.song_id}`)}
                        >
                          <span className="font-light hover:underline transition-colors text-left text-xs text-fifth">
                            {song.song}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-center items-center h-56">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-fifth mt-4">Loading songs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">
          Songs
        </h1>
        <SongSearch />
      </div>
      <div className="pb-8">
        {renderCategorySection(gooseColumns, "Goose Songs", 'goose')}
        {renderCategorySection(coversColumns, "Cover Songs", 'covers')}
        {renderCategorySection(otherColumns, "Other Songs", 'other')}
      </div>
    </div>
  );
}