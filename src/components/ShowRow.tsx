import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, FileMusic, Users, Star, AudioLines } from 'lucide-react';
import wlImage from '../img/WL.png';

interface Show {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  venue_location: string | null;
  show_venue_location: string;
  show_subvenue_venue: string;
  venue_id?: string;
  attended?: boolean;
  show_wl_link?: string | null;
}

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

interface ShowRowProps {
  show: Show;
  index: number;
  tours: TourCount[];
  attendeeCounts: Record<string, number>;
  showRatings: Record<string, number>;
  showsWithSetlists: Set<string>;
  showsWithReleases: Set<string>;
}

export function ShowRow({
  show,
  index,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases
}: ShowRowProps) {
  const { user } = useAuth();
  const [hoveredTour, setHoveredTour] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    text: string;
    position: { x: number; y: number } | null;
  }>({
    isVisible: false,
    text: '',
    position: null
  });

  const updateTooltip = (text: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTooltipState({
      isVisible: true,
      text,
      position: { x: rect.left + rect.width / 2, y: rect.top - 5 }
    });
  };

  const hideTooltip = () => {
    setTooltipState({ isVisible: false, text: '', position: null });
  };

  // Update tooltip position on scroll/resize
  useEffect(() => {
    if (!tooltipState.isVisible || !tooltipState.position) return;

    const updatePosition = () => {
      hideTooltip();
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [tooltipState.isVisible, tooltipState.position]);

  const getTourColor = (tourName: string): string => {
    const tour = tours.find(t => t.tour === tourName);
    return tour ? tour.color : 'transparent';
  };

  return (
    <tr
      className={`${
        index % 2 === 0 ? 'bg-primary' : 'bg-primary'
      } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
    >
      <td 
        style={{ 
          width: '5px',
          padding: 0,
          backgroundColor: getTourColor(show.show_tour)
        }}
        onMouseEnter={(e) => {
          setHoveredTour(show.show_tour);
          setMousePosition({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={(e) => {
          setMousePosition({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setHoveredTour(null)}
      >
        {hoveredTour === show.show_tour && (
          <div 
            className="fixed bg-canvas text-fifth px-2 py-1 border border-fourth min-w-max z-[9999]"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`
            }}
          >
            <div className="font-medium">{show.show_tour}</div>
          </div>
        )}
      </td>
      <td className="px-2 py-0.5 text-fifth whitespace-nowrap text-center">
        <span className="font-medium">
          <Link
            to={`/setlist/${show.show_id}`}
            className="transition-colors table-link"
          >
            {show.show_date
              .split('-')
              .slice(1)
              .concat(show.show_date.substring(2, 4))
              .join('.')}
          </Link>
        </span>
      </td>
      {user && (
        <td className="text-center">
          {show.attended && (
            <div className="flex justify-center items-center h-full">
              <div className="rounded-full p-0.5 bg-green-600">
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>
          )}
        </td>
      )}
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_group}</td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
        {show.venue_id ? (
          <Link
            to={`/venue/${show.venue_id}`}
            className="hover:underline transition-colors"
          >
            {show.show_subvenue}
          </Link>
        ) : show.show_subvenue_venue ? (
          <Link
            to={`/venue/${encodeURIComponent(show.show_subvenue_venue)}`}
          className="hover:underline transition-colors"
        >
          {show.show_subvenue}
          </Link>
        ) : (
          <span>{show.show_subvenue}</span>
        )}
      </td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_venue_location}</td>
      <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
        <div className="relative flex items-center group">
          <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-10' : ''}`}>
            {[1, 2, 3, 4, 5].map((starNumber) => {
              const rating = showRatings[show.show_id] || 0;
              const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

              return (
                <div key={starNumber} className="relative">
                  <Star
                    size={12}
                    className="text-fourth"
                    fill="none"
                    stroke="currentColor"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercentage * 100}%` }}
                  >
                    <Star
                      size={12}
                      className="text-fourth"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {showRatings[show.show_id] > 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-fifth pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              {showRatings[show.show_id].toFixed(2)}
            </div>
          )}
        </div>
      </td>
      <td className="text-center align-middle">
        {showsWithSetlists.has(show.show_id) && (
          <div className="flex justify-center items-center h-full">
            <Link
              to={`/setlist/${show.show_id}`}
              state={{ openChangesModal: true }}
              className="text-[#006400] hover:text-white hover:bg-[#006400] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px] inline-block"
              onMouseEnter={(e) => updateTooltip('Setlist Scan', e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <FileMusic size={12} strokeWidth={2} />
            </Link>
          </div>
        )}
      </td>
      <td className="text-center align-middle">
        {showsWithReleases.has(show.show_id) && (
          <div className="flex justify-center items-center h-full">
            <Link
              to={`/setlist/${show.show_id}`}
              className="text-[#7c2128] hover:text-white hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px] inline-block"
              onMouseEnter={(e) => updateTooltip('Media Available', e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <AudioLines size={12} strokeWidth={2} />
            </Link>
          </div>
        )}
      </td>
      <td className="text-center text-fifth">
        {attendeeCounts[show.show_id] > 0 && (
          <span className="text-[0.625rem] font-medium">{attendeeCounts[show.show_id]}</span>
        )}
      </td>
      <td className="text-center align-middle">
        {show.show_wl_link && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={() => window.open(show.show_wl_link, '_blank')}
              className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
              onMouseEnter={(e) => updateTooltip('Chat on WysteriaLane.org', e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <img src={wlImage} alt="WysteriaLane" className="w-[12px] h-[12px]" />
            </button>
          </div>
        )}
      </td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
        {show.show_detail && show.show_detail}
        {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
        {show.show_alert && <span className="text-[#CE1126] font-medium">[{show.show_alert}]</span>}
      </td>
      {/* Tooltip Portal */}
      {tooltipState.isVisible && tooltipState.position && createPortal(
        <div 
          className="fixed text-[0.625rem] leading-[0.75rem] font-normal bg-canvas text-fifth px-1.5 py-1 rounded border border-fourth shadow-lg whitespace-nowrap pointer-events-none z-[99999]"
          style={{ 
            left: `${tooltipState.position.x}px`,
            top: `${tooltipState.position.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '3px'
          }}
        >
          {tooltipState.text}
        </div>,
        document.body
      )}
    </tr>
  );
}
