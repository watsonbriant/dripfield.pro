import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  onNavigateToVenue: (show: Show) => void;
}

export function ShowRow({
  show,
  index,
  tours,
  attendeeCounts,
  showRatings,
  showsWithSetlists,
  showsWithReleases,
  onNavigateToVenue
}: ShowRowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredTour, setHoveredTour] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getTourColor = (tourName: string): string => {
    const tour = tours.find(t => t.tour === tourName);
    return tour ? tour.color : 'transparent';
  };

  return (
    <tr
      className={`${
        index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
      } hover:bg-tertiary/40 transition-colors text-xs`}
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
            className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary min-w-max z-[9999]"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`
            }}
          >
            <div className="font-medium">{show.show_tour}</div>
          </div>
        )}
      </td>
      <td className="px-3 py-0.5 text-fifth whitespace-nowrap">
        <span className="font-medium">
          <button
            onClick={() => navigate(`/setlist/${show.show_id}`)}
            className="transition-colors table-link"
          >
            {show.show_date
              .split('-')
              .slice(1)
              .concat(show.show_date.substring(2, 4))
              .join('.')}
          </button>
        </span>
      </td>
      {user && (
        <td className="w-8 text-center">
          {show.attended && (
            <div className="flex justify-center items-center h-full">
              <div className="rounded-full p-0.5 bg-green-600">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
          )}
        </td>
      )}
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_group}</td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
        <button
          onClick={() => onNavigateToVenue(show)}
          className="hover:underline transition-colors"
        >
          {show.show_subvenue}
        </button>
      </td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{show.show_venue_location}</td>
      <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
        <div className="relative flex items-center group">
          <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-30' : ''}`}>
            {[1, 2, 3, 4, 5].map((starNumber) => {
              const rating = showRatings[show.show_id] || 0;
              const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

              return (
                <div key={starNumber} className="relative">
                  <Star
                    size={16}
                    className="text-secondary"
                    fill="none"
                    stroke="currentColor"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercentage * 100}%` }}
                  >
                    <Star
                      size={16}
                      className="text-tertiary"
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
      <td className="w-8 text-center align-middle">
        {showsWithSetlists.has(show.show_id) && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={() => {
                navigate(`/setlist/${show.show_id}`, { state: { openChangesModal: true } });
              }}
              className="text-[#006400] hover:text-primary hover:bg-[#006400] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
            >
              <FileMusic size={14.5} strokeWidth={2} />
            </button>
          </div>
        )}
      </td>
      <td className="w-8 text-center align-middle">
        {showsWithReleases.has(show.show_id) && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={() => navigate(`/setlist/${show.show_id}`)}
              className="text-[#7c2128] hover:text-primary hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
            >
              <AudioLines size={14.5} strokeWidth={2} />
            </button>
          </div>
        )}
      </td>
      <td className="w-8 text-center text-fifth">
        {attendeeCounts[show.show_id] > 0 && (
          <span className="text-xs font-medium">{attendeeCounts[show.show_id]}</span>
        )}
      </td>
      <td className="w-8 text-center align-middle">
        {show.show_wl_link && (
          <div className="flex justify-center items-center h-full">
            <button
              onClick={() => window.open(show.show_wl_link, '_blank')}
              className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
            >
              <img src={wlImage} alt="WysteriaLane" className="w-[14.5px] h-[14.5px]" />
            </button>
          </div>
        )}
      </td>
      <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
        {show.show_detail && show.show_detail}
        {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
        {show.show_alert && <span className="text-[#CE1126] font-medium">[{show.show_alert}]</span>}
      </td>
    </tr>
  );
}
