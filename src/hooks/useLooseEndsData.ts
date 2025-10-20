import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LooseEnd {
  end: string;
  end_description: string;
  end_id: string;
  end_image: string;
  end_order: number;
  end_category: string;
  end_image_collected: string;
  isCompleted?: boolean;
  end_visible: boolean;
  progress?: {
    seen: number;
    total: number;
    percentage: number;
  };
}

interface GroupedLooseEnds {
  [category: string]: LooseEnd[];
}

interface CategoryProgress {
  [categoryName: string]: {
    seen: number;
    total: number;
    percentage: number;
  };
}

interface StandInfo {
  completed: boolean;
  category: string;
}

interface StandsAttended {
  [standName: string]: StandInfo;
}

export const useLooseEndsData = (userId: string) => {
  const [groupedLooseEnds, setGroupedLooseEnds] = useState<GroupedLooseEnds>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress>({});

  useEffect(() => {
    async function fetchLooseEndsAndCheckCompletion() {
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // Fetch loose ends and user data in parallel
        const [looseEndsResult, userShowsResult] = await Promise.all([
          supabase
            .from('looseends')
            .select('end, end_description, end_id, end_image, end_order, end_category, end_image_collected, end_visible')
            .eq('end_visible', true)
            .order('end_order', { ascending: true }),
          userId ? supabase
            .from('user_attended_shows')
            .select(`
              show_id,
              shows:show_id (
                show_id,
                show_canonid,
                show_detail,
                show_year,
                show_date,
                show_tour,
                show_stand,
                show_subvenue,
                show_subvenue_venue,
                show_group
              )
            `)
            .eq('user_id', userId) : Promise.resolve({ data: [], error: null })
        ]);

        setLoadingProgress(20);

        if (looseEndsResult.error) {
          console.error('Error fetching loose ends:', looseEndsResult.error);
          setError(`Error: ${looseEndsResult.error.message}`);
          return;
        }
        
        if (!looseEndsResult.data || looseEndsResult.data.length === 0) {
          setLoading(false);
          return;
        }

        const looseEndsData = looseEndsResult.data;
        const attendedShowsData = userShowsResult.data || [];

        // Process user data in parallel
        const [
          sideProjectsAttended,
          showStats,
          standsAttended,
          fiveInARowCompleted
        ] = await Promise.all([
          processSideProjects(attendedShowsData),
          processShowStats(attendedShowsData, userId),
          processStands(attendedShowsData),
          processFiveInARow(attendedShowsData)
        ]);

        setLoadingProgress(40);

        // Process category-based loose ends
        const categoryLooseEnds = looseEndsData.filter(end => 
          end.end_category === 'Completionist'
        );

        const progress = await processCategoryProgress(categoryLooseEnds, userId, setLoadingProgress);
        
        setCategoryProgress(progress);
        setLoadingProgress(95);
        
        // Update loose ends with completion status
        const updatedLooseEnds = updateLooseEndsCompletion(
          looseEndsData,
          sideProjectsAttended,
          showStats,
          standsAttended,
          fiveInARowCompleted,
          progress
        );

        // Group loose ends by category
        const { grouped, categoryList } = groupLooseEndsByCategory(updatedLooseEnds);
        
        setGroupedLooseEnds(grouped);
        setCategories(categoryList);
        setLoadingProgress(100);
        
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Exception in fetchLooseEnds:', errorMessage);
        setError(`Exception: ${errorMessage}`);
        setLoadingProgress(100);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }

    fetchLooseEndsAndCheckCompletion();
  }, [userId]);

  return {
    groupedLooseEnds,
    categories,
    loading,
    loadingProgress,
    error,
    categoryProgress
  };
};

// Helper functions for data processing
async function processSideProjects(attendedShowsData: any[]) {
  const sideProjectsAttended = {};
  const sideProjects = ['Orebolo', 'Vasudo', 'Great Blue'];
  
  sideProjects.forEach(project => {
    sideProjectsAttended[project] = attendedShowsData.some(
      show => show.shows && show.shows.show_group === project
    );
  });
  
  return sideProjectsAttended;
}

