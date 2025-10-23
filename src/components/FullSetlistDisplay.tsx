import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShowStats from './ShowStats';
import SongSpread from './SongSpread';
import ReleaseContainer from './ReleaseContainer';
import ShowInfoContent from './ShowInfoContent';
import ShowChanges from './ShowChanges';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import { CategoryCompleteBadge } from './CategoryCompleteBadge';
import { JiveCompleteBadge } from './JiveCompleteBadge';
import { DripfieldCompleteBadge } from './DripfieldCompleteBadge';
import { DisplaySetlistTable } from './setlist/DisplaySetlistTable';
import { GuestLegend } from './setlist/GuestLegend';
import { ShowNotes } from './setlist/ShowNotes';
import { Callbacks } from './setlist/Callbacks';
import { FullSetlistDisplayProps, SetlistEntry } from '../types/setlist';
import { getGuestColor } from '../utils/setlistUtils';
import {
  useAdminStatus,
  useAttendeeCount,
  useMobileDetection,
  useShowPosition,
  useGuestGroups,
  useCoachNotesToggle,
  useScrollToReleases,
  useHoverStates,
  useModalState,
  useCopiedEntries
} from '../hooks/useSetlistDisplay';


export default function FullSetlistDisplay({ 
  setlist, 
  show, 
  showCoachNotes, 
  showDates = [], 
  navigateToVenue, 
  showId,
  openChangesModal,
  setOpenChangesModal,
  showLengthRank,
  scrollToReleases = false
}: FullSetlistDisplayProps) {
  const navigate = useNavigate();
  
  // Custom hooks for state management
  const isAdmin = useAdminStatus();
  const { attendeeCount, setAttendeeCount } = useAttendeeCount(showId, show || null);
  const isMobile = useMobileDetection();
  const showPosition = useShowPosition(show || null, showDates);
  const guestGroups = useGuestGroups(setlist || []);
  const { toggleIndividualCoachNote, shouldShowCoachNotesForEntry } = useCoachNotesToggle(showCoachNotes);
  const shouldHighlightReleases = useScrollToReleases(scrollToReleases);
  const hoverStates = useHoverStates();
  const { modalSongData, setModalSongData } = useModalState();
  const { copiedEntries, handleNumberClick } = useCopiedEntries();
  
  // State for category hover highlighting
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Handle category hover from SongSpread
  const handleCategoryHover = useCallback((category: string | null) => {
    setHoveredCategory(category);
  }, []);

  // Early return if show is undefined
  if (!show) {
    return (
      <div className="w-full space-y-0">
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <div className="text-center text-fifth py-8">
            Loading show data...
          </div>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };

  const handleLastShowClick = (showId: string) => {
    navigate(`/setlist/${showId}`);
  };

  const handleGuestClick = (guestId: string) => {
    navigate(`/personnel/${guestId}`);
  };

  const handleJOTYClick = (year: number) => {
    navigate(`/joty/${year}`);
  };

  // Adapter functions to convert between different interfaces
  const adaptSetlistForShowStats = (setlist: SetlistEntry[] | undefined) => {
    if (!setlist) return [];
    return setlist.map(entry => ({
      entry_length: entry.entry_length,
      times_played_num: entry.times_played_num?.toString() || null,
      shows_since_debut_num: entry.shows_since_debut_num?.toString() || null,
      entry_song: entry.entry_song,
      last_count: entry.last_count,
      entry_short: entry.entry_short
    }));
  };

  const adaptSetlistForSongSpread = (setlist: SetlistEntry[] | undefined) => {
    if (!setlist) return [];
    return setlist.map(entry => ({
      entry_song: entry.entry_song,
      entry_short: entry.entry_short || undefined,
      song_category: entry.song_category,
      category_canonid: entry.category_canonid,
      song_originalartist: entry.songs?.song_originalartist || undefined,
      category_artwork: entry.songs?.categories?.category_artwork || undefined,
      songs: entry.songs
    }));
  };

  return (
    <div className="w-full space-y-0">
      {/* Mobile view content */}
      <div className="lg:hidden space-y-4">
        <ShowInfoContent 
          show={show} 
          navigateToVenue={navigateToVenue} 
          showPosition={showPosition}
          attendeeCount={attendeeCount}
          onAttendeeCountChange={setAttendeeCount}
          setlist={setlist || []}
        />
        <ShowNotes show={show} />
        {setlist && setlist.length > 0 && (
          <div className="space-y-4">
            <ShowStats 
              setlist={adaptSetlistForShowStats(setlist)} 
              show_canonid={show.show_canonid}
              show_rarity={show.show_rarity}
              show_gap={show.show_gap}
              show_length_rank={showLengthRank}
            />
            {/* Show ONLY on mobile (below lg breakpoint) */}
            <div className="md:hidden space-y-4">
              <CategoryCompleteBadge categoryName={show.show_listcategorycomplete || null} />
              <JiveCompleteBadge showJiveComplete={show.show_jivecomplete || false} />
              <DripfieldCompleteBadge showDripfieldComplete={show.show_dripfieldcomplete || false} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="space-y-6">
        {/* Main content area */}
        <div className={`flex flex-col lg:flex-row lg:gap-4 ${!setlist || setlist.length === 0 ? 'lg:block' : ''}`}>
          {/* Main setlist content */}
          <div className={`flex-1 space-y-4 min-w-0 lg:mt-0 ${!setlist || setlist.length === 0 ? 'lg:hidden' : ''}`}>
            {/* Setlist table */}
            {setlist && setlist.length > 0 && (
              <DisplaySetlistTable
                setlist={setlist}
                show={show}
                isMobile={isMobile}
                isAdmin={isAdmin}
                copiedEntries={copiedEntries}
                shouldShowCoachNotesForEntry={shouldShowCoachNotesForEntry}
                toggleIndividualCoachNote={toggleIndividualCoachNote}
                getGuestColor={(entry) => getGuestColor(entry, guestGroups)}
                hoverStates={hoverStates}
                hoveredCategory={hoveredCategory}
                onSongClick={handleSongClick}
                onLastShowClick={handleLastShowClick}
                onGuestClick={handleGuestClick}
                onJOTYClick={handleJOTYClick}
                onNumberClick={(entryId) => handleNumberClick(entryId, isAdmin)}
              />
            )}

            {/* Callbacks container */}
            {setlist && setlist.length > 0 && <Callbacks show={show} />}
            
            {/* Stats and Guest Legend section */}
            {setlist && setlist.length > 0 && (
              <div className="space-y-4">
                {/* Desktop layout with grid */}
                <div className="hidden md:grid grid-cols-2 gap-4 items-start">
                  <div>
                    {/* Show ONLY on tablet (md to lg), not on mobile or desktop */}
                    <div className="hidden md:block lg:hidden">
                      <CategoryCompleteBadge categoryName={show.show_listcategorycomplete || null} />
                      <JiveCompleteBadge showJiveComplete={show.show_jivecomplete || false} />
                      <DripfieldCompleteBadge showDripfieldComplete={show.show_dripfieldcomplete || false} />
                    </div>
                    <SongSpread 
                      setlist={adaptSetlistForSongSpread(setlist)} 
                      onCategoryHover={handleCategoryHover}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <GuestLegend 
                      guestGroups={guestGroups}
                      isMobile={isMobile}
                      hoverStates={hoverStates}
                      onGuestClick={handleGuestClick}
                    />
                    
                    {showId && <ShowChanges 
                      showId={showId} 
                      openModal={openChangesModal} 
                      setOpenModal={setOpenChangesModal} 
                    />}

                    <div className="hidden lg:block space-y-4">
                      <CategoryCompleteBadge categoryName={show.show_listcategorycomplete || null} />
                      <JiveCompleteBadge showJiveComplete={show.show_jivecomplete || false} />
                      <DripfieldCompleteBadge showDripfieldComplete={show.show_dripfieldcomplete || false} />
                    </div>
                    
                    {showId && (
                      <div className="lg:hidden" data-release-container>
                        <ReleaseContainer 
                          showId={showId} 
                          highlightOnMount={shouldHighlightReleases}
                          className={shouldHighlightReleases ? 'highlight-releases' : ''}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile layout - stacked */}
                <div className="md:hidden space-y-4">
                  <SongSpread 
                    setlist={adaptSetlistForSongSpread(setlist)} 
                    onCategoryHover={handleCategoryHover}
                  />
                  
                  {showId && <ShowChanges showId={showId} />}
                  
                  <GuestLegend 
                    guestGroups={guestGroups}
                    isMobile={isMobile}
                    hoverStates={hoverStates}
                    onGuestClick={handleGuestClick}
                  />

                  {showId && (
                    <div data-release-container>
                      <ReleaseContainer 
                        showId={showId} 
                        highlightOnMount={shouldHighlightReleases}
                        className={shouldHighlightReleases ? 'highlight-releases' : ''}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - only visible on desktop */}
          <div className={`hidden lg:block ${!setlist || setlist.length === 0 ? 'w-full' : 'w-[270px] shrink-0'} space-y-4`}>
            <ShowInfoContent 
              show={show} 
              navigateToVenue={navigateToVenue} 
              showPosition={showPosition}
              attendeeCount={attendeeCount}
              onAttendeeCountChange={setAttendeeCount}
              setlist={setlist || []}
            />
            <ShowNotes show={show} />
            {setlist && setlist.length > 0 && (
              <div className="space-y-4">
                <ShowStats 
                  setlist={adaptSetlistForShowStats(setlist)} 
                  show_canonid={show.show_canonid}
                  show_rarity={show.show_rarity}
                  show_gap={show.show_gap}
                  show_length_rank={showLengthRank} 
                />
                {/* Show ONLY on desktop (lg and above) */}
                <div className="sm:hidden space-y-4">
                  <CategoryCompleteBadge categoryName={show.show_listcategorycomplete || null} />
                  <JiveCompleteBadge showJiveComplete={show.show_jivecomplete || false} />
                  <DripfieldCompleteBadge showDripfieldComplete={show.show_dripfieldcomplete || false} />
                </div>
              </div>
            )}
            {showId && <div data-release-container><ReleaseContainer showId={showId} highlightOnMount={shouldHighlightReleases} className={shouldHighlightReleases ? 'highlight-releases' : ''} /></div>}
          </div>
        </div>
      </div>
      
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={show.tour_id || ''}
        currentShowId={show.show_id}
      />
    </div>
  );
}