import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TourSongStats from './TourSongStats';
import TourSongMatrix from './TourSongMatrix';
import { CompactModal } from './CompactModal';
import { ArrowDownUp } from 'lucide-react';

interface Show {
  show_id: string;
  setlist_entries?: Array<{
    entry_song: string;
    songs?: {
      song_id?: string;
      song_category?: string;
      categories?: {
        category_canonid?: number;
      };
    };
  }>;
}

interface TourSongsCombinedProps {
  shows: Show[];
  songIdMap: { [songName: string]: string };
  uniqueSongCount?: number;
  onSongCountChange?: (count: number) => void;
  className?: string;
  tourId?: string; // Add tourId prop
}

export type MatrixSortMode = 'alphabetical' | 'chronological' | 'playcount';

const TourSongsCombined: React.FC<TourSongsCombinedProps> = ({ 
  shows, 
  songIdMap,
  uniqueSongCount,
  onSongCountChange,
  tourId = ""
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize view mode from URL or default to 'list'
  const getViewModeFromUrl = (params: URLSearchParams): 'list' | 'matrix' => {
    const viewParam = params.get('songsView');
    return (viewParam === 'list' || viewParam === 'matrix') ? viewParam : 'list';
  };
  
  // Initialize matrix sort mode from URL or default to 'alphabetical'
  const getMatrixSortModeFromUrl = (params: URLSearchParams): MatrixSortMode => {
    const sortParam = params.get('songsSort');
    if (sortParam === 'alphabetical' || sortParam === 'chronological' || sortParam === 'playcount') {
      return sortParam;
    }
    return 'alphabetical';
  };
  
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>(() => getViewModeFromUrl(searchParams));
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>(() => getMatrixSortModeFromUrl(searchParams));
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Sync view mode and sort mode with URL when URL changes
  useEffect(() => {
    const urlViewMode = getViewModeFromUrl(searchParams);
    const urlSortMode = getMatrixSortModeFromUrl(searchParams);
    
    if (urlViewMode !== viewMode) {
      setViewMode(urlViewMode);
    }
    if (urlSortMode !== matrixSortMode) {
      setMatrixSortMode(urlSortMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when view mode changes
  const handleViewModeChange = (newViewMode: 'list' | 'matrix') => {
    setViewMode(newViewMode);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newViewMode === 'list') {
      // Remove songsView param if it's the default
      newSearchParams.delete('songsView');
      // Also remove songsSort when switching to list view
      newSearchParams.delete('songsSort');
    } else {
      newSearchParams.set('songsView', newViewMode);
      // Ensure sort mode is set when switching to matrix view
      if (!newSearchParams.has('songsSort')) {
        newSearchParams.set('songsSort', matrixSortMode);
      }
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Update URL when matrix sort mode changes
  const handleMatrixSortModeChange = (newSortMode: MatrixSortMode) => {
    setMatrixSortMode(newSortMode);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSortMode === 'alphabetical') {
      // Remove songsSort param if it's the default
      newSearchParams.delete('songsSort');
    } else {
      newSearchParams.set('songsSort', newSortMode);
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          {uniqueSongCount} Songs Played
        </h2>
        
        {/* View toggle switch and sort options */}
        <div className="flex items-center gap-4">
          {/* Matrix Sort Toggle - Only visible when matrix view is selected */}
          {viewMode === 'matrix' && (
            <>
              {/* Desktop version - hidden on mobile */}
              <div className="hidden md:flex items-center bg-canvas rounded-md border border-fourth py-0.5 px-1">
                <span className="text-fifth text-[0.625rem] ml-1 mr-2 font-medium">Sort:</span>
                <div className="flex gap-1 font-light">
                  <button 
                    onClick={() => handleMatrixSortModeChange('alphabetical')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'alphabetical' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    A-Z
                  </button>
                  <button 
                    onClick={() => handleMatrixSortModeChange('chronological')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'chronological' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    Tour Order
                  </button>
                  <button 
                    onClick={() => handleMatrixSortModeChange('playcount')}
                    className={`px-1 text-[0.625rem] rounded ${
                      matrixSortMode === 'playcount' 
                        ? 'bg-tertiary text-fifth' 
                        : 'text-fifth hover:bg-tertiary/40'
                    }`}
                  >
                    Most Played
                  </button>
                </div>
              </div>
              
              {/* Mobile version - only visible on mobile */}
              <button 
                onClick={() => setIsSortModalOpen(true)}
                className="md:hidden flex items-center justify-center bg-fourth rounded border border-fourth p-0.5"
                aria-label="Sort options"
              >
                <ArrowDownUp className="w-4 h-4 text-white" />
              </button>
            </>
          )}
          
          {/* View toggle switch */}
          <div className="flex items-center gap-3 ml-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`lucide lucide-list ${viewMode === 'list' ? 'text-fifth' : 'text-secondary'}`}
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            
            <button
              role="switch"
              aria-checked={viewMode === 'matrix'}
              onClick={() => handleViewModeChange(viewMode === 'list' ? 'matrix' : 'list')}
              className="relative inline-flex h-4 w-[47px] items-center rounded-full border border-fourth transition-colors bg-primary"
            >
              <span
                className={`absolute h-[10px] w-[10px] rounded-lg bg-black transition-transform duration-200 ${
                  viewMode === 'matrix' ? 'left-[33px]' : 'left-[2px]'
                }`}
              />
            </button>
            
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`lucide lucide-grid ${viewMode === 'matrix' ? 'text-fifth' : 'text-secondary'}`}
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
          </div>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <TourSongStats 
          shows={shows} 
          songIdMap={songIdMap} 
          onSongCountChange={onSongCountChange}
          uniqueSongCount={uniqueSongCount} 
          hideTitle={true}
          tourId={tourId}
        />
      ) : (
        <TourSongMatrix 
          shows={shows} 
          hideTitle={true} 
          sortMode={matrixSortMode}
          tourId={tourId}
        />
      )}
      
      {/* Sort Modal for Mobile */}
      <CompactModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="Sort Songs By"
      >
        <div className="flex flex-col w-full">
          <button 
            onClick={() => {
              handleMatrixSortModeChange('alphabetical');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'alphabetical' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            A-Z
          </button>
          <button 
            onClick={() => {
              handleMatrixSortModeChange('chronological');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'chronological' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            Tour Order
          </button>
          <button 
            onClick={() => {
              handleMatrixSortModeChange('playcount');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-1.5 py-0.5 text-xs text-left rounded ${
              matrixSortMode === 'playcount' 
                ? 'bg-tertiary text-fifth font-semibold' 
                : 'text-fifth hover:bg-black/10 font-medium'
            }`}
          >
            Most Played
          </button>
        </div>
      </CompactModal>
    </div>
  );
};

export default TourSongsCombined;