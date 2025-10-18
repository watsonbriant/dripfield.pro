import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { MoveRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatLength, placementColors } from '../utils/songMatrixUtils';

interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string;
}

interface SongPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  guests?: Guest[];
}

interface PerformancesTableProps {
  performances: SongPerformance[];
  getGuestColor: (perf: SongPerformance) => string;
  onClose: () => void;
}

const PerformancesTable: React.FC<PerformancesTableProps> = ({ 
  performances, 
  getGuestColor, 
  onClose 
}) => {
  const navigate = useNavigate();

  const navigateToVenue = (perf: SongPerformance) => {
    if (perf.venue_id) {
      navigate(`/venue/${perf.venue_id}`);
    } else if (perf.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(perf.show_subvenue_venue)}`);
    } else {
      const venueSearchTerm = perf.show_subvenue || perf.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-secondary">
            <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
              Show
            </th>
            <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
              Location
            </th>
            <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
              &nbsp;
            </th>
            <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
              Length
            </th>
            <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
              <User strokeWidth={2} className="text-fifth w-5 h-5 mx-auto" />
            </th>
            <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
              Coach's Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {performances.map((perf, index) => {
            return (
              <tr 
                key={`${perf.show_id}-${index}`}
                className="bg-primary hover:bg-tertiary/40 transition-colors text-xs"
              >
                <td className="px-3 py-1 text-fifth whitespace-nowrap text-center relative">
                  <span className="font-medium">
                      <button
                      onClick={() => {
                          navigate(`/setlist/${perf.show_id}`);
                          onClose();
                      }}
                      className="hover:underline transition-colors table-link"
                      >
                      {formatInTimeZone(
                          new Date(perf.show_date),
                          'UTC',
                          'MM.dd.yy'
                      )}
                      </button>
                  </span>
                  {placementColors[perf.entry_placement] && (
                      <span 
                      className="absolute right-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: placementColors[perf.entry_placement] }}
                      />
                  )}
                  </td>
                <td 
                  className="px-4 py-1 text-fifth whitespace-nowrap relative"
                >
                  <button
                    onClick={() => {
                      navigateToVenue(perf);
                      onClose();
                    }}
                    className="hover:underline font-light transition-colors"
                  >
                    {perf.show_venue_location}
                  </button>
                </td>
                <td className="px-4 py-1 text-fifth">
                  {perf.entry_short && <span className="text-red-600 mr-2 font-medium">[{perf.entry_short}]</span>}
                  {perf.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                </td>
                <td className="px-4 py-1 text-fifth whitespace-nowrap font-light text-center">
                  {perf.entry_length ? formatLength(perf.entry_length) : ''}
                </td>
                <td className="px-4 py-1">
                  <div 
                    className="w-4 h-4 rounded mx-auto"
                    style={{ backgroundColor: getGuestColor(perf) }}
                  />
                </td>
                <td className="px-4 py-1 text-fifth font-light">
                  {perf.entry_coachnotes ? (
                    <div dangerouslySetInnerHTML={{ __html: perf.entry_coachnotes }} />
                  ) : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PerformancesTable;
