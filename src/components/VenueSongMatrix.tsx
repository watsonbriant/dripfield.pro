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
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">Song Matrix</h2>
        </div>
        <div className="p-2 flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">Loading song matrix...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">Song Matrix</h2>
        </div>
        <div className="p-2 text-center py-6 text-red-500">{errorMessage}</div>
      </div>
    );
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">Song Matrix</h2>
        </div>
        <div className="p-2 text-center py-6 text-fifth">No song data available for this venue</div>
      </div>
    );
  }
  
  return (
    <div className={`${!hideTitle ? "bg-primary border border-fourth" : ""} ${className}`}>
      {!hideTitle && (
        <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
          <h2 className="text-sm font-semibold">
            {songMatrix.songs.length} Songs Played
          </h2>
          <button 
            onClick={() => setIsSpreadModalOpen(true)} 
            className="text-fifth bg-canvas rounded p-0.5 border border-fourth hover:bg-primary transition-colors"
            aria-label="Show song spread"
          >
            <ChartBarDecreasing size={14} />
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