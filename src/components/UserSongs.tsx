import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CircularProgress from './CircularProgress';
import { useUserSongsData } from '../hooks/useUserSongsData';

type Song = {
  song: string;
  song_id: string;
  song_category: string;
  song_categoryorder: number;
  song_originalartist: string;
};

type Category = {
  category: string;
  category_canonid: number;
  category_display_name: string;
  category_color1: string;
  category_color2: string;
  category_artwork: string;
};

interface UserSongsProps {
  userId?: string;
}

const UserSongs: React.FC<UserSongsProps> = ({ userId }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Use custom hooks for data
  const { categories, songs, userSongStats, loading, loadingProgress } = useUserSongsData(effectiveUserId);

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

  // Group songs by category
  const songsByCategory = React.useMemo(() => {
    const grouped: Record<string, Song[]> = {};
    
    categories.forEach(category => {
      // Filter songs for this category
      const categorySongs = songs.filter(
        song => song.song_category === category.category
      );
      
      // Sort by song_categoryorder first, then alphabetically by song name
      const sortedSongs = categorySongs.sort((a, b) => {
        // First compare by categoryorder
        if (a.song_categoryorder !== b.song_categoryorder) {
          return a.song_categoryorder - b.song_categoryorder;
        }
        // If categoryorder is the same, sort alphabetically
        return a.song.localeCompare(b.song);
      });
      
      grouped[category.category] = sortedSongs;
    });
    
    return grouped;
  }, [songs, categories]);

  // Separate categories into sections based on category_canonid (matching Songs.tsx)
  const sectionedCategories = React.useMemo(() => {
    // Sort all categories by category_canonid first
    const sortedCategories = [...categories].sort((a, b) => a.category_canonid - b.category_canonid);
    
    // Studio Releases: category_canonid <= 20
    const studioReleases = sortedCategories.filter(cat => cat.category_canonid <= 20);
    
    // Live-Only Songs: category_canonid between 21 and 170, OR category_canonid = 298
    const liveOnlySongs = sortedCategories.filter(cat => 
      (cat.category_canonid >= 21 && cat.category_canonid <= 170) || cat.category_canonid === 298
    );
    
    // Ted Tapes Songs/Jams: category_canonid between 171 and 297
    const tedTapesSongs = sortedCategories.filter(cat => 
      cat.category_canonid >= 171 && cat.category_canonid <= 297
    );
    
    // Cover Songs: category_canonid = 299 or 300
    const coverSongs = sortedCategories.filter(cat => 
      cat.category_canonid === 299 || cat.category_canonid === 300
    );
    
    // Side Projects: category_canonid > 300
    const sideProjects = sortedCategories.filter(cat => cat.category_canonid > 300);
    
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


  // Get loading and empty state messages based on whose profile is being viewed
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading song data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} song data...`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-fifth mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  // Render a category section component (matching Songs.tsx structure)
  const CategorySection = ({ sectionCategories, title }: { sectionCategories: Category[], title: string }) => {
    const isCoverSongs = title === "Cover Songs";
    const isStudioReleases = title === "Studio Releases";
    const isTedTapes = title === "Ted Tapes Songs/Jams";
    const [columnCount, setColumnCount] = React.useState(1);
    
    React.useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (isCoverSongs) {
          setColumnCount(width >= 640 ? 2 : 1);
        } else {
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
    
    const organizedColumns = organizeIntoColumns(sectionCategories, columnCount);
    
    if (sectionCategories.length === 0) return null;
    
    // Get song stats for a specific song
    const getSongStats = (songId: string): { count: number, lastSeenDate?: string } => {
      const stat = userSongStats.find(s => s.song_id === songId);
      return {
        count: stat ? stat.count : 0,
        lastSeenDate: stat?.last_seen_date
      };
    };
    
    // Cover Songs section uses 2 columns, others use responsive 1-5 columns
    const gridClasses = isCoverSongs
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0 items-start -my-[1px]"
      : isStudioReleases
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-0 items-start -my-[1px]"
        : isTedTapes
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-0 items-start -my-[1px]"
          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-0 items-start -my-[1px]";
    
    return (
      <div className="mb-8">
        <div className="bg-primary border border-fourth shadow-xl">
          <div className="bg-fourth text-white px-2 py-0.5">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
          </div>
        </div>
        <div className={gridClasses}>
          {organizedColumns.map((columnCategories, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-0 shadow-xl">
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
                    <div className="bg-tertiary/50 text-fifth py-[2px] flex items-center justify-between">
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
                    <ul className={title === "Cover Songs" ? "grid grid-cols-1 sm:grid-cols-2 gap-0" : "py-0.5"}>
                      {categorySongs.map(song => {
                        const { count } = getSongStats(song.song_id);
                        const seen = count > 0;
                        
                        return (
                          <li 
                            key={song.song_id} 
                            className="bg-primary hover:bg-tertiary/30 transition-colors text-[0.625rem] leading-[0.625rem] py-0.5 px-2"
                          >
                            <Link 
                              to={`/song/${song.song_id}`}
                              className={`tracking-tight hover:underline transition-colors text-left block ${
                                seen ? 'text-fifth font-medium' : 'text-fifth/70 font-light'
                              }`}
                            >
                              {song.song}
                              {seen && (
                                <span className="ml-2 text-fifth font-normal">({count})</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
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

  return (
    <div>
      <CategorySection sectionCategories={sectionedCategories.studioReleases} title="Studio Releases" />
      <CategorySection sectionCategories={sectionedCategories.liveOnlySongs} title="Live-Only Songs" />
      <CategorySection sectionCategories={sectionedCategories.tedTapesSongs} title="Ted Tapes Songs/Jams" />
      <CategorySection sectionCategories={sectionedCategories.coverSongs} title="Cover Songs" />
      <CategorySection sectionCategories={sectionedCategories.sideProjects} title="Side Projects" />
    </div>
  );
}

export default UserSongs;