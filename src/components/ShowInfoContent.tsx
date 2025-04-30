import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ShowAttendButton from './ShowAttendButton';

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
}

// Memoize this component to prevent re-renders from parent
const ShowInfoContent = React.memo(({ show, navigateToVenue, showPosition }: ShowInfoContentProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-white">
          {formatInTimeZone(
            new Date(show.show_date),
            'UTC',
            'MM.dd.yy'
          )}
        </div>
        <ShowAttendButton showId={show.show_id} />
      </div>
      <div className="mt-2 space-y-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[#fce7ca]/90 leading-5">{show.show_group}</p>
          {show.show_detail && (
            <p className="text-sm text-white">{show.show_detail}</p>
          )}
        </div>
        <hr className="border-white/10" />
        <div className="space-y-1">
          <p className="text-md font-semibold text-[#fce7ca]/90 leading-5 text-left w-full">
            {navigateToVenue ? (
              <button 
                onClick={navigateToVenue}
                className="hover:text-white hover:underline transition-colors cursor-pointer text-left w-full"
              >
                {show.show_subvenue}
              </button>
            ) : (
              <span className="text-left w-full">{show.show_subvenue}</span>
            )}
          </p>
          <p className="text-sm text-white text-left w-full">{show.show_venue_location}</p>
        </div>
        {/* Added tour information with horizontal divider */}
        {show.show_tour && (
          <>
            <hr className="border-white/10" />
            <div className="space-y-1">
              <p className="text-md font-semibold text-[#fce7ca]/90 leading-5 text-center">
                <span 
                  className="cursor-pointer hover:underline"
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
                        ? 'text-white hover:bg-[#ec742e] hover:text-primary hover:border-transparent' 
                        : 'text-[#484f59] border-white/20 cursor-not-allowed'
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
                  <span className="text-sm text-white">
                    Show {showPosition.current} of {showPosition.total}
                  </span>
                  <button 
                    className={`p-1 rounded-full border ${
                      showPosition.nextShowId 
                        ? 'text-white hover:bg-[#ec742e] hover:text-primary hover:border-transparent' 
                        : 'text-[#484f59] border-white/20 cursor-not-allowed'
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
                <p className="text-sm text-white">
                  {show.show_canonid ? "Show information loading..." : "Non-canonical show"}
                </p>
              )}
            </div>
          </>
        )}
        {show.show_alert && (
          <p className="text-sm text-center">
            <span className="font-bold text-[#E83356]">
              [{show.show_alert}]
            </span>
          </p>
        )}
      </div>
    </div>
  );
});

export default ShowInfoContent;