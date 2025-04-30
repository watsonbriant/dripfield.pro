import React, { useState } from 'react';
import TourSongStats from './TourSongStats';
import TourSongMatrix from './TourSongMatrix';
import { Modal } from './Modal';
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
    <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white/90">
          {uniqueSongCount} Songs Played
        </h2>
        
        {/* View toggle switch and sort options */}
        <div className="flex items-center gap-4">
          {/* Matrix Sort Toggle - Only visible when matrix view is selected */}
          {viewMode === 'matrix' && (
            <>
              {/* Desktop version - hidden on mobile */}
              <div className="hidden md:flex items-center bg-[#0e151b] rounded-md border border-white/10 py-1 px-2">
                <span className="text-[#fce7ca]/90 text-xs mr-2 font-semibold">Sort:</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setMatrixSortMode('alphabetical')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'alphabetical' 
                        ? 'bg-[#ec742e] text-white' 
                        : 'text-[#fce7ca]/90 hover:bg-white/10'
                    }`}
                  >
                    A-Z
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('chronological')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'chronological' 
                        ? 'bg-[#ec742e] text-white' 
                        : 'text-[#fce7ca]/90 hover:bg-white/10'
                    }`}
                  >
                    Tour Order
                  </button>
                  <button 
                    onClick={() => setMatrixSortMode('playcount')}
                    className={`px-2 py-0.5 text-xs rounded ${
                      matrixSortMode === 'playcount' 
                        ? 'bg-[#ec742e] text-white' 
                        : 'text-[#fce7ca]/90 hover:bg-white/10'
                    }`}
                  >
                    Most Played
                  </button>
                </div>
              </div>
              
              {/* Mobile version - only visible on mobile */}
              <button 
                onClick={() => setIsSortModalOpen(true)}
                className="md:hidden flex items-center justify-center bg-[#fce7ca] rounded-md border border-white/10 p-1.5"
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
              className={`lucide lucide-list ${viewMode === 'list' ? 'text-white' : 'text-[#fce7ca]'}`}
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
              className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec742e]/50 bg-[#fce7ca]"
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-[#172330] transition-transform duration-200 ${
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
              className={`lucide lucide-grid ${viewMode === 'matrix' ? 'text-white' : 'text-[#fce7ca]'}`}
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
                ? 'bg-[#ec742e] text-white' 
                : 'text-[#fce7ca]/90 hover:bg-white/5'
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
                ? 'bg-[#ec742e] text-white' 
                : 'text-[#fce7ca]/90 hover:bg-white/5'
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
                ? 'bg-[#ec742e] text-white' 
                : 'text-[#fce7ca]/90 hover:bg-white/5'
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