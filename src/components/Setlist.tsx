import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Link as LinkIcon, Pencil, Loader2, Info } from 'lucide-react';
import { DisplaySetlistTable } from './setlist/DisplaySetlistTable';
import { TourDropdown } from './setlist/TourDropdown';
import { ShowsDropdown } from './setlist/ShowsDropdown';
import { ShowNotes } from './setlist/ShowNotes';
import { GuestLegend } from './setlist/GuestLegend';
import { Callbacks } from './setlist/Callbacks';
import ShowAttendButton from './ShowAttendButton';
import ShowStats from './ShowStats';
import ShowChanges from './ShowChanges';
import SongSpread from './SongSpread';
import { CategoryCompleteBadge } from './CategoryCompleteBadge';
import { JiveCompleteBadge } from './JiveCompleteBadge';
import { DripfieldCompleteBadge } from './DripfieldCompleteBadge';
import ReleaseContainer from './ReleaseContainer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useSetlistData, useTours, useShowDates } from '../hooks/useSetlistData';
import { useSetlistNavigation } from '../hooks/useSetlistNavigation';
import { useShowPosition, useAttendeeCount, useAdminStatus, useMobileDetection, useGuestGroups, useHoverStates, useCopiedEntries, useModalState } from '../hooks/useSetlistDisplay';
import { getGuestColor } from '../utils/setlistUtils';
import SongTourPerformancesModal from './SongTourPerformancesModal';
import wlImage from '../img/WL.png';

// Lazy load heavy components
const ShowImageGenerator = lazy(() => import('./ShowImageGenerator'));
const StarRating = lazy(() => import('./StarRating'));

