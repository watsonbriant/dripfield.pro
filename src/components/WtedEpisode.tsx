import { useState, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useWtedEpisodeData, useWtedEpisodes, WtedEpisodeEntry } from '../hooks/useWtedEpisodeData';
import { WtedEpisodesDropdown } from './wted/WtedEpisodesDropdown';
import { WtedEpisodeStats } from './wted/WtedEpisodeStats';
import { DisplayWtedEpisodeTable } from './wted/DisplayWtedEpisodeTable';
import { GuestLegend } from './setlist/GuestLegend';
import { useMobileDetection, useGuestGroups, useHoverStates } from '../hooks/useSetlistDisplay';
import { getGuestColor } from '../utils/setlistUtils';
import SongSpread from './SongSpread';

// Lazy load heavy components
const StarRating = lazy(() => import('./StarRating'));

export function WtedEpisode() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  
  // Custom hooks for data fetching
  const { episode, show, entries, loading } = useWtedEpisodeData(episodeId);
  const { episodes } = useWtedEpisodes(episode?.show);
  
  // State for category hover highlighting
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Handle episode selection
  const handleEpisodeSelect = useCallback((newEpisodeId: string) => {
    navigate(`/wted/${newEpisodeId}`);
  }, [navigate]);

  // Handle category hover from SongSpread
  const handleCategoryHover = useCallback((category: string | null) => {
    setHoveredCategory(category);
  }, []);

  // Hooks for DisplayWtedEpisodeTable
  const isMobileTable = useMobileDetection();
  const setlistEntries = entries
    .map(entry => entry.setlist_entry)
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);
  const guestGroups = useGuestGroups(setlistEntries);
  const hoverStates = useHoverStates();
  
  // Event handlers for DisplayWtedEpisodeTable
  const handleSongClick = useCallback((songId: string) => {
    navigate(`/song/${songId}`);
  }, [navigate]);

  const handleGuestClick = useCallback((guestId: string) => {
    navigate(`/personnel/${guestId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">Episode not found</p>
        </div>
      </div>
    );
  }

  // Construct title
  const title = episode 
    ? `${episode.episode} — WTED Radio Program Director — Dripfield.pro`
    : 'WTED Episode — Dripfield.pro';

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="w-full overflow-x-auto relative z-0 lg:z-auto">
      {/* Header Bar with Navigation Row */}
      <div className="bg-primary border border-fourth mb-4 w-max min-w-max relative overflow-visible shadow-md">
        {/* Header */}
        <div className="bg-tertiary text-fifth pl-2 pr-1 py-0.5 flex items-center">
          <h2 className="text-sm font-semibold">
            {show?.show || 'WTED Episode'}
          </h2>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center gap-4 relative overflow-visible min-w-max w-max -mx-[1px]">
          {/* Episodes Dropdown */}
          <div className="flex-shrink-0 relative z-[1] lg:z-[9000]">
            <WtedEpisodesDropdown
              episodes={episodes}
              currentEpisodeId={episodeId}
              onEpisodeSelect={handleEpisodeSelect}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        {entries && entries.length > 0 ? (
          <div className="flex border-t border-fourth -mt-[1px]">
            {/* Left Column - 200px wide */}
            <div className="w-[200px] flex-shrink-0 -mt-[1px] pt-2 border-r border-t border-fourth bg-canvas/60 relative z-0 lg:z-auto">
              {/* Show Stats */}
              <div>
                <WtedEpisodeStats artwork={episode?.artwork} />

                {/* Song Spread */}
                {entries && entries.length > 0 && (
                  <div className="pt-2">
                    <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
                      <h2 className="text-xs font-semibold">Episode Song Spread</h2>
                    </div>
                    <div>
                      <SongSpread 
                        setlist={setlistEntries.map(entry => ({
                          entry_song: entry.entry_song,
                          entry_short: entry.entry_short || undefined,
                          song_category: entry.song_category,
                          category_canonid: entry.category_canonid,
                          song_originalartist: entry.songs?.song_originalartist || undefined,
                          category_artwork: entry.songs?.categories?.category_artwork || undefined,
                          songs: entry.songs
                        }))}
                        hideContainer={true}
                        hideTitle={true}
                        onCategoryHover={handleCategoryHover}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - naturally as wide as needed */}
            <div className="flex-1 px-2 py-2 space-y-2 -mt-[1px] relative z-0 lg:z-auto">
              {entries && entries.length > 0 && (
                <DisplayWtedEpisodeTable
                  entries={entries}
                  isMobile={isMobileTable}
                  getGuestColor={(entry, guestGroups) => getGuestColor(entry, guestGroups)}
                  guestGroups={guestGroups}
                  hoverStates={hoverStates}
                  hoveredCategory={hoveredCategory}
                  onSongClick={handleSongClick}
                  onGuestClick={handleGuestClick}
                />
              )}
              
              {/* Guest Legend */}
              {entries && entries.length > 0 && (
                <GuestLegend 
                  guestGroups={guestGroups}
                  isMobile={isMobileTable}
                  hoverStates={hoverStates}
                  onGuestClick={handleGuestClick}
                />
              )}
            </div>
          </div>
        ) : (
          /* Right Column only - when no entries */
          <div className="flex-1 px-2 py-2 space-y-2 -mt-[1px]">
            <p className="text-fifth">No episode entries available</p>
          </div>
        )}
      </div>
      
    </div>
    </>
  );
}
