import React, { useEffect, useState } from 'react';
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
    <div 
      className="bg-yellow-500 border border-secondary rounded-lg p-3 cursor-pointer hover:bg-yellow-400 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        {categoryArtwork && (
          <img 
            src={categoryArtwork} 
            alt={categoryName}
            className="w-8 h-8 rounded object-cover"
            onMouseEnter={() => setIsNameHovered(true)}
            onMouseLeave={() => setIsNameHovered(false)}
          />
        )}
        <div className="text-[1rem] leading-[1rem] font-light text-fifth">
          This show featured a full performance of{' '}
          <span 
            className={`text-[1rem] leading-[1rem] font-medium text-fifth transition-all ${isNameHovered ? 'underline' : ''}`}
            onMouseEnter={() => setIsNameHovered(true)}
            onMouseLeave={() => setIsNameHovered(false)}
          >
            {categoryName}
          </span>.
        </div>
      </div>
    </div>
  );
}