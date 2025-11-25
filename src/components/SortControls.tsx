import React from 'react';
import { ArrowDownUp } from 'lucide-react';
import { CompactModal } from './CompactModal';
import { MatrixSortMode } from './UserSongMatrix';

interface SortControlsProps {
  matrixSortMode: MatrixSortMode;
  setMatrixSortMode: (mode: MatrixSortMode) => void;
  isSortModalOpen: boolean;
  setIsSortModalOpen: (open: boolean) => void;
}

export const SortControls: React.FC<SortControlsProps> = ({
  matrixSortMode,
  setMatrixSortMode,
  isSortModalOpen,
  setIsSortModalOpen
}) => {
  return (
    <>
      {/* Desktop version of sort controls */}
      <div className="hidden md:flex items-center bg-canvas rounded-md border border-fourth py-1 px-2">
        <span className="text-fifth text-xs mr-2 font-medium">Sort:</span>
        <div className="flex gap-1">
          <button 
            onClick={() => setMatrixSortMode('alphabetical')}
            className={`px-2 text-xs rounded font-light ${
              matrixSortMode === 'alphabetical' 
                ? 'bg-tertiary text-fifth' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            A-Z
          </button>
          <button 
            onClick={() => setMatrixSortMode('chronological')}
            className={`px-2 text-xs rounded font-light ${
              matrixSortMode === 'chronological' 
                ? 'bg-tertiary text-fifth' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            First Seen
          </button>
          <button 
            onClick={() => setMatrixSortMode('playcount')}
            className={`px-2 text-xs rounded font-light ${
              matrixSortMode === 'playcount' 
                ? 'bg-tertiary text-fifth' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            Most Seen
          </button>
        </div>
      </div>
      
      {/* Mobile version - sort button */}
      <button 
        onClick={() => setIsSortModalOpen(true)}
        className="md:hidden flex items-center justify-center bg-tertiary hover:bg-tertiary/40 rounded-md border border-fourth p-1.5"
        aria-label="Sort options"
      >
        <ArrowDownUp className="w-4 h-4 text-fifth" />
      </button>
      
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
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
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
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            First Seen
          </button>
          <button 
            onClick={() => {
              setMatrixSortMode('playcount');
              setIsSortModalOpen(false);
            }}
            className={`w-full px-4 py-2 text-left rounded ${
              matrixSortMode === 'playcount' 
                ? 'bg-tertiary text-black' 
                : 'text-fifth hover:bg-tertiary/40'
            }`}
          >
            Most Seen
          </button>
        </div>
      </CompactModal>
    </>
  );
};
