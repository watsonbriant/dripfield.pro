import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FileMusic, AudioLines } from 'lucide-react';
import gooseLogo from '../img/Goose.png';
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
  formatted_show_date: string;
}

interface HomeShowTableProps {
  title: string;
  shows: Show[];
  loading: boolean;
  emptyMessage?: string;
  showsWithSetlists?: Set<string>;
  showsWithReleases?: Set<string>;
}

export function HomeShowTable({ title, shows, loading, emptyMessage, showsWithSetlists = new Set(), showsWithReleases = new Set() }: HomeShowTableProps) {
  const [hoveredVenue, setHoveredVenue] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  if (loading) {
    return (
      <div className="bg-primary pb-0.5">
        <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5">
          <h3 className="text-sm font-semibold">
            {title}
          </h3>
        </div>
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading shows...</p>
        </div>
      </div>
    );
  }

  if (!shows || shows.length === 0) {
    return (
      <div className="bg-primary pb-0.5">
        <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5">
          <h3 className="text-sm font-semibold">
            {title}
          </h3>
        </div>
        <div className="text-center py-2">
          <p className="text-fifth text-xs">{emptyMessage || "No shows found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary pb-0.5">
      <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>
      </div>
      <div>
        <table className="w-full border-collapse">
          <tbody>
            {shows.map((show, index) => (
                <tr
                  key={show.show_id}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                  } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                >
                  <td 
                    className="w-16 px-2 text-fifth whitespace-nowrap text-left cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredDate(show.show_id);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredDate(null);
                    }}
                  >
                    <span className="font-medium">
                      <Link
                        to={`/setlist/${show.show_id}`}
                        className="transition-colors table-link hover:underline"
                      >
                        {show.show_date
                          .split('-')
                          .slice(1)
                          .concat(show.show_date.substring(2, 4))
                          .join('.')}
                      </Link>
                    </span>
                    {hoveredDate === show.show_id && (
                      <div 
                        className="fixed text-[0.625rem] leading-[0.75rem] bg-canvas font-medium text-fifth px-2 py-1 border border-fourth shadow-lg min-w-max z-[9999]"
                        style={{
                          left: `${mousePosition.x + 10}px`,
                          top: `${mousePosition.y - 10}px`
                        }}
                      >
                        <div className="font-medium">{show.show_group}</div>
                        <div className="font-light">{show.show_tour}</div>
                        {show.show_detail && (
                          <div className="font-light">{show.show_detail}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td 
                    className="px-2 text-fifth font-light leading-[0.75rem] text-left break-words"
                    onMouseEnter={(e) => {
                      setHoveredVenue(show.show_id);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => {
                      setHoveredVenue(null);
                    }}
                  >
                    {show.venue_id ? (
                      <Link
                        to={`/venue/${show.venue_id}`}
                        className="hover:underline transition-colors"
                  >
                    {show.show_venue_location}
                      </Link>
                    ) : (
                      <span>{show.show_venue_location}</span>
                    )}
                    {hoveredVenue === show.show_id && (
                      <div 
                        className="fixed text-[0.625rem] leading-[0.75rem] bg-canvas font-medium text-fifth px-2 py-1 border border-fourth shadow-lg min-w-max z-[9999]"
                        style={{
                          left: `${mousePosition.x + 10}px`,
                          top: `${mousePosition.y - 10}px`
                        }}
                      >
                        {show.show_subvenue}
                      </div>
                    )}
                  </td>
                  <td className="w-5 text-center align-middle">
                    {showsWithSetlists.has(show.show_id) && (
                      <div className="flex justify-center items-center h-full">
                        <Link
                          to={`/setlist/${show.show_id}`}
                          state={{ openChangesModal: true }}
                          className="text-[#006400] hover:text-white hover:bg-[#006400] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px] inline-block"
                        >
                          <FileMusic size={10} strokeWidth={2} />
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="w-5 text-center align-middle">
                    {showsWithReleases.has(show.show_id) && (
                      <div className="flex justify-center items-center h-full">
                        <Link
                          to={`/setlist/${show.show_id}`}
                          state={{ scrollToReleases: true }}
                          className="text-[#7c2128] hover:text-white hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px] inline-block"
                        >
                          <AudioLines size={10} strokeWidth={2} />
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="w-5 text-center align-middle">
                    {show.show_wl_link && (
                      <div className="flex justify-center items-center h-full">
                        <button
                          onClick={() => show.show_wl_link && window.open(show.show_wl_link, '_blank')}
                          className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
                        >
                          <img src={wlImage} alt="WysteriaLane" className="w-[10px] h-[10px]" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="w-9 pl-1 pr-2 text-right">
                    {show.show_group === 'Goose' ? (
                      <div className="ml-auto w-fit">
                        <img 
                          src={gooseLogo} 
                          alt="Goose" 
                          className="h-[10px]"
                        />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