async function processShowStats(attendedShowsData: any[], userId: string) {
  const canonicalShows = attendedShowsData
    .filter(show => show.shows && show.shows.show_canonid !== null);
  
  const canonicalShowCount = canonicalShows.length;
  let attendedGlobalShow = false;
  let debutCount = 0;
  let goosemasShowsAttended = new Set<string>();
  let tourCountsMap = {};

  // Process Goosemas shows
  canonicalShows.forEach(show => {
    if (show.shows && 
        show.shows.show_detail && 
        show.shows.show_detail.includes('Goosemas')) {
      goosemasShowsAttended.add(show.shows.show_detail);
    }
  });

  // Process tour counts
  attendedShowsData.forEach(item => {
    if (item.shows && item.shows.show_tour) {
      const tourName = item.shows.show_tour;
      tourCountsMap[tourName] = (tourCountsMap[tourName] || 0) + 1;
    }
  });

  // Check for global venues attendance
  if (canonicalShows.length > 0) {
    const { data: globalVenues } = await supabase
      .from('venues')
      .select('venue')
      .eq('venue_global', true);
    
    if (globalVenues && globalVenues.length > 0) {
      const globalVenueNames = globalVenues.map(v => v.venue);
      
      for (const show of canonicalShows) {
        if (show.shows && show.shows.show_subvenue_venue) {
          if (globalVenueNames.includes(show.shows.show_subvenue_venue)) {
            attendedGlobalShow = true;
            break;
          }
        }
      }
    }
  }

  // Check for debuts
  if (canonicalShows.length > 0) {
    const canonicalShowIds = canonicalShows.map(show => show.shows.show_id);
    const { data: debutEntries } = await supabase
      .from('setlist_entries')
      .select('entry_id, last_count')
      .in('entry_show', canonicalShowIds)
      .eq('last_count', 'Debut');

    if (debutEntries) {
      debutCount = debutEntries.length;
    }
  }

  return {
    canonicalShowCount,
    attendedGlobalShow,
    debutCount,
    goosemasShowsAttended,
    tourCountsMap
  };
}

async function processStands(attendedShowsData: any[]) {
  const standsAttended: StandsAttended = {};
  const attendedShowIds = new Set(
    attendedShowsData
      .filter(item => item.shows)
      .map(item => item.shows.show_id)
  );

  const userStands = new Set(
    attendedShowsData
      .filter(item => item.shows && item.shows.show_stand)
      .map(item => item.shows.show_stand)
  );

  // Process stands in parallel
  const standPromises = Array.from(userStands).map(async (standName) => {
    const { data: allStandShows } = await supabase
      .from('shows')
      .select('show_id')
      .eq('show_stand', standName);
      
    if (!allStandShows || allStandShows.length === 0) return null;
    
    const allStandShowIds = allStandShows.map(show => show.show_id);
    const allAttended = allStandShowIds.every(showId => attendedShowIds.has(showId));
    
    if (allAttended) {
      const { data: standData } = await supabase
        .from('stands')
        .select(`
          stand_category,
          stand_categories:stand_category (
            stand_category
          )
        `)
        .eq('stand', standName)
        .single();
        
      if (standData && standData.stand_categories) {
        return {
          standName,
          info: {
            completed: true,
            category: standData.stand_categories.stand_category
          }
        };
      }
    }
    return null;
  });

  const standResults = await Promise.all(standPromises);
  standResults.forEach(result => {
    if (result) {
      standsAttended[result.standName] = result.info;
    }
  });

  return standsAttended;
}

