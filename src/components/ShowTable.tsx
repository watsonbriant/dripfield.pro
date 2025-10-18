import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from '../types/home';
import gooseGif from '../img/Goose.gif';

interface ShowTableProps {
  title: string;
  shows: Show[] | undefined;
  loading: boolean;
  emptyMessage?: string;
}

export const ShowTable: React.FC<ShowTableProps> = ({ 
  title, 
  shows, 
  loading, 
  emptyMessage = "No shows found" 
}) => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(show.subvenue_venue)}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">{title}</h2>
        <div className="text-center py-12">
          <p className="text-fifth/70">Loading shows...</p>
        </div>
      </div>
    );
  }

  if (!shows || shows.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">{title}</h2>
        <div className="text-center py-2 text-sm">
          <p className="text-fifth font-semibold">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Reverse the order for "Last 5 Shows" and "This Day in Goose History" to show oldest first
  const displayShows = (title === "Last 5 Shows" || title === "This Day in Goose History") 
    ? [...shows].reverse() 
    : shows;

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">{title}</h2>
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-white/5">
            {displayShows.map((show, index) => (
              <tr
                key={show.show_id}
                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs text-fifth`}
              >
                <td
                  className="px-4 py-0.5 whitespace-nowrap cursor-pointer relative"
                  onMouseEnter={(e) => {
                    setHoveredDate(show.show_id);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <button
                    onClick={() => navigate(`/setlist/${show.show_id}`)}
                    className="transition-colors table-link"
                  >
                    <span className="font-medium text-fifth">{show.formatted_show_date}</span>
                  </button>
                  {hoveredDate === show.show_id && (
                    <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                      style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`
                      }}>
                      {show.show_group && <div><span className="font-medium">{show.show_group}</span></div>}
                      {show.show_tour && <div><span className="font-light">{show.show_tour}</span></div>}
                      {show.show_detail && <div><span className="font-light">{show.show_detail}</span></div>}
                    </div>
                  )}
                </td>
                <td
                  className="px-4 py-0.5 relative cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredLocation(show.show_id);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateToVenue(show)}
                      className="font-light hover:underline transition-colors"
                    >
                      {show.venue_location}
                    </button>
                    {show.show_group === 'Goose' && (
                      <div className="flex-shrink-0 ml-2">
                        <img
                          src={gooseGif}
                          alt="Goose"
                          className="h-4 w-4 filter drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {hoveredLocation === show.show_id && (
                    <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary font-medium shadow-lg min-w-max z-[9999]"
                      style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`
                      }}>
                      {show.show_subvenue}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
