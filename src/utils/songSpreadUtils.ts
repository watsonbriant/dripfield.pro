import { supabase } from '../lib/supabase';

export interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

export const prepareSongSpreadData = async (
  matrixData: Record<string, Array<any>>,
  categoryMap: Record<string, { category: string, canonid: number, artist?: string }>
): Promise<SongSpreadItem[]> => {
  // Group songs by category and count performances
  const categorySongs: Record<string, Array<{song: string, playCount: number, artist?: string}>> = {};
  const categoryTotalPerformances: Record<string, number> = {};
  
  // Process each song in the matrix
  Object.entries(matrixData).forEach(([song, performances]) => {
    const songInfo = categoryMap[song] || { category: 'Uncategorized', canonid: 9999 };
    const category = songInfo.category;
    const playCount = performances.length; // Number of shows where this song was played
    
    if (!categorySongs[category]) {
      categorySongs[category] = [];
      categoryTotalPerformances[category] = 0;
    }
    
    categorySongs[category].push({
      song,
      playCount,
      artist: songInfo.artist
    });
    
    // Add to total performances for this category
    categoryTotalPerformances[category] += playCount;
  });
  
  // Get category canon IDs
  const categoryCanonIds: Record<string, number> = {};
  Object.values(categoryMap).forEach(info => {
    if (!categoryCanonIds[info.category]) {
      categoryCanonIds[info.category] = info.canonid;
    }
  });
  
  // Fetch category artwork first
  let categoryArtwork: Record<string, string | null> = {};
  try {
    const categories = Object.values(categoryMap).map(info => info.category);
    const { data: categoriesData, error } = await supabase
      .from('categories')
      .select('category, category_artwork')
      .in('category', categories);
      
    if (!error && categoriesData) {
      categoriesData.forEach(cat => {
        categoryArtwork[cat.category] = cat.category_artwork;
      });
    }
  } catch (error) {
    console.error('Error fetching category artwork:', error);
  }
  
  // Now that we have artwork, create the spread data
  const spreadData = Object.keys(categoryTotalPerformances).map(category => ({
    category,
    count: categoryTotalPerformances[category],
    canonid: categoryCanonIds[category] || 9999,
    artwork: categoryArtwork[category] || null,
    songs: categorySongs[category].sort((a, b) => a.song.localeCompare(b.song)) // Sort alphabetically like TourSongSpread
  })).sort((a, b) => a.canonid - b.canonid);
  
  return spreadData;
};
