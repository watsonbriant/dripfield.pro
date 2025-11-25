import React from 'react';
import { useNavigate } from 'react-router-dom';

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

type UserSongStat = {
  song_id: string;
  count: number;
  last_seen_date?: string;
};

interface CategorySectionProps {
  columns: Category[][];
  title: string;
  sectionType: 'original' | 'covers' | 'other';
  songsByCategory: Record<string, Song[]>;
  userSongStats: UserSongStat[];
  currentColumnCount: number;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  columns,
  title,
  sectionType,
  songsByCategory,
  userSongStats,
  currentColumnCount
}) => {
  const navigate = useNavigate();

  if (columns.flat().length === 0) return null;
  
  // Special layout for covers section with responsive column behavior
  const getCoverSongGridClass = () => {
    if (sectionType !== 'covers') return "space-y-0";
    
    // Responsive grid layout for covers section:
    // 2 columns on xl and sm-md breakpoints, 1 column on lg and xs
    return `grid ${
      currentColumnCount === 4 || (currentColumnCount === 2 && window.innerWidth < 1024) 
        ? 'grid-cols-2' 
        : 'grid-cols-1'
    } gap-x-2 gap-y-0`;
  };
  
  const songListClass = getCoverSongGridClass();
  
  // Get song stats for a specific song
  const getSongStats = (songId: string): { count: number, lastSeenDate?: string } => {
    const stat = userSongStats.find(s => s.song_id === songId);
    return {
      count: stat ? stat.count : 0,
      lastSeenDate: stat?.last_seen_date
    };
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold bg-fourth text-white text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2">{title}</h3>
      <div className={`grid grid-cols-1 ${
        sectionType === 'covers' 
          ? 'sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2' 
          : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      } gap-4`}>
        {columns.map((columnCategories, columnIndex) => (
          <div key={`${title}-column-${columnIndex}`} className="flex flex-col gap-4">
            {columnCategories.map(category => {
              const categorySongs = songsByCategory[category.category] || [];
              
              return (
                <div 
                  key={category.category} 
                  className="bg-primary rounded-lg p-3 border border-fourth h-auto w-full relative"
                >
                  <div className="flex items-center justify-between space-x-2 mb-1 pb-2 border-b border-secondary/20">
                    <h4 className="text-[1.125rem] leading-[1.125rem] font-medium text-fifth">
                      {category.category || category.category}
                    </h4>
                    {category.category_artwork && (
                      <div className="h-7 flex-shrink-0">
                        <img 
                          src={category.category_artwork} 
                          alt={`${category.category} artwork`}
                          className="h-full object-contain rounded border border-secondary/10"
                        />
                      </div>
                    )}
                  </div>
                  <ul className={songListClass}>
                    {categorySongs.map(song => {
                      const { count } = getSongStats(song.song_id);
                      const seen = count > 0;
                      
                      return (
                        <li 
                          key={song.song_id} 
                          className="text-xs hover:bg-tertiary/40 transition-colors py-0.5 px-1 rounded cursor-pointer"
                          onClick={() => navigate(`/song/${song.song_id}`)}
                        >
                          <span 
                            className={`${seen 
                              ? 'font-medium hover:underline transition-colors text-left text-xs text-fourth' 
                              : 'font-light text-fifth/70'}`}
                          >
                            {song.song}
                          </span>
                          {seen && (
                            <span className="ml-2 text-fifth font-medium">({count})</span>
                          )}
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

export default CategorySection;