async function processFiveInARow(attendedShowsData: any[]) {
  const canonicalShows = attendedShowsData
    .filter(show => show.shows && show.shows.show_canonid !== null);

  const showsByTour = {};
  canonicalShows
    .filter(item => item.shows && item.shows.show_tour && item.shows.show_canonid)
    .forEach(item => {
      const tourName = item.shows.show_tour;
      if (!showsByTour[tourName]) {
        showsByTour[tourName] = [];
      }
      showsByTour[tourName].push({
        id: item.shows.show_id,
        canonId: item.shows.show_canonid
      });
    });

  let fiveInARowCompleted = false;
  Object.entries(showsByTour).forEach(([tourName, shows]) => {
    const sortedShows = [...shows].sort((a, b) => a.canonId - b.canonId);
    
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedShows.length; i++) {
      if (sortedShows[i].canonId === sortedShows[i-1].canonId + 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    if (maxConsecutive >= 5) {
      fiveInARowCompleted = true;
    }
  });

  return fiveInARowCompleted;
}

async function processCategoryProgress(categoryLooseEnds: any[], userId: string, setLoadingProgress: (progress: number) => void) {
  const { data: allCategories } = await supabase
    .from('categories')
    .select('category');

  const categoryMapping: {[key: string]: string} = {};
  if (allCategories) {
    for (const looseEnd of categoryLooseEnds) {
      const matchingCategory = allCategories.find(cat => 
        cat.category.toLowerCase() === looseEnd.end.toLowerCase()
      );
      if (matchingCategory) {
        categoryMapping[looseEnd.end] = matchingCategory.category;
      }
    }
  }

  const progress: CategoryProgress = {};
  const totalCategories = categoryLooseEnds.length;

  // Process categories in parallel batches
  const batchSize = 5;
  for (let i = 0; i < categoryLooseEnds.length; i += batchSize) {
    const batch = categoryLooseEnds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (looseEnd) => {
      const categoryName = categoryMapping[looseEnd.end] || looseEnd.end;
      
      const [songsResult, attendedShowsResult] = await Promise.all([
        supabase
          .from('songs')
          .select('song')
          .eq('song_category', categoryName),
        userId ? supabase
          .from('user_attended_shows')
          .select('show_id')
          .eq('user_id', userId) : Promise.resolve({ data: [], error: null })
      ]);

      if (songsResult.error || !songsResult.data || songsResult.data.length === 0) {
        return { key: looseEnd.end, progress: { seen: 0, total: 10, percentage: 0 } };
      }

      const totalSongsInCategory = songsResult.data.length;
      const songNamesInCategory = songsResult.data.map(s => s.song);
      let seenCount = 0;

      if (attendedShowsResult.data && attendedShowsResult.data.length > 0) {
        const attendedShowIds = attendedShowsResult.data.map(show => show.show_id);
        
        const { data: entries } = await supabase
          .from('setlist_entries')
          .select('entry_song')
          .in('entry_show', attendedShowIds)
          .in('entry_song', songNamesInCategory);

        if (entries && entries.length > 0) {
          const uniqueSongsSeen = [...new Set(entries.map(e => e.entry_song))];
          seenCount = uniqueSongsSeen.length;
        }
      }

      const percentage = totalSongsInCategory > 0 
        ? Math.round((seenCount / totalSongsInCategory) * 100) 
        : 0;

      return {
        key: looseEnd.end,
        progress: {
          seen: seenCount,
          total: totalSongsInCategory,
          percentage: percentage
        }
      };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(result => {
      progress[result.key] = result.progress;
    });

    // Update progress
    const processedCategories = Math.min(i + batchSize, totalCategories);
    const categoryProgress = processedCategories / totalCategories;
    setLoadingProgress(Math.min(90, 50 + (categoryProgress * 40)));
  }

  return progress;
}

function updateLooseEndsCompletion(
  looseEndsData: any[],
  sideProjectsAttended: any,
  showStats: any,
  standsAttended: StandsAttended,
  fiveInARowCompleted: boolean,
  progress: CategoryProgress
) {
  return looseEndsData.map(looseEnd => {
    if (looseEnd.end_category === 'Completionist') {
      const categoryProgressData = progress[looseEnd.end] || { seen: 0, total: 10, percentage: 0 };
      const isComplete = categoryProgressData.seen >= categoryProgressData.total && categoryProgressData.total > 0;
      
      return { 
        ...looseEnd, 
        isCompleted: isComplete,
        progress: categoryProgressData
      };
    } 
    else if (looseEnd.end_category === 'Side Projects') {
      const isComplete = sideProjectsAttended[looseEnd.end] || false;
      return { ...looseEnd, isCompleted: isComplete };
    }
    else if (looseEnd.end_category === 'Song Debuts') {
      let requiredDebuts = 0;
      if (looseEnd.end.startsWith('Debut x')) {
        requiredDebuts = parseInt(looseEnd.end.replace('Debut x', ''), 10);
      }
      const isComplete = !isNaN(requiredDebuts) && showStats.debutCount >= requiredDebuts;
      return { ...looseEnd, isCompleted: isComplete };
    }
    else if (looseEnd.end_category === 'Goosemas') {
      let requiredShows = 0;
      if (looseEnd.end.startsWith('Goosemas x')) {
        requiredShows = parseInt(looseEnd.end.replace('Goosemas x', ''), 10);
      }
      const showsAttended = showStats.goosemasShowsAttended.size;
      const isComplete = !isNaN(requiredShows) && showsAttended >= requiredShows;
      return { ...looseEnd, isCompleted: isComplete };
    }
    else if (looseEnd.end_category === 'Tour Stats') {
      let isComplete = false;
      
      if (looseEnd.end === 'Tour x5') {
        isComplete = Object.values(showStats.tourCountsMap).some(count => count >= 5);
      }
      else if (looseEnd.end === 'Tour x10') {
        isComplete = Object.values(showStats.tourCountsMap).some(count => count >= 10);
      }
      else if (looseEnd.end === 'Five in a Row') {
        isComplete = fiveInARowCompleted;
      }
      else if (looseEnd.end.includes('Night Stand')) {
        isComplete = Object.values(standsAttended).some(
          stand => stand.completed && stand.category === looseEnd.end
        );
      }
      
      return { ...looseEnd, isCompleted: isComplete };
    }
    else if (looseEnd.end_category === 'Show Stats') {
      let isComplete = false;
      
      if (looseEnd.end.startsWith('Goose x')) {
        const requiredShows = parseInt(looseEnd.end.replace('Goose x', ''), 10);
        isComplete = !isNaN(requiredShows) && showStats.canonicalShowCount >= requiredShows;
      }
      else if (looseEnd.end === "Goin' Global") {
        isComplete = showStats.attendedGlobalShow;
      }
      
      return { ...looseEnd, isCompleted: isComplete };
    }
    
    return { ...looseEnd, isCompleted: false };
  });
}

function groupLooseEndsByCategory(updatedLooseEnds: any[]) {
  const grouped: GroupedLooseEnds = {};
  const categoryList: string[] = [];
  
  updatedLooseEnds.forEach((looseEnd) => {
    const category = looseEnd.end_category || 'Uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = [];
      categoryList.push(category);
    }
    
    grouped[category].push(looseEnd);
  });

  return { grouped, categoryList };
}
