import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CircularProgress from './CircularProgress';
import CategorySection from './CategorySection';
import { useUserSongsData } from '../hooks/useUserSongsData';
import { useResponsiveColumns } from '../hooks/useResponsiveColumns';
import { useCategoryColumns } from '../hooks/useCategoryColumns';

type Song = {
  song: string;
  song_id: string;
  song_category: string;
  song_categoryorder: number;
  song_originalartist: string;
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

  // Use custom hooks for data and responsive behavior
  const { categories, songs, userSongStats, loading, loadingProgress } = useUserSongsData(effectiveUserId);
  const currentColumnCount = useResponsiveColumns();

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

  // Separate categories into three sections based on category_canonid
  const sectionedCategories = React.useMemo(() => {
    // First section: Categories with canonid 1-98
    const section1 = categories.filter(cat => cat.category_canonid >= 1 && cat.category_canonid <= 98);
    
    // Second section: Categories with canonid 99 and 100
    const section2 = categories.filter(cat => cat.category_canonid === 99 || cat.category_canonid === 100);
    
    // Third section: Categories with canonid 101+
    const section3 = categories.filter(cat => cat.category_canonid >= 101);

    return { section1, section2, section3 };
  }, [categories]);

  // Create columns for each section, using the currentColumnCount for responsive sizing
  const section1Columns = React.useMemo(() => {
    // For original songs: 4 columns on xl, 3 on lg, 2 on sm, 1 on xs
    let cols = currentColumnCount;
    return useCategoryColumns(sectionedCategories.section1, cols);
  }, [sectionedCategories.section1, currentColumnCount]);
  
  // Section 2: Covers - maximum of 2 columns
  const section2Columns = React.useMemo(() => {
    // For covers: 2 columns max, 1 on mobile
    let cols = Math.min(currentColumnCount, 2);
    return useCategoryColumns(sectionedCategories.section2, cols);
  }, [sectionedCategories.section2, currentColumnCount]);
  
  // Section 3: Other Songs - same responsive behavior as section 1
  const section3Columns = React.useMemo(() => {
    // For other songs: 4 columns on xl, 3 on lg, 2 on sm, 1 on xs
    let cols = currentColumnCount;
    return useCategoryColumns(sectionedCategories.section3, cols);
  }, [sectionedCategories.section3, currentColumnCount]);

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

  return (
    <div>
      {/* Section 1: Categories with canonid 1-98 */}
      <CategorySection 
        columns={section1Columns}
        title="Original Songs"
        sectionType="original"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        currentColumnCount={currentColumnCount}
      />
      
      {/* Section 2: Categories with canonid 99-100 */}
      <CategorySection 
        columns={section2Columns}
        title="Covers"
        sectionType="covers"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        currentColumnCount={currentColumnCount}
      />
      
      {/* Section 3: Categories with canonid 101+ */}
      <CategorySection 
        columns={section3Columns}
        title="Other Songs"
        sectionType="other"
        songsByCategory={songsByCategory}
        userSongStats={userSongStats}
        currentColumnCount={currentColumnCount}
      />
    </div>
  );
}

export default UserSongs;