export function Setlist() {
  const { showId } = useParams();
  
  // Custom hooks for data fetching
  const { show, setlist, loading, showLengthRank } = useSetlistData(showId);
  const { tours } = useTours();
  const { showDates } = useShowDates(show, showId);
  
  // State for show position in tour
  const [showPositionInTour, setShowPositionInTour] = useState<{ position: number; total: number } | null>(null);
  
  // Custom hook for navigation and state management
  const {
    openChangesModal,
    setOpenChangesModal,
    showCoachNotes,
    navigateToVenue,
    handleTourSelect: originalHandleTourSelect,
    handleShowSelect: originalHandleShowSelect,
    scrollToReleases
  } = useSetlistNavigation(show);

  // Wrap navigation handlers to clear embeds
  const handleTourSelect = useCallback((tourId: string) => {
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
    originalHandleTourSelect(tourId);
  }, [originalHandleTourSelect]);

  const handleShowSelect = useCallback((showId: string) => {
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
    originalHandleShowSelect(showId);
  }, [originalHandleShowSelect]);

  const navigate = useNavigate();
  const { user } = useAuth();
  const showPosition = useShowPosition(show || null, showDates);
  const { attendeeCount, setAttendeeCount } = useAttendeeCount(showId, show || null);
  
  // State for category hover highlighting
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // State for YouTube embed
  const [youtubeEmbed, setYoutubeEmbed] = useState<{ release_link: string; release_displayname: string | null; release: string } | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  
  // Clear embeds when showId changes
  useEffect(() => {
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
  }, [showId]);

  // Calculate show position in tour
  useEffect(() => {
    async function calculateShowPosition() {
      if (!show?.show_tour || !showId) {
        setShowPositionInTour(null);
        return;
      }

      try {
        // Fetch all shows in the tour
        const { data, error } = await supabase
          .from('shows')
          .select('show_id, show_canonid, show_date')
          .eq('show_tour', show.show_tour);

        if (error) throw error;

        if (!data || data.length === 0) {
          setShowPositionInTour(null);
          return;
        }

        // Sort by show_canonid first, then show_date (nulls last)
        const sortedShows = [...data].sort((a, b) => {
          // First sort by show_canonid (nulls last)
          if (a.show_canonid === null && b.show_canonid === null) {
            return new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
          }
          if (a.show_canonid === null) return 1;
          if (b.show_canonid === null) return -1;
          if (a.show_canonid !== b.show_canonid) {
            return a.show_canonid - b.show_canonid;
          }
          // If canonid is the same, sort by date
          return new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
        });

        // Find current show's position (1-indexed)
        const position = sortedShows.findIndex(s => s.show_id === showId) + 1;
        const total = sortedShows.length;

        if (position > 0) {
          setShowPositionInTour({ position, total });
        } else {
          setShowPositionInTour(null);
        }
      } catch (error) {
        console.error('Error calculating show position:', error);
        setShowPositionInTour(null);
      }
    }

    calculateShowPosition();
  }, [show?.show_tour, showId]);
  
  // Handle category hover from SongSpread
  const handleCategoryHover = useCallback((category: string | null) => {
    setHoveredCategory(category);
  }, []);

  // Handle YouTube embed from ReleaseContainer - toggle if same release, otherwise replace
  const handleYouTubeEmbed = useCallback((release: any) => {
    setYoutubeEmbed(prev => {
      // If clicking the same release, toggle it off
      if (prev && release && prev.release_link === release.release_link) {
        return null;
      }
      // Otherwise, set to new release (or null to close)
      return release;
    });
  }, []);

  // Handle YouTube loading state
  const handleYouTubeLoading = useCallback((loading: boolean) => {
    setYoutubeLoading(loading);
  }, []);

  // Convert YouTube URL to embed URL
  const convertToYouTubeEmbed = useCallback((youtubeUrl: string): string => {
    const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return youtubeUrl; // Return original if can't parse
  }, []);
  
  // Hooks for DisplaySetlistTable
  const isAdminFromHook = useAdminStatus();
  const isMobileTable = useMobileDetection();
  const guestGroups = useGuestGroups(setlist || []);
  const hoverStates = useHoverStates();
  const { modalSongData, setModalSongData } = useModalState();
  const { copiedEntries, handleNumberClick } = useCopiedEntries();
  
  // Event handlers for DisplaySetlistTable
  const handleSongClick = useCallback((songName: string) => {
    // Clear embeds when opening song modal
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  }, [setModalSongData]);

  const handleLastShowClick = useCallback((showId: string) => {
    // Clear embeds when navigating
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
    navigate(`/setlist/${showId}`);
  }, [navigate]);

  const handleGuestClick = useCallback((guestId: string) => {
    navigate(`/personnel/${guestId}`);
  }, [navigate]);

  const handleJOTYClick = useCallback((year: number) => {
    navigate(`/joty/${year}`);
  }, [navigate]);
  
  // Admin state (keeping existing logic for admin buttons)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [wlHovered, setWlHovered] = useState(false);

  // Check if user is admin with caching
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }
      
      // Check cache first
      const cacheKey = `admin_status_${user.id}`;
      const cachedStatus = sessionStorage.getItem(cacheKey);
      
      if (cachedStatus !== null) {
        setIsAdmin(cachedStatus === 'true');
        setIsAdminLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsAdminLoading(false);
          return;
        }
        
        const adminStatus = data?.is_admin || false;
        setIsAdmin(adminStatus);
        setIsAdminLoading(false);
        
        // Cache the result for this session
        sessionStorage.setItem(cacheKey, adminStatus.toString());
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
    }
    
    checkAdminStatus();
  }, [user]);

  // Handle copying show ID to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!showId) return;
    try {
      await navigator.clipboard.writeText(showId);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [showId]);

  // Handle navigation to admin with this show selected
  const handleEditShow = useCallback(() => {
    if (!showId) return;
    // Store the show ID in localStorage so AdminSetlist can pick it up
    localStorage.setItem('adminSelectedShowId', showId);
    // Set the active tab to Setlist
    localStorage.setItem('adminActiveTab', 'Setlist');
    // Navigate to admin
    navigate('/admin');
  }, [showId, navigate]);

  const handleWlMouseEnter = useCallback(() => {
    setWlHovered(true);
  }, []);

  const handleWlMouseLeave = useCallback(() => {
    setWlHovered(false);
  }, []);


  if (loading) {
    return (
      <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading setlist...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">Show not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto overflow-x-auto">
      {/* Header Bar with Navigation Row */}
      <div className="bg-primary border border-fourth mb-4 w-max min-w-max relative overflow-visible shadow-md">
        {/* Header */}
        <div className="bg-tertiary text-fifth pl-2 pr-1 py-0.5 flex items-center">
          <h2 className="text-sm font-semibold">
            Setlist
          </h2>
          <div className="ml-auto flex items-center gap-1">
            {showPositionInTour && (
              <span className="text-[0.625rem] font-medium bg-primary border border-fourth rounded-md px-1">
                Show {showPositionInTour.position} of {showPositionInTour.total}
              </span>
            )}
            {show?.tour_id && (
              <div className="bg-fourth border border-fourth rounded-md px-1">
                <Link
                  to={`/tours/${show.tour_id}`}
                  className="relative flex items-center"
                >
                  <Info className="w-3 h-3 text-white transition-colors" strokeWidth={2.5} />
                  <span className="text-[0.625rem] font-medium text-white hover:underline whitespace-nowrap ml-1">
                    Tour Info
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center gap-4 relative overflow-visible min-w-max w-max">
          {/* Tours Dropdown */}
          <div className="flex-shrink-0 relative z-[9000]">
            <TourDropdown
              tours={tours}
              currentTour={show?.show_tour || undefined}
              onTourSelect={handleTourSelect}
            />
          </div>

          {/* Navigation Arrows with Shows Dropdown */}
          <div className="flex items-center gap-0.5 flex-shrink-0 relative z-[9000]">
            <button 
              className={`p-0.5 transition-colors flex-shrink-0 ${
                showPosition?.prevShowId 
                  ? 'text-fifth hover:text-tertiary [&_svg]:hover:[stroke-width:4]' 
                  : 'text-secondary cursor-not-allowed'
              }`}
              onClick={() => {
                if (showPosition?.prevShowId) {
                  navigate(`/setlist/${showPosition.prevShowId}`);
                }
              }}
              disabled={!showPosition?.prevShowId}
            >
              <ArrowLeft size={16} />
            </button>
            <ShowsDropdown
              showDates={showDates}
              currentShowId={showId}
              onShowSelect={handleShowSelect}
            />
            <button 
              className={`p-0.5 transition-colors flex-shrink-0 ${
                showPosition?.nextShowId 
                  ? 'text-fifth hover:text-tertiary [&_svg]:hover:[stroke-width:4]' 
                  : 'text-secondary cursor-not-allowed'
              }`}
              onClick={() => {
                if (showPosition?.nextShowId) {
                  navigate(`/setlist/${showPosition.nextShowId}`);
                }
              }}
              disabled={!showPosition?.nextShowId}
            >
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Show Info */}
          <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            {show.show_group && (
              <span className="text-sm font-semibold text-fifth pr-4 tracking-tight whitespace-nowrap">{show.show_group}</span>
            )}
            {show.show_subvenue && (
              (show as any).venue_id ? (
                <Link
                  to={`/venue/${(show as any).venue_id}`}
                  className="text-[0.625rem] font-medium text-fifth hover:underline transition-colors whitespace-nowrap"
                >
                  {show.show_subvenue}
                </Link>
              ) : (show as any).show_subvenue_venue ? (
                <Link
                  to={`/venue/${encodeURIComponent((show as any).show_subvenue_venue)}`}
                  className="text-[0.625rem] font-medium text-fifth hover:underline transition-colors whitespace-nowrap"
                >
                  {show.show_subvenue}
                </Link>
              ) : (
                <Link
                  to={`/venue/${encodeURIComponent(show.show_subvenue)}`}
                  className="text-[0.625rem] font-medium text-fifth hover:underline transition-colors whitespace-nowrap"
                >
                  {show.show_subvenue}
                </Link>
              )
            )}
            {show.show_venue_location && (
              <span className="text-[0.625rem] font-light text-fifth pr-4 whitespace-nowrap">{show.show_venue_location}</span>
            )}
            {show?.show_wl_link && (
              <div className="relative flex items-center flex-shrink-0 whitespace-nowrap">
                <button
                  onClick={() => show.show_wl_link && window.open(show.show_wl_link, '_blank')}
                  className="p-0.5 rounded hover:border border border-primary text-fifth hover:border-[#78b1a1] hover:bg-[#78b1a1]/30 transition-colors flex items-center justify-center flex-shrink-0"
                  onMouseEnter={handleWlMouseEnter}
                  onMouseLeave={handleWlMouseLeave}
                >
                  <img 
                    src={wlImage} 
                    alt="WysteriaLane" 
                    className="w-4 h-4"
                  />
                </button>
                {wlHovered && (
                  <div className="absolute left-0 top-full mt-1 text-xs font-medium bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg whitespace-nowrap z-[9999]">
                    Chat on WysteriaLane.org!
                  </div>
                )}
              </div>
            )}

            {/* Right-aligned items */}
            <div className="flex items-center gap-3 ml-auto flex-shrink-0 whitespace-nowrap">
              {/* Star Rating */}
              <div className="flex-shrink-0">
                <Suspense fallback={<div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>}>
                  <StarRating 
                    showId={showId || ''} 
                    isVisible={show?.rating_visibility || false}
                    showDate={show?.show_date}
                    showVenueLocation={show?.show_venue_location}
                  />
                </Suspense>
              </div>

              {/* Attendee Button */}
              <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                <ShowAttendButton 
                  showId={showId || ''} 
                  onAttendanceChange={(isAttending) => {
                    setAttendeeCount(isAttending ? attendeeCount + 1 : attendeeCount - 1);
                  }}
                />
                <span className="text-[0.625rem] font-light text-fifth pr-2 whitespace-nowrap">
                  {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
                </span>
              </div>

              {/* Admin Buttons */}
              {!isAdminLoading && (isAdmin || user?.id === '8f13a985-ef21-44dc-a381-d6e80c43803f') && (
                <div className="flex gap-1 items-center px-1 flex-shrink-0 whitespace-nowrap">
                  <button
                    onClick={handleCopyLink}
                    className={`p-0.5 rounded border transition-all duration-200 flex-shrink-0 ${
                      linkCopied 
                        ? 'bg-green-500 text-white border-green-600' 
                        : 'bg-tertiary text-fifth border-fourth hover:bg-fourth hover:text-white'
                    }`}
                    title="Copy Show ID"
                  >
                    <LinkIcon size={13} />
                  </button>
                  <Suspense fallback={<div className="w-6 h-6 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>}>
                    <ShowImageGenerator show={show} setlist={setlist} />
                  </Suspense>
                  {isAdmin && (
                    <button
                      onClick={handleEditShow}
                      className="p-0.5 rounded bg-tertiary text-fifth border border-fourth hover:bg-fourth hover:text-white transition-colors flex-shrink-0"
                      title="Edit Show"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        {setlist && setlist.length > 0 ? (
          <div className="flex border-t border-fourth -mt-[1px]">
            {/* Left Column - 200px wide */}
            <div className="w-[200px] flex-shrink-0 -mt-[1px] pt-2 border-r border-t border-fourth bg-canvas/60">
            {/* Show Stats and Show Changes */}
            <div>
              {setlist && setlist.length > 0 && (
                <ShowStats 
                  setlist={setlist.map(entry => ({
                    entry_length: entry.entry_length,
                    times_played_num: entry.times_played_num?.toString() || null,
                    shows_since_debut_num: entry.shows_since_debut_num?.toString() || null,
                    entry_song: entry.entry_song,
                    last_count: entry.last_count,
                    entry_short: entry.entry_short
                  }))}
                  show_canonid={show?.show_canonid || null}
                  show_rarity={show?.show_rarity || null}
                  show_gap={show?.show_gap || null}
                  show_length_rank={showLengthRank || null}
                />
              )}

              {showId && (
                <ShowChanges 
                  showId={showId}
                  openModal={openChangesModal}
                  setOpenModal={setOpenChangesModal}
                />
              )}

              {/* Badges */}
              <CategoryCompleteBadge categoryName={show?.show_listcategorycomplete || null} />
              <JiveCompleteBadge showJiveComplete={show?.show_jivecomplete || false} />
              <DripfieldCompleteBadge showDripfieldComplete={show?.show_dripfieldcomplete || false} />

              {/* Song Spread */}
              {setlist && setlist.length > 0 && (
                <div className="pt-2">
                  <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
                    <h2 className="text-xs font-semibold">Song Spread</h2>
                  </div>
                  <div>
                    <SongSpread 
                      setlist={setlist.map(entry => ({
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
            
            {/* Release Container */}
            {showId && (
              <ReleaseContainer 
                showId={showId}
                highlightOnMount={scrollToReleases}
                className={scrollToReleases ? 'highlight-releases' : ''}
                onYouTubeEmbed={handleYouTubeEmbed}
                onYouTubeLoading={handleYouTubeLoading}
              />
            )}
            </div>

            {/* Right Column - naturally as wide as needed */}
            <div className="flex-1 px-2 py-2 space-y-2 -mt-[1px]">
            {show?.show_detail && (
              <div className="text-fifth font-semibold text-base">
                {show.show_detail}
              </div>
            )}
            {show?.show_alert && (
              <div className="text-[#E83356] font-semibold text-sm">
                [{show.show_alert}]
              </div>
            )}
            <ShowNotes show={show} />
            {setlist && setlist.length > 0 && (
              <DisplaySetlistTable
                setlist={setlist}
                show={show || undefined}
                isMobile={isMobileTable}
                isAdmin={isAdminFromHook}
                copiedEntries={copiedEntries}
                getGuestColor={(entry) => getGuestColor(entry, guestGroups)}
                hoverStates={hoverStates}
                hoveredCategory={hoveredCategory}
                onSongClick={handleSongClick}
                onLastShowClick={handleLastShowClick}
                onGuestClick={handleGuestClick}
                onJOTYClick={handleJOTYClick}
                onNumberClick={(entryId) => handleNumberClick(entryId, isAdminFromHook)}
              />
            )}
            
            {/* Stacked Layout: Callbacks and GuestLegend */}
            <div className="space-y-2">
              {show?.show_callbacks && (
                <Callbacks show={show} />
              )}
              
              {setlist && setlist.length > 0 && (
                <GuestLegend 
                  guestGroups={guestGroups}
                  isMobile={isMobileTable}
                  hoverStates={hoverStates}
                  onGuestClick={handleGuestClick}
                />
              )}
            </div>

            {/* YouTube Embed - appears at bottom of right column */}
            {youtubeLoading && (
              <div className="mt-2 flex justify-center items-center py-4">
                <div className="flex items-center gap-2 text-fifth">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              </div>
            )}
            {youtubeEmbed && !youtubeLoading && (
              <div className="mt-2 flex">
                <iframe 
                  className="lg:!h-[450px]"
                  style={{ 
                    border: 0, 
                    width: 'min(800px, 100%)', 
                    height: '450px' 
                  }}
                  src={convertToYouTubeEmbed(youtubeEmbed.release_link)}
                  title={youtubeEmbed.release_displayname || youtubeEmbed.release}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
            </div>
          </div>
        ) : (
          /* Right Column only - when no setlist entries */
          <div className="flex-1 px-2 py-2 space-y-2 -mt-[1px]">
            {show?.show_detail && (
              <div className="text-fifth font-semibold text-base">
                {show.show_detail}
              </div>
            )}
            {show?.show_alert && (
              <div className="text-[#E83356] font-semibold text-sm">
                [{show.show_alert}]
              </div>
            )}
            <ShowNotes show={show} />
            
            {/* Stacked Layout: Callbacks */}
            <div className="space-y-2">
              {show?.show_callbacks && (
                <Callbacks show={show} />
              )}
            </div>

            {/* YouTube Embed - appears at bottom of right column */}
            {youtubeLoading && (
              <div className="mt-2 flex justify-center items-center py-4">
                <div className="flex items-center gap-2 text-fifth">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              </div>
            )}
            {youtubeEmbed && !youtubeLoading && (
              <div className="mt-2 flex">
                <iframe 
                  className="lg:!h-[450px]"
                  style={{ 
                    border: 0, 
                    width: 'min(800px, 100%)', 
                    height: '450px' 
                  }}
                  src={convertToYouTubeEmbed(youtubeEmbed.release_link)}
                  title={youtubeEmbed.release_displayname || youtubeEmbed.release}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={show?.tour_id || ''}
        currentShowId={show?.show_id || ''}
      />
    </div>
  );
}
