import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Link, Pencil } from 'lucide-react';
import ShowAttendButton from './ShowAttendButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  };
  navigateToVenue?: () => void;
  showPosition: ShowPosition | null;
  attendeeCount: number;
  onAttendeeCountChange?: (newCount: number) => void; // New prop for updating attendee count
}

// Memoize this component to prevent re-renders from parent
const ShowInfoContent = React.memo(({ 
  show, 
  navigateToVenue, 
  showPosition, 
  attendeeCount,
  onAttendeeCountChange
}: ShowInfoContentProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
  
  return (
    <div className="bg-primary border border-black rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-black">
          {formatInTimeZone(
            new Date(show.show_date),
            'UTC',
            'MM.dd.yy'
          )}
        </div>
        {/* Admin buttons */}
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={`p-1.5 rounded border transition-all duration-200 ${
                linkCopied 
                  ? 'bg-green-500 text-white border-green-600' 
                  : 'bg-[#f9ae37] text-black border-black hover:bg-white'
              }`}
              title="Copy Show ID"
            >
              <Link size={16} />
            </button>
            <button
              onClick={handleEditShow}
              className="p-1.5 rounded bg-[#f9ae37] text-black border border-black hover:bg-white transition-colors"
              title="Edit Show"
            >
              <Pencil size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-black leading-5">{show.show_group}</p>
          {show.show_detail && (
            <p className="text-sm text-black">{show.show_detail}</p>
          )}
          {show.show_alert && (
            <p className="text-sm">
              <span className="font-bold text-[#E83356]">
                [{show.show_alert}]
              </span>
            </p>
          )}
        </div>
        <hr className="border-black/10" />
        <div className="space-y-1">
          <p className="text-md font-semibold text-black leading-5 text-left w-full">
            {navigateToVenue ? (
              <button 
                onClick={navigateToVenue}
                className="hover:text-[#a9682e] hover:underline transition-colors cursor-pointer text-left w-full"
              >
                {show.show_subvenue}
              </button>
            ) : (
              <span className="text-left w-full">{show.show_subvenue}</span>
            )}
          </p>
          <p className="text-sm text-black text-left w-full">{show.show_venue_location}</p>
        </div>
        {/* Tour information with horizontal divider */}
        {show.show_tour && (
          <>
            <hr className="border-black/10" />
            <div className="space-y-1">
              <p className="text-md font-semibold text-black leading-5 text-center">
                <span 
                  className="cursor-pointer hover:text-[#a9682e] hover:underline transition-colors"
                  onClick={() => navigate(`/tours/${show.tour_id}`)}
                >
                  {show.show_tour}
                </span>
              </p>
              {showPosition ? (
                <div className="flex justify-center items-center pt-1 gap-4">
                  <button 
                    className={`p-1 rounded-full border ${
                      showPosition.prevShowId 
                        ? 'text-black bg-[#f9ae37] hover:bg-white border border-black' 
                        : 'text-[#9d9d9d] border-[#9d9d9d] cursor-not-allowed'
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
                  <span className="text-sm text-black">
                    Show {showPosition.current} of {showPosition.total}
                  </span>
                  <button 
                    className={`p-1 rounded-full border ${
                      showPosition.nextShowId 
                        ? 'text-black bg-[#f9ae37] hover:bg-white border border-black' 
                        : 'text-[#9d9d9d] border-[#9d9d9d] cursor-not-allowed'
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
              ) : (
                <p className="text-sm text-black">
                  {show.show_canonid ? "Show information loading..." : "Non-canonical show"}
                </p>
              )}
            </div>
          </>
        )}
        {/* Attendance information with horizontal divider */}
        <hr className="border-black/10" />
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
          <p className="text-sm text-black">
            {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShowInfoContent;