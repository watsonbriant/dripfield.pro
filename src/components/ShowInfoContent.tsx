import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Link, Pencil } from 'lucide-react';
import ShowAttendButton from './ShowAttendButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import wlImage from '../img/WL.png';

// Lazy load heavy components
const ShowImageGenerator = lazy(() => import('./ShowImageGenerator'));
const StarRating = lazy(() => import('./StarRating'));

interface SetlistEntry {
  entry_id: string;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_set: string;
  entry_placement: string;
  entry_coachnotes?: string | null;
}

interface ShowPosition {
  current: number;
  total: number;
  prevShowId: string | null;
  nextShowId: string | null;
}

interface ShowInfoContentProps {
  show: {
    show_id: string;
    show_date: string;
    show_group: string;
    show_detail: string | null;
    show_subvenue: string;
    show_venue_location: string;
    show_alert: string | null;
    show_canonid: number | null;
    show_tour: string | null;
    tour_id?: string;
    show_wl_link?: string | null;
    rating_visibility?: boolean;
  };
  navigateToVenue?: () => void;
  showPosition: ShowPosition | null;
  attendeeCount: number;
  onAttendeeCountChange?: (newCount: number) => void;
  setlist?: SetlistEntry[];
}

// Memoize this component to prevent re-renders from parent
const ShowInfoContent = React.memo(({ 
  show, 
  navigateToVenue, 
  showPosition, 
  attendeeCount,
  onAttendeeCountChange,
  setlist = []
}: ShowInfoContentProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    try {
      await navigator.clipboard.writeText(show.show_id);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [show.show_id]);

  // Handle navigation to admin with this show selected
  const handleEditShow = useCallback(() => {
    // Store the show ID in localStorage so AdminSetlist can pick it up
    localStorage.setItem('adminSelectedShowId', show.show_id);
    // Set the active tab to Setlist
    localStorage.setItem('adminActiveTab', 'Setlist');
    // Navigate to admin
    navigate('/admin');
  }, [show.show_id, navigate]);

  const handleWlMouseMove = useCallback((_e: React.MouseEvent) => {
    // Mouse position tracking removed as it's not used
  }, []);

  const handleWlMouseEnter = useCallback((_e: React.MouseEvent) => {
    setWlHovered(true);
  }, []);

  const handleWlMouseLeave = useCallback(() => {
    setWlHovered(false);
  }, []);
  
  return (
    <div className="bg-primary border border-fourth rounded-lg p-3">
        {/* WL Image - always visible if show_wl_link exists */}
        {show.show_wl_link && (
        <div className="relative mb-2">
            <button
              onClick={() => show.show_wl_link && window.open(show.show_wl_link, '_blank')}
              className="p-1 rounded hover:border border border-primary text-fifth hover:border-[#78b1a1] hover:bg-[#78b1a1]/30 transition-colors"
              onMouseEnter={handleWlMouseEnter}
              onMouseMove={handleWlMouseMove}
              onMouseLeave={handleWlMouseLeave}
              title="Chat on WysteriaLane.org!"
            >
              <img 
                src={wlImage} 
                alt="WysteriaLane" 
                className="w-8 h-8"
              />
            </button>
            {wlHovered && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-fourth shadow-lg whitespace-nowrap z-[9999]">
                Chat on WysteriaLane.org!
              </div>
            )}
          </div>
        )}

      {/* Bottom section: Detail, Alert, and Rating */}
      <div className="space-y-1">
        {show.show_detail && (
          <p className="text-sm text-fifth">{show.show_detail}</p>
        )}
        {show.show_alert && (
          <p className="text-sm">
            <span className="font-medium text-[#E83356]">
              [{show.show_alert}]
            </span>
          </p>
        )}
        <Suspense fallback={<div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>}>
          <StarRating 
            showId={show.show_id} 
            isVisible={show.rating_visibility || false}
            showDate={show.show_date}
            showVenueLocation={show.show_venue_location}
          />
        </Suspense>
      </div>

      {/* Rest of component */}
      <div className="mt-2 space-y-2">
        {/* Tour information with horizontal divider */}
        {show.show_tour && (
          <>
            <hr className="border-fourth" />
            <div className="space-y-0">
              <p className="text-md font-medium text-fifth leading-5 text-center">
                <RouterLink 
                  to={`/tours/${show.tour_id}`}
                  className="cursor-pointer hover:underline transition-colors"
                >
                  {show.show_tour}
                </RouterLink>
              </p>
              {showPosition ? (
                <div className="space-y-2">
                  <div className="flex justify-center items-center pt-0.5">
                    <span className="text-sm text-fifth font-light">
                      Show {showPosition.current} of {showPosition.total}
                    </span>
                  </div>
                  {/* Admin buttons - centered below navigation */}
                  {!isAdminLoading && (isAdmin || user?.id === '8f13a985-ef21-44dc-a381-d6e80c43803f') && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className={`p-1.5 rounded border transition-all duration-200 ${
                          linkCopied 
                            ? 'bg-green-500 text-white border-green-600' 
                            : 'bg-tertiary text-fifth border-fourth hover:bg-primary'
                        }`}
                        title="Copy Show ID"
                      >
                        <Link size={16} />
                      </button>
                      <Suspense fallback={<div className="w-6 h-6 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>}>
                        <ShowImageGenerator show={show} setlist={setlist} />
                      </Suspense>
                      {isAdmin && (
                        <button
                          onClick={handleEditShow}
                          className="p-1.5 rounded bg-tertiary text-fifth border border-fourth hover:bg-primary transition-colors"
                          title="Edit Show"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-fifth text-center">
                    {show.show_canonid ? "Show information loading..." : "Non-canonical show"}
                  </p>
                  {/* Admin buttons - centered below text */}
                  {!isAdminLoading && (isAdmin || user?.id === '8f13a985-ef21-44dc-a381-d6e80c43803f') && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className={`p-1.5 rounded border transition-all duration-200 ${
                          linkCopied 
                            ? 'bg-green-500 text-white border-green-600' 
                            : 'bg-tertiary text-fifth border-fourth hover:bg-primary'
                        }`}
                        title="Copy Show ID"
                      >
                        <Link size={16} />
                      </button>
                      <Suspense fallback={<div className="w-6 h-6 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>}>
                        <ShowImageGenerator show={show} setlist={setlist} className="bg-tertiary" />
                      </Suspense>
                      {isAdmin && (
                        <button
                          onClick={handleEditShow}
                          className="p-1.5 rounded bg-tertiary text-fifth border border-fourth hover:bg-primary transition-colors"
                          title="Edit Show"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {/* Attendance information with horizontal divider */}
        <hr className="border-fourth" />
        <div className="flex justify-center items-center space-x-4">
          <ShowAttendButton 
            showId={show.show_id} 
            onAttendanceChange={(isAttending) => {
              // If onAttendeeCountChange callback exists, call it with the updated count
              if (onAttendeeCountChange) {
                // If they're now attending, increment the count
                // If they're no longer attending, decrement the count
                onAttendeeCountChange(isAttending ? attendeeCount + 1 : attendeeCount - 1);
              }
            }}
          />
          <p className="text-sm font-light text-fifth">
            {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShowInfoContent;