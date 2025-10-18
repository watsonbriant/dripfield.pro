import React from 'react';
import { Show, SlotData } from '../types/tourTypes';
import TourSongSpread from './TourSongSpread';
import TopSlotsCarousel from './TopSlotsCarousel';
import LongestSongs from './LongestSongs';
import TourSongsCombined from './TourSongsCombined';
import NotPlayedInTour from './NotPlayedInTour';
import LiberatedSongs from './LiberatedSongs';
import GuestAppearances from './GuestAppearances';

interface TourStatsProps {
  shows: Show[];
  topSlots: SlotData[];
  windowWidth: number;
  currentTourId: string;
  currentTour: string;
  currentTourShowFields: boolean;
  hasGuestAppearances: boolean;
  setHasGuestAppearances: (has: boolean) => void;
  songIdMap: { [songName: string]: string };
  uniqueSongCount: number;
  setUniqueSongCount: (count: number) => void;
  hasTourSetlistEntries: boolean;
  onSongClick: (songId: string) => void;
}

export function TourStats({
  shows,
  topSlots,
  windowWidth,
  currentTourId,
  currentTour,
  currentTourShowFields,
  hasGuestAppearances,
  setHasGuestAppearances,
  songIdMap,
  uniqueSongCount,
  setUniqueSongCount,
  hasTourSetlistEntries,
  onSongClick
}: TourStatsProps) {
  const showIds = shows.map(show => show.show_id);

  if (!hasTourSetlistEntries) {
    return null;
  }

  return (
    <>
      {/* First row - Desktop: TourSongSpread and TopSlotsCarousel side by side */}
      {/* Mid-sized: TourSongSpread left, TopSlotsCarousel + NotPlayed stacked right */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <TourSongSpread shows={shows} />
        
        <div className="flex flex-col gap-4">
          {topSlots.length > 0 && (
            <TopSlotsCarousel
              slots={topSlots}
              isMobile={windowWidth < 1280}
              songIdMap={songIdMap}
              onSongClick={onSongClick}
              tourId={currentTourId}
            />
          )}

          {/* NotPlayed - shows in right column on mid-sized only */}
          {currentTourShowFields && (
            <div className="xl:hidden">
              <NotPlayedInTour
                tourId={currentTourId}
                tourName={currentTour}
                showIds={showIds}
                songIdMap={songIdMap}
              />
            </div>
          )}
        </div>
      </div>

      {/* Second row - Desktop: Three columns (NotPlayed, Longest, Guests) */}
      {/* Mid-sized: Two columns (Longest, Guests) */}
      {/* If only LongestSongs: Full width */}
      {currentTourShowFields ? (
        <div 
          className={`mt-4 grid grid-cols-1 gap-4 items-start ${
            hasGuestAppearances ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'
          }`}
          style={{ 
            gridTemplateColumns: windowWidth >= 1280 
              ? hasGuestAppearances 
                ? 'calc(30% - 10.67px) calc(20% - 10.67px) calc(50% - 10.67px)'
                : 'calc(50% - 8px) calc(50% - 8px)' // Two equal columns on desktop when only 2 visible
              : windowWidth >= 768 
                ? 'calc(50% - 8px) calc(50% - 8px)' 
                : '100%'
          }}
        >
          {/* NotPlayed - shows in first column on desktop only */}
          <div className="hidden xl:block">
            <NotPlayedInTour
              tourId={currentTourId}
              tourName={currentTour}
              showIds={showIds}
              songIdMap={songIdMap}
            />
          </div>

          {/* GuestAppearances - no wrapper div needed */}
          <GuestAppearances 
            showIds={showIds}
            tourId={currentTourId}
            onDataLoaded={setHasGuestAppearances}
          />

          {/* Longest - shows in left column on mid-sized, second column on desktop */}
          <LongestSongs
            showIds={showIds}
            songIdMap={songIdMap}
            tourId={currentTourId}
          />
        </div>
      ) : (
        <div className="mt-4">
          <LongestSongs
            showIds={showIds}
            songIdMap={songIdMap}
            tourId={currentTourId}
          />
        </div>
      )}

      {/* Third row - Full width Liberated Songs on all sizes */}
      {currentTourShowFields && (
        <div className="mt-4">
          <LiberatedSongs 
            showIds={showIds} 
            songIdMap={songIdMap}
            tourId={currentTourId}
          />
        </div>
      )}

      {/* Fourth row - Tour Songs Combined */}
      <div className="mt-4">
        <TourSongsCombined
          shows={shows}
          songIdMap={songIdMap}
          onSongCountChange={setUniqueSongCount}
          uniqueSongCount={uniqueSongCount}
          tourId={currentTourId}
        />
      </div>
    </>
  );
}
