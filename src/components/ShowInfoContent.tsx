import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Link, Pencil } from 'lucide-react';
import ShowAttendButton from './ShowAttendButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import wlImage from '../img/WL.png';
import ShowImageGenerator from './ShowImageGenerator';

interface SetlistEntry {
  entry_id: string;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [wlHovered, setWlHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
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
          return;
        }
        
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      }
    }
    
    checkAdminStatus();
  }, [user]);

  // Handle copying show ID to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(show.show_id);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle navigation to admin with this show selected
  const handleEditShow = () => {
    // Store the show ID in localStorage so AdminSetlist can pick it up
    localStorage.setItem('adminSelectedShowId', show.show_id);
    // Set the active tab to Setlist
    localStorage.setItem('adminActiveTab', 'Setlist');
    // Navigate to admin
    navigate('/admin');
  };

  const handleWlMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };
  
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-0">
          <div className="text-xl font-medium text-fifth">
            {formatInTimeZone(
              new Date(show.show_date),
              'UTC',
              'MM.dd.yy'
            )}
          </div>
          <p className="text-2xl font-trad text-fifth leading-5 pb-2">{show.show_group}</p>
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
        </div>
        {/* WL Image - always visible if show_wl_link exists */}
        {show.show_wl_link && (
          <div className="relative">
            <button
              onClick={() => window.open(show.show_wl_link, '_blank')}
              className="p-1 rounded hover:border border border-primary text-fifth hover:border-[#78b1a1] hover:bg-[#78b1a1]/30 transition-colors"
              onMouseEnter={(e) => {
                setWlHovered(true);
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={handleWlMouseMove}
              onMouseLeave={() => setWlHovered(false)}
              title="Chat on WysteriaLane.org!"
            >
              <img 
                src={wlImage} 
                alt="WysteriaLane" 
                className="w-8 h-8"
              />
            </button>
            {wlHovered && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-xs font-semibold bg-secondary text-fifth px-3 py-1 rounded border border-secondary shadow-lg whitespace-nowrap z-[9999]">
                Chat on WysteriaLane.org!
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-2">
        <hr className="border-secondary" />
        <div className="space-y-0">
          <p className="text-md font-medium text-fifth leading-5 text-left w-full">
            {navigateToVenue ? (
              <button 
                onClick={navigateToVenue}
                className="hover:underline transition-colors cursor-pointer text-left w-full"
              >
                {show.show_subvenue}
              </button>
            ) : (
              <span className="text-left w-full">{show.show_subvenue}</span>
            )}
          </p>
          <p className="text-sm font-light text-fifth text-left w-full">{show.show_venue_location}</p>
        </div>
        {/* Tour information with horizontal divider */}
        {show.show_tour && (
          <>
            <hr className="border-secondary" />
            <div className="space-y-0">
              <p className="text-md font-medium text-fifth leading-5 text-center">
                <span 
                  className="cursor-pointer hover:underline transition-colors"
                  onClick={() => navigate(`/tours/${show.tour_id}`)}
                >
                  {show.show_tour}
                </span>
              </p>
              {showPosition ? (
                <div className="space-y-2">
                  <div className="flex justify-center items-center pt-0.5 gap-4">
                    <button 
                      className={`p-1 rounded-full border ${
                        showPosition.prevShowId 
                          ? 'text-fifth bg-tertiary hover:bg-primary border border-secondary' 
                          : 'text-secondary border-secondary cursor-not-allowed'
                      } transition-colors`}
                      onClick={() => {
                        if (showPosition.prevShowId) {
                          navigate(`/setlist/${showPosition.prevShowId}`);
                        }
                      }}
                      disabled={!showPosition.prevShowId}
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <span className="text-sm text-fifth font-light">
                      Show {showPosition.current} of {showPosition.total}
                    </span>
                    <button 
                      className={`p-1 rounded-full border ${
                        showPosition.nextShowId 
                          ? 'text-fifth bg-tertiary hover:bg-primary border border-secondary' 
                          : 'text-secondary border-secondary cursor-not-allowed'
                      } transition-colors`}
                      onClick={() => {
                        if (showPosition.nextShowId) {
                          navigate(`/setlist/${showPosition.nextShowId}`);
                        }
                      }}
                      disabled={!showPosition.nextShowId}
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                  {/* Admin buttons - centered below navigation */}
                  {(isAdmin || user?.id === '8f13a985-ef21-44dc-a381-d6e80c43803f') && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className={`p-1.5 rounded border transition-all duration-200 ${
                          linkCopied 
                            ? 'bg-green-500 text-primary border-green-600' 
                            : 'bg-tertiary text-fifth border-secondary hover:bg-primary'
                        }`}
                        title="Copy Show ID"
                      >
                        <Link size={16} />
                      </button>
                      <ShowImageGenerator show={show} setlist={setlist} />
                      {isAdmin && (
                        <button
                          onClick={handleEditShow}
                          className="p-1.5 rounded bg-tertiary text-fifth border border-secondary hover:bg-primary transition-colors"
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
                  {(isAdmin || user?.id === '8f13a985-ef21-44dc-a381-d6e80c43803f') && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className={`p-1.5 rounded border transition-all duration-200 ${
                          linkCopied 
                            ? 'bg-green-500 text-primary border-green-600' 
                            : 'bg-tertiary text-fifth border-secondary hover:bg-primary'
                        }`}
                        title="Copy Show ID"
                      >
                        <Link size={16} />
                      </button>
                      <ShowImageGenerator show={show} setlist={setlist} className="bg-[#f9ae37]" />
                      {isAdmin && (
                        <button
                          onClick={handleEditShow}
                          className="p-1.5 rounded bg-tertiary text-fifth border border-secondary hover:bg-primary transition-colors"
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
        <hr className="border-secondary" />
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