import React, { useState } from 'react';
import { ChartBarDecreasing } from '../components/icons/ChartBarDecreasing';
import { SongMatrixTable } from './SongMatrixTable';
import { SongSpreadModal } from './SongSpreadModal';
import { useSongMatrix } from '../hooks/useSongMatrix';

interface VenueSongMatrixProps {
  shows: Array<any>;
  songIdMap?: { [songName: string]: string };
  yearIdMap?: { [year: string]: string };
  hideTitle?: boolean;
  className?: string;
}

const VenueSongMatrix: React.FC<VenueSongMatrixProps> = ({ 
  shows, 
  songIdMap = {}, 
  yearIdMap = {},
  hideTitle = false,
  className = ""
}) => {
  const [isSpreadModalOpen, setIsSpreadModalOpen] = useState(false);
  const { songMatrix, isLoading, errorMessage, songSpreadData } = useSongMatrix(shows);

  if (isLoading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-full border border-secondary mb-4">Song Matrix</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">Loading song matrix...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-full border border-secondary mb-4">Song Matrix</h2>
        <div className="text-center py-6 text-red-500">{errorMessage}</div>
      </div>
    );
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-full border border-secondary mb-4">Song Matrix</h2>
        <div className="text-center py-6 text-fifth">No song data available for this venue</div>
      </div>
    );
  }
  
  return (
    <div className={`${!hideTitle ? "bg-primary border border-secondary rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
            {songMatrix.songs.length} Songs Played
          </h2>
          <button 
            onClick={() => setIsSpreadModalOpen(true)} 
            className="text-fifth bg-tertiary rounded-lg p-2 border border-secondary hover:bg-tertiary/70 transition-colors"
            aria-label="Show song spread"
          >
            <ChartBarDecreasing size={20} />
          </button>
        </div>
      )}
      
      <SongMatrixTable 
        songMatrix={songMatrix}
        shows={shows}
        songIdMap={songIdMap}
        yearIdMap={yearIdMap}
      />
      
      <SongSpreadModal 
        isOpen={isSpreadModalOpen}
        onClose={() => setIsSpreadModalOpen(false)}
        songSpreadData={songSpreadData}
        maxWidth="1050px"
      />
    </div>
  );
};

export default VenueSongMatrix;