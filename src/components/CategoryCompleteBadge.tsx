import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface CategoryCompleteBadgeProps {
  categoryName: string | null;
}

export function CategoryCompleteBadge({ categoryName }: CategoryCompleteBadgeProps) {
  const navigate = useNavigate();
  const [categoryArtwork, setCategoryArtwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNameHovered, setIsNameHovered] = useState(false);

  useEffect(() => {
    if (categoryName) {
      fetchCategoryArtwork();
    } else {
      setLoading(false);
    }
  }, [categoryName]);

  async function fetchCategoryArtwork() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('category_artwork')
        .eq('category', categoryName)
        .single();

      if (error) throw error;
      setCategoryArtwork(data?.category_artwork || null);
    } catch (error) {
      console.error('Error fetching category artwork:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!categoryName || loading) {
    return null;
  }

  const handleClick = () => {
    navigate('/lists/81dbe56c-7cc4-466b-b8d7-47c1ca041afc');
  };

  return (
    <div>
      <div 
        className="bg-yellow-500 text-fifth py-0.5 pr-0.5 flex justify-between items-start cursor-pointer hover:bg-yellow-600 transition-colors"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 pl-1">
          {categoryArtwork && (
            <img 
              src={categoryArtwork} 
              alt={categoryName}
              className="w-5 h-5 rounded object-cover"
              onMouseEnter={() => setIsNameHovered(true)}
              onMouseLeave={() => setIsNameHovered(false)}
            />
          )}
          <h2 className="text-[0.625rem] font-medium leading-[0.75rem] py-0.5">
            This show featured a full performance of{' '}
            <span 
              className={`font-medium text-fifth transition-all ${isNameHovered ? 'underline' : ''}`}
              onMouseEnter={() => setIsNameHovered(true)}
              onMouseLeave={() => setIsNameHovered(false)}
            >
              {categoryName}
            </span>.
          </h2>
        </div>
      </div>
    </div>
  );
}