import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// CircularProgress component copied from UserSongs
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#dad0bc" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#8ec1b6" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-bold text-fifth">
        {Math.round(value)}%
      </div>
    </div>
  );
};

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

export const LooseEnds: React.FC<{ userId: string }> = ({ userId }) => {
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
        
        // Fetch all loose ends
        setLoadingProgress(10);
        const { data: looseEndsData, error: looseEndsError } = await supabase
            .from('looseends')
            .select('end, end_description, end_id, end_image, end_order, end_category, end_image_collected, end_visible')
            .eq('end_visible', true)
            .order('end_order', { ascending: true });

        if (looseEndsError) {
          console.error('Error fetching loose ends:', looseEndsError);
          setError(`Error: ${looseEndsError.message}`);
          return;
        }
        
        if (!looseEndsData || looseEndsData.length === 0) {
          setLoading(false);
          return;
        }

        setLoadingProgress(20);

        // First, we need to check for side project attendance
        setLoadingProgress(25);
        let sideProjectsAttended = {};
        if (userId) {
          try {
            // Get all shows the user has attended with their show_group field
            const { data: attendedShowsWithGroup, error: attendedShowsError } = await supabase
              .from('user_attended_shows')
              .select(`
                show_id,
                shows:show_id (
                  show_group
                )
              `)
              .eq('user_id', userId);

            if (attendedShowsError) {
              console.error('Error fetching user attended shows with groups:', attendedShowsError);
            } else if (attendedShowsWithGroup && attendedShowsWithGroup.length > 0) {
              // Track which side projects the user has attended
              const sideProjects = ['Orebolo', 'Vasudo', 'Great Blue'];
              sideProjects.forEach(project => {
                sideProjectsAttended[project] = attendedShowsWithGroup.some(
                  show => show.shows && show.shows.show_group === project
                );
              });
            }
          } catch (err) {
            console.error('Error checking side project attendance:', err);
          }
        }
        
        // After checking side projects, process debuts, Goosemas, and tour stats
        setLoadingProgress(27);
        let debutCount = 0;
        let goosemasShowsAttended = new Set<string>();
        
        // Initialize tour-related statistics
        let tourCountsMap = {};
        let standsAttended: StandsAttended = {};
        let fiveInARowCompleted = false;
        
        // Initialize show stats variables
        let canonicalShowCount = 0;
        let attendedGlobalShow = false;

        if (userId) {
          try {
            // First get the user's attended shows with all required data
            const { data: attendedShowsData, error: showsError } = await supabase
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
                  show_subvenue_venue
                )
              `)
              .eq('user_id', userId);

            if (showsError) {
              console.error('Error fetching user attended shows with details:', showsError);
            } else if (attendedShowsData && attendedShowsData.length > 0) {
              // Get canonical shows for debut tracking
              const canonicalShows = attendedShowsData
                .filter(show => show.shows && show.shows.show_canonid !== null);
                
              const canonicalShowIds = canonicalShows
                .map(show => show.shows.show_id);
              
              // Count canonical shows for Show Stats
              canonicalShowCount = canonicalShows.length;

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

              // Create a set of attended show IDs for easier lookup
              const attendedShowIds = new Set(
                attendedShowsData
                  .filter(item => item.shows)
                  .map(item => item.shows.show_id)
              );

              // Check for global venues attendance
              if (canonicalShows.length > 0) {
                // Get venues with global flag
                const { data: globalVenues, error: venuesError } = await supabase
                  .from('venues')
                  .select('venue')
                  .eq('venue_global', true);
                
                if (venuesError) {
                  console.error('Error fetching global venues:', venuesError);
                } else if (globalVenues && globalVenues.length > 0) {
                  // Extract venue names
                  const globalVenueNames = globalVenues.map(v => v.venue);
                  
                  // Check if user has attended any show at these venues
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

              // First, get all the unique stands from the user's attended shows
              const userStands = new Set(
                attendedShowsData
                  .filter(item => item.shows && item.shows.show_stand)
                  .map(item => item.shows.show_stand)
              );

              // For each stand the user has attended at least one show of
              for (const standName of userStands) {
                // Get ALL shows in this stand (not just attended ones)
                const { data: allStandShows, error: standShowsError } = await supabase
                  .from('shows')
                  .select('show_id')
                  .eq('show_stand', standName);
                  
                if (standShowsError) {
                  console.error(`Error fetching shows for stand ${standName}:`, standShowsError);
                  continue;
                }
                
                if (!allStandShows || allStandShows.length === 0) continue;
                
                // Check if user has attended ALL shows in this stand
                const allStandShowIds = allStandShows.map(show => show.show_id);
                const allAttended = allStandShowIds.every(showId => attendedShowIds.has(showId));
                
                if (allAttended) {
                  // Get the category for this stand
                  const { data: standData, error: standError } = await supabase
                    .from('stands')
                    .select(`
                      stand_category,
                      stand_categories:stand_category (
                        stand_category
                      )
                    `)
                    .eq('stand', standName)
                    .single();
                    
                  if (standError) {
                    console.error(`Error fetching stand info for ${standName}:`, standError);
                    continue;
                  }
                  
                  if (standData && standData.stand_categories) {
                    standsAttended[standName] = {
                      completed: true,
                      category: standData.stand_categories.stand_category
                    };
                  }
                }
              }

              // Check for Five in a Row (consecutive shows by canonId in same tour)
              // Group shows by tour
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

              // For each tour, check for 5 consecutive shows by canonId
              Object.entries(showsByTour).forEach(([tourName, shows]) => {
                // Sort shows by canonical ID
                const sortedShows = [...shows].sort((a, b) => a.canonId - b.canonId);
                
                let maxConsecutive = 1;
                let currentConsecutive = 1;
                
                for (let i = 1; i < sortedShows.length; i++) {
                  // Check if this show's canonId is exactly one more than the previous
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

              // Check for debuts
              if (canonicalShowIds.length > 0) {
                // Get setlist entries that are debuts for these shows
                const { data: debutEntries, error: entriesError } = await supabase
                  .from('setlist_entries')
                  .select('entry_id, last_count')
                  .in('entry_show', canonicalShowIds)
                  .eq('last_count', 'Debut');

                if (entriesError) {
                  console.error('Error fetching debut entries:', entriesError);
                } else if (debutEntries) {
                  debutCount = debutEntries.length;
                }
              }
            }
          } catch (err) {
            console.error('Error in show analysis:', err);
          }
        }

        // Find the special category-based loose ends
        const categoryLooseEnds = looseEndsData.filter(end => 
          end.end_category === 'Completionist'
        );
        
        // Extract category names from these special loose ends
        const categoryNames = categoryLooseEnds.map(end => end.end);

        setLoadingProgress(30);
        // First, we need to get all categories from the database to match correctly
        const { data: allCategories, error: categoriesError } = await supabase
          .from('categories')
          .select('category');
          
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setError(`Error fetching categories: ${categoriesError.message}`);
          return;
        }
        
        setLoadingProgress(40);
        // Create a mapping from Loose End display names to actual category names
        // This is important since the Loose End "end" field might not match exactly with category names
        const categoryMapping: {[key: string]: string} = {};
        
        if (allCategories) {
          // For each Loose End in the Completionist category, try to find a matching category
          for (const looseEnd of categoryLooseEnds) {
            // Find the best match (exact match or closest string)
            const matchingCategory = allCategories.find(cat => 
              cat.category.toLowerCase() === looseEnd.end.toLowerCase()
            );
            
            if (matchingCategory) {
              categoryMapping[looseEnd.end] = matchingCategory.category;
            }
          }
        }

        setLoadingProgress(50);
        // Initialize category progress tracking
        let progress: CategoryProgress = {};

        // For each category-based Loose End, check completion status
        let processedCategories = 0;
        const totalCategories = categoryLooseEnds.length;
        
        for (const looseEnd of categoryLooseEnds) {
          try {
            // Get the actual category name
            const categoryName = categoryMapping[looseEnd.end] || looseEnd.end;
            
            // Get all songs in this category
            const { data: songsInCategory, error: categoryError } = await supabase
              .from('songs')
              .select('song')
              .eq('song_category', categoryName);
              
            if (categoryError) {
              console.error(`Error fetching songs for category ${categoryName}:`, categoryError);
              // Initialize with zero progress but show that there are songs in the category
              // We'll set a placeholder total of 10 to avoid 0/0
              progress[looseEnd.end] = { seen: 0, total: 10, percentage: 0 };
              continue;
            }
            
            if (!songsInCategory || songsInCategory.length === 0) {
              // Even if no songs found, show a progress bar with 0% of 10 songs
              progress[looseEnd.end] = { seen: 0, total: 10, percentage: 0 };
              continue;
            }
            
            const totalSongsInCategory = songsInCategory.length;
            const songNamesInCategory = songsInCategory.map(s => s.song);
            
            let seenCount = 0;
            
            if (userId) {
                try {
                  // Get the user's attended shows
                  const { data: attendedShows, error: attendedError } = await supabase
                    .from('user_attended_shows')
                    .select('show_id')
                    .eq('user_id', userId);
              
                  if (attendedError) {
                    console.error('Error fetching user attended shows:', attendedError);
                    return;
                  }
                  
                  if (!attendedShows || attendedShows.length === 0) {
                    return;
                  }
              
                  // Get the IDs of all attended shows
                  const attendedShowIds = attendedShows.map(show => show.show_id);
              
                  // Get setlist entries for these shows that match songs in this category
                  const { data: entries, error: entriesError } = await supabase
                    .from('setlist_entries')
                    .select('entry_song')
                    .in('entry_show', attendedShowIds)
                    .in('entry_song', songNamesInCategory);
              
                  if (entriesError) {
                    console.error('Error fetching setlist entries:', entriesError);
                    return;
                  }
              
                  if (entries && entries.length > 0) {
                    // Get unique songs seen
                    const uniqueSongsSeen = [...new Set(entries.map(e => e.entry_song))];
                    seenCount = uniqueSongsSeen.length;
                  }
                } catch (err) {
                  console.error('Error in show processing:', err);
                }
              }
            
            const percentage = totalSongsInCategory > 0 
              ? Math.round((seenCount / totalSongsInCategory) * 100) 
              : 0;
            
            // Store progress information
            progress[looseEnd.end] = {
              seen: seenCount,
              total: totalSongsInCategory,
              percentage: percentage
            };
            
            // Update progress for each processed category
            processedCategories++;
            // Calculate loading progress from 50% to 90% based on category processing
            const categoryProgress = processedCategories / totalCategories;
            setLoadingProgress(Math.min(90, 50 + (categoryProgress * 40)));
            
          } catch (categoryCheckError) {
            console.error(`Error checking progress for category ${looseEnd.end}:`, categoryCheckError);
            progress[looseEnd.end] = { seen: 0, total: 10, percentage: 0 };
          }
        }
        
        setCategoryProgress(progress);
        setLoadingProgress(95);
        
        // Update loose ends with completion status and progress
        const updatedLooseEnds = looseEndsData.map(looseEnd => {
          // For completionist category items, add progress information
          if (looseEnd.end_category === 'Completionist') {
            // Make sure we have progress data, default to 0/10 if not
            const categoryProgressData = progress[looseEnd.end] || { seen: 0, total: 10, percentage: 0 };
            const isComplete = categoryProgressData.seen >= categoryProgressData.total && categoryProgressData.total > 0;
            
            return { 
              ...looseEnd, 
              isCompleted: isComplete,
              progress: categoryProgressData
            };
          } 
          // For side projects category, check if user has attended a show of that group
          else if (looseEnd.end_category === 'Side Projects') {
            // Check if the loose end name matches one of our side projects
            const isComplete = sideProjectsAttended[looseEnd.end] || false;
            return { ...looseEnd, isCompleted: isComplete };
          }
          // For song debuts category, check against the required number of debuts
          else if (looseEnd.end_category === 'Song Debuts') {
            let requiredDebuts = 0;
            
            // Extract the number from "Debut x1", "Debut x5", etc.
            if (looseEnd.end.startsWith('Debut x')) {
              requiredDebuts = parseInt(looseEnd.end.replace('Debut x', ''), 10);
            }
            
            const isComplete = !isNaN(requiredDebuts) && debutCount >= requiredDebuts;
            return { ...looseEnd, isCompleted: isComplete };
          }
          // For Goosemas category, check against the required number of shows attended
          else if (looseEnd.end_category === 'Goosemas') {
            let requiredShows = 0;
            
            // Extract the number from "Goosemas x1", "Goosemas x3", etc.
            if (looseEnd.end.startsWith('Goosemas x')) {
              requiredShows = parseInt(looseEnd.end.replace('Goosemas x', ''), 10);
            }
            
            const showsAttended = goosemasShowsAttended.size;
            const isComplete = !isNaN(requiredShows) && showsAttended >= requiredShows;
            return { ...looseEnd, isCompleted: isComplete };
          }
          // For Tour Stats category, handle all the tour-related achievements
          else if (looseEnd.end_category === 'Tour Stats') {
            let isComplete = false;
            
            if (looseEnd.end === 'Tour x5') {
              // Check if any tour has at least 5 shows attended
              isComplete = Object.values(tourCountsMap).some(count => count >= 5);
            }
            else if (looseEnd.end === 'Tour x10') {
              // Check if any tour has at least 10 shows attended
              isComplete = Object.values(tourCountsMap).some(count => count >= 10);
            }
            else if (looseEnd.end === 'Five in a Row') {
              isComplete = fiveInARowCompleted;
            }
            else if (looseEnd.end.includes('Night Stand')) {
              // Check if any completed stand has a category matching this Loose End
              isComplete = Object.values(standsAttended).some(
                stand => stand.completed && stand.category === looseEnd.end
              );
            }
            
            return { ...looseEnd, isCompleted: isComplete };
          }
          // For Show Stats category, handle attendance milestones and global venue
          else if (looseEnd.end_category === 'Show Stats') {
            let isComplete = false;
            
            // Check Goose xN milestones
            if (looseEnd.end.startsWith('Goose x')) {
              const requiredShows = parseInt(looseEnd.end.replace('Goose x', ''), 10);
              isComplete = !isNaN(requiredShows) && canonicalShowCount >= requiredShows;
            }
            // Check Goin' Global achievement
            else if (looseEnd.end === "Goin' Global") {
              isComplete = attendedGlobalShow;
            }
            
            return { ...looseEnd, isCompleted: isComplete };
          }
          
          return { ...looseEnd, isCompleted: false };
        });

        // Group loose ends by category
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
        
        setGroupedLooseEnds(grouped);
        setCategories(categoryList);
        setLoadingProgress(100);
        
        // Small delay to ensure smooth transition
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

  // Map category to color like in Home component
  const getCategoryColor = (category: string): string => {
    switch(category) {
      case 'Completionist':
        return 'bg-fourth'; // Yellow
      case 'Side Projects':
        return 'bg-fourth'; // Teal
      case 'Song Debuts':
        return 'bg-fourth'; // Dark green
      case 'Goosemas':
        return 'bg-fourth'; // Orange
      case 'Tour Stats':
        return 'bg-fourth'; // Burgundy
      case 'Show Stats':
        return 'bg-fourth'; // Red
      default:
        return 'bg-fourth'; // Default yellow
    }
  };

  // Map category to text color
  const getCategoryTextColor = (category: string): string => {
    switch(category) {
      case 'Completionist':
        return 'text-primary'; // Black text on yellow
      case 'Side Projects':
      case 'Song Debuts':
      case 'Goosemas':
      case 'Tour Stats':
      case 'Show Stats':
        return 'text-primary'; // White text on darker colors
      default:
        return 'text-primary'; // Default black text
    }
  };

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">Loading Loose Ends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3 text-center py-12">
        <p className="text-red-600 font-semibold">Error loading Loose Ends</p>
        <p className="text-fifth text-sm mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-fourth text-fifth rounded-lg border border-secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3 text-center py-12">
        <p className="text-fifth">No Loose Ends found</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Loose Ends</h3>
      </div>
      
      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h4 className={`text-lg font-semibold ${getCategoryColor(category)} ${getCategoryTextColor(category)} inline-block px-3 py-1 rounded-lg border border-secondary mb-2`}>
            {category}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groupedLooseEnds[category].map((looseEnd) => (
              <div
                key={looseEnd.end_id}
                className="bg-primary border border-secondary rounded-lg overflow-hidden hover:bg-canvas transition-all flex flex-col"
              >
                <div className="relative pb-[49.25%]">
                  <img
                    src={looseEnd.isCompleted && looseEnd.end_image_collected 
                      ? looseEnd.end_image_collected 
                      : looseEnd.end_image}
                    alt={`${looseEnd.end} illustration`}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error(`Failed to load image for ${looseEnd.end}:`, looseEnd.isCompleted ? looseEnd.end_image_collected : looseEnd.end_image);
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://via.placeholder.com/670x330?text=Image+Not+Available';
                    }}
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-fifth">
                      {looseEnd.end}
                    </h3>
                    
                    {looseEnd.isCompleted && (
                      <span className="bg-[#006400] text-primary text-xs px-2 py-1 rounded-full ml-2 border border-secondary">
                        Collected
                      </span>
                    )}
                  </div>
                  
                  <p className="text-fifth font-light text-xs mb-3 flex-grow">
                    {looseEnd.end_description}
                  </p>
                  
                  {looseEnd.progress && (
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs text-fifth mb-1">
                        <span>{looseEnd.progress.seen}/{looseEnd.progress.total}</span>
                        <span>{looseEnd.progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden border border-secondary">
                        <div 
                          className={`h-2 ${looseEnd.isCompleted ? 'bg-[#006400]' : 'bg-[#E17401]'}`}
                          style={{ width: `${looseEnd.progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LooseEnds;