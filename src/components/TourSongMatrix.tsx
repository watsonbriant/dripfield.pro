import React, { useState, useEffect, useMemo } from 'react';
import { MatrixSortMode } from './TourSongsCombined';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import MatrixTable from './MatrixTable';
import { useSongMatrix } from '../hooks/useSongMatrix';
import { supabase } from '../lib/supabase';

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

  const [showsWithEntries, setShowsWithEntries] = useState<Set<string>>(new Set());
  const [isFiltering, setIsFiltering] = useState(true);

  // Query which shows have setlist_entries
  useEffect(() => {
    async function filterShowsWithEntries() {
      if (!shows || shows.length === 0) {
        setShowsWithEntries(new Set());
        setIsFiltering(false);
        return;
      }

      try {
        const showIds = shows.map(show => show.show_id);
        
        // Query setlist_entries to find which shows have entries
        const { data: entriesData, error } = await supabase
          .from('setlist_entries')
          .select('entry_show')
          .in('entry_show', showIds);

        if (error) throw error;

        // Create a set of show IDs that have entries
        const showIdsWithEntries = new Set<string>();
        entriesData?.forEach(entry => {
          if (entry.entry_show) {
            showIdsWithEntries.add(entry.entry_show);
          }
        });

        setShowsWithEntries(showIdsWithEntries);
        setIsFiltering(false);
      } catch (error) {
        console.error('Error filtering shows with setlist entries:', error);
        // On error, include all shows to avoid breaking the UI
        setShowsWithEntries(new Set(shows.map(show => show.show_id)));
        setIsFiltering(false);
      }
    }

    filterShowsWithEntries();
  }, [shows]);

  // Filter shows to only include those with setlist_entries
  const filteredShows = useMemo(() => {
    if (isFiltering || showsWithEntries.size === 0) {
      return [];
    }
    return shows.filter(show => showsWithEntries.has(show.show_id));
  }, [shows, showsWithEntries, isFiltering]);

  const { songMatrix, sortedSongs, isLoading, errorMessage } = useSongMatrix(filteredShows, sortMode);

  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };

  if (isFiltering || isLoading) {
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
        shows={filteredShows}
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