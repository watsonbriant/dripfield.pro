import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SongSearch } from './SongSearch';

// Hook to get current column count based on window width
const useColumnCount = (isCoverSongs: boolean) => {
  const [columnCount, setColumnCount] = useState(1);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (isCoverSongs) {
        // Cover Songs: 1 column on mobile, 2 on sm+
        setColumnCount(width >= 640 ? 2 : 1);
      } else {
        // Other sections: 1, 2, 3, or 5 columns based on breakpoints
        if (width >= 1024) {
          setColumnCount(5);
        } else if (width >= 768) {
          setColumnCount(3);
        } else if (width >= 640) {
          setColumnCount(2);
        } else {
          setColumnCount(1);
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCoverSongs]);
  
  return columnCount;
};

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
        
        // Fetch songs with pagination strategy
        // First get the total count
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('song_placeholder', false);
        
        if (countError) {
          console.error('Error fetching songs count:', countError);
          throw countError;
        }
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allSongsData: Song[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('song_placeholder', false)
            .order('song_categoryorder', { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`Error fetching songs batch ${i + 1}:`, error);
            throw error;
          }
          
          if (data) {
            allSongsData = [...allSongsData, ...data];
          }
        }
        
        if (allSongsData.length > 0) {
          setSongs(allSongsData);
        } else {
          console.warn('❌ No songs data returned from query');
          setSongs([]);
        }
        
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSongs([]);
        setCategories([]);
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

  // Separate categories into sections based on category_canonid
  const sectionedCategories = React.useMemo(() => {
    // Sort all categories by category_canonid first
    const sortedCategories = [...categories].sort((a, b) => a.category_canonid - b.category_canonid);
    
    // Studio Releases: category_canonid <= 20
    const studioReleases = sortedCategories.filter(cat => cat.category_canonid <= 20);
    
    // Live-Only Songs: category_canonid between 20 and 70, OR category_canonid = 98
    const liveOnlySongs = sortedCategories.filter(cat => 
      (cat.category_canonid >= 21 && cat.category_canonid <= 70) || cat.category_canonid === 98
    );
    
    // Ted Tapes Songs/Jams: category_canonid between 71 and 97
    const tedTapesSongs = sortedCategories.filter(cat => 
      cat.category_canonid >= 71 && cat.category_canonid <= 97
    );
    
    // Cover Songs: category_canonid = 99 or 100
    const coverSongs = sortedCategories.filter(cat => 
      cat.category_canonid === 99 || cat.category_canonid === 100
    );
    
    // Side Projects: category_canonid > 100
    const sideProjects = sortedCategories.filter(cat => cat.category_canonid > 100);
    
    return { 
      studioReleases, 
      liveOnlySongs, 
      tedTapesSongs,
      coverSongs,
      sideProjects
    };
  }, [categories]);

  // Organize categories into columns (top-to-bottom instead of left-to-right)
  const organizeIntoColumns = (categories: Category[], numColumns: number): Category[][] => {
    if (numColumns === 1) return [categories];
    
    const columns: Category[][] = Array.from({ length: numColumns }, () => []);
    const numRows = Math.ceil(categories.length / numColumns);
    
    categories.forEach((category, index) => {
      const column = Math.floor(index / numRows);
      if (column < numColumns) {
        columns[column].push(category);
      }
    });
    
    return columns;
  };

  // Render a category section component
  const CategorySection = ({ sectionCategories, title }: { sectionCategories: Category[], title: string }) => {
    const isCoverSongs = title === "Cover Songs";
    const isStudioReleases = title === "Studio Releases";
    const isTedTapes = title === "Ted Tapes Songs/Jams";
    const columnCount = useColumnCount(isCoverSongs);
    const organizedColumns = organizeIntoColumns(sectionCategories, columnCount);
    
    if (sectionCategories.length === 0) return null;
    
    // Cover Songs section uses 2 columns, others use responsive 1-5 columns
    const gridClasses = isCoverSongs
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0 items-start -my-[1px]"
      : isStudioReleases
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-0 items-start -my-[1px]"
        : isTedTapes
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-2 gap-y-0 items-start -my-[1px]"
          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-0 items-start -my-[1px]";
    
    return (
      <div className="mb-8">
        <div className="bg-primary border border-fourth">
          <div className="bg-fourth text-white px-2 py-0.5">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
          </div>
        </div>
        <div className={gridClasses}>
          {organizedColumns.map((columnCategories, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-0">
              {columnCategories.map((category, categoryIndex) => {
              const categorySongs = songsByCategory[category.category] || [];
              const isFirstInColumn = categoryIndex === 0;
              const isLastInColumn = categoryIndex === columnCategories.length - 1;
              
              return (
                <div 
                  key={category.category} 
                  className={`bg-primary border-l border-r border-fourth w-full ${
                    isFirstInColumn ? 'border-t' : ''
                  } ${
                    isLastInColumn ? 'border-b' : ''
                  } ${!isFirstInColumn ? '-mt-[1px]' : ''}`}
                >
                <div className="bg-tertiary/50 text-fifth py-[3px] flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fifth pl-2 leading-[0.75rem] pr-2">
                    {category.category}
                  </h4>
                  {category.category_artwork && (
                    <div className="flex-shrink-0 pr-0.5">
                      <img 
                        src={category.category_artwork} 
                        alt={`${category.category} artwork`}
                        className="h-[16px] object-contain rounded border border-fourth"
                      />
                    </div>
                  )}
                </div>
                <ul className={title === "Cover Songs" ? "grid grid-cols-1 sm:grid-cols-2 gap-0" : ""}>
                  {categorySongs.map(song => (
                    <li 
                      key={song.song_id} 
                      className="bg-primary hover:bg-tertiary/30 transition-colors text-[0.625rem] leading-[0.625rem] py-0.5 px-2"
                    >
                      <Link 
                        to={`/song/${song.song_id}`}
                        className="font-normal tracking-tight hover:underline transition-colors text-left text-fifth block"
                      >
                        {song.song}
                      </Link>
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
      <div className="w-full">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px]">
      <div className="mb-4">
        <div className="bg-primary border border-fourth">
          <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
            <h1 className="text-sm font-semibold pl-2">
              Songs
            </h1>
            <SongSearch />
          </div>
        </div>
      </div>
      <div className="pb-8">
        <CategorySection sectionCategories={sectionedCategories.studioReleases} title="Studio Releases" />
        <CategorySection sectionCategories={sectionedCategories.liveOnlySongs} title="Live-Only Songs" />
        <CategorySection sectionCategories={sectionedCategories.tedTapesSongs} title="Ted Tapes Songs/Jams" />
        <CategorySection sectionCategories={sectionedCategories.coverSongs} title="Cover Songs" />
        <CategorySection sectionCategories={sectionedCategories.sideProjects} title="Side Projects" />
      </div>
    </div>
  );
}