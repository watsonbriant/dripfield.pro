import React, { useState } from 'react';
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
}

export type MatrixSortMode = 'alphabetical' | 'chronological' | 'playcount';

const TourSongsCombined: React.FC<TourSongsCombinedProps> = ({ 
  shows, 
  songIdMap,
  uniqueSongCount,
  onSongCountChange 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>('alphabetical');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  return (
    <div className="bg-primary border border-black rounded-lg p-3">
      <div className="flex justify-between items-center mb-3">
      <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
          {uniqueSongCount} Songs Played
        </h2>
        
        {/* View toggle switch and sort options */}
        <div className="flex items-center gap-4">
          {/* Matrix Sort Toggle - Only visible when matrix view is selected */}
          {viewMode === 'matrix' && (
            <>
              {/* Desktop version - hidden on mobile */}
              <div className="hidden md:flex items-center bg-canvas rounded-md border border-black py-1 px-2">
                <span className="text-black text-xs mr-2 font-bold">Sort:</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setMatrixSortMode('alphabetical')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'alphabetical' 
                        ? 'bg-[#f9ae37] text-black' 
                        : 'text-black hover:bg-black/10'
                    }`}
                  >
                    A-Z
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('chronological')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'chronological' 
                        ? 'bg-[#f9ae37] text-black' 
                        : 'text-black hover:bg-black/10'
                    }`}
                  >
                    Tour Order
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('playcount')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'playcount' 
                        ? 'bg-[#f9ae37] text-black' 
                        : 'text-black hover:bg-black/10'
                    }`}
                  >
                    Most Played
                  </button>
                </div>
              </div>
              
              {/* Mobile version - only visible on mobile */}
              <button 
                onClick={() => setIsSortModalOpen(true)}
                className="md:hidden flex items-center justify-center bg-[#f9ae37] rounded-md border border-black p-1.5"
                aria-label="Sort options"
              >
                <ArrowDownUp className="w-4 h-4 text-black" />
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
              className={`lucide lucide-list ${viewMode === 'list' ? 'text-black' : 'text-[#756d61]'}`}
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
              onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
              className="relative inline-flex h-6 w-12 items-center rounded-full border border-black transition-colors bg-[#f9ae37]"
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-black transition-transform duration-200 ${
                  viewMode === 'matrix' ? 'left-7' : 'left-1'
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
              className={`lucide lucide-grid ${viewMode === 'matrix' ? 'text-black' : 'text-[#756d61]'}`}
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
        />
      ) : (
        <TourSongMatrix 
          shows={shows} 
          songIdMap={songIdMap} 
          hideTitle={true} 
          sortMode={matrixSortMode}
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
              setMatrixSortMode('alphabetical');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'alphabetical' 
                ? 'bg-[#f9ae37] text-black font-mohr' 
                : 'text-black hover:bg-black/10 font-mohr'
            }`}
          >
            A-Z
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('chronological');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'chronological' 
                ? 'bg-[#f9ae37] text-black font-mohr' 
                : 'text-black hover:bg-black/10 font-mohr'
            }`}
          >
            Tour Order
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('playcount');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'playcount' 
                ? 'bg-[#f9ae37] text-black font-mohr' 
                : 'text-black hover:bg-black/10 font-mohr'
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