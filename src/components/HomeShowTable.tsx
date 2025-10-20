import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          {title}
        </h3>
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
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          {title}
        </h3>
        <div className="text-center py-12">
          <p className="text-fifth">{emptyMessage || "No shows found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <tbody className="divide-y divide-white/5">
            {shows.map((show, index) => (
                <tr
                  key={show.show_id}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="w-20 px-3 py-0.5 text-fifth whitespace-nowrap text-left">
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
                  </td>
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-left">
                    {show.show_venue_location}
                  </td>
                  <td className="w-6 text-center align-middle">
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
                  <td className="w-6 text-center align-middle">
                    {showsWithReleases.has(show.show_id) && (
                      <div className="flex justify-center items-center h-full">
                        <button
                          onClick={() => navigate(`/setlist/${show.show_id}`, { state: { scrollToReleases: true } })}
                          className="text-[#7c2128] hover:text-primary hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                        >
                          <AudioLines size={14.5} strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="w-6 text-center align-middle">
                    {show.show_wl_link && (
                      <div className="flex justify-center items-center h-full">
                        <button
                          onClick={() => show.show_wl_link && window.open(show.show_wl_link, '_blank')}
                          className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
                        >
                          <img src={wlImage} alt="WysteriaLane" className="w-[14.5px] h-[14.5px]" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="w-12 pl-1 pr-2 text-right">
                    {show.show_group === 'Goose' ? (
                      <div className="ml-auto w-fit">
                        <img 
                          src={gooseLogo} 
                          alt="Goose" 
                          className="h-4"
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
