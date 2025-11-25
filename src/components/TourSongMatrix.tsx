import React, { useState } from 'react';
import { MatrixSortMode } from './TourSongsCombined';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import MatrixTable from './MatrixTable';
import { useSongMatrix } from '../hooks/useSongMatrix';

interface SongSpreadProps {
  shows: Array<any>;
  hideTitle?: boolean;
  className?: string;
  sortMode?: MatrixSortMode;
  tourId?: string; // Add tourId prop
}

const TourSongMatrix: React.FC<SongSpreadProps> = ({ 
  shows, 
  hideTitle = false,
  className = "",
  sortMode = "alphabetical",
  tourId = ""
}) => {
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  const { songMatrix, sortedSongs, isLoading, errorMessage } = useSongMatrix(shows, sortMode);

  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };

  if (isLoading) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-fifth">Loading song matrix...</div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="text-center py-6 text-red-500">{errorMessage}</div>
      </div>
    );
  }

  if (songMatrix.songs.length === 0) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <div className="text-center py-6 text-fifth">No song data available for this tour</div>
      </div>
    );
  }

  return (
    <div className={`${!hideTitle ? "bg-primary border border-fourth rounded-lg p-3" : ""} ${className}`}>
      {!hideTitle && (
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-full border border-fourth mb-4">
          {songMatrix.songs.length} Songs Played1
        </h2>
      )}
      
      <MatrixTable
        songMatrix={songMatrix}
        sortedSongs={sortedSongs}
        shows={shows}
        onSongClick={handleSongClick}
      />
      
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={tourId}
        currentShowId=""
      />
    </div>
  );
};

export default TourSongMatrix;