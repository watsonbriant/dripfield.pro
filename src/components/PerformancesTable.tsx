import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { MoveRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas text-fifth">
            <th className="px-2 py-0.5 text-center text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              Show
            </th>
            <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              Location
            </th>
            <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              &nbsp;
            </th>
            <th className="px-2 py-0.5 text-center text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              Length
            </th>
            <th className="px-2 py-0.5 text-center text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              <User strokeWidth={2} className="text-fifth w-3 h-3 mx-auto" />
            </th>
            <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
              Coach's Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {performances.map((perf, index) => {
            return (
              <tr 
                key={`${perf.show_id}-${index}`}
                className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
              >
                <td className="px-2 text-fifth whitespace-nowrap text-center relative">
                  <span className="font-medium">
                      <Link
                      to={`/setlist/${perf.show_id}`}
                      onClick={onClose}
                      className="hover:underline transition-colors table-link"
                      >
                      {formatInTimeZone(
                          new Date(perf.show_date),
                          'UTC',
                          'MM.dd.yy'
                      )}
                      </Link>
                  </span>
                  {placementColors[perf.entry_placement] && (
                      <span 
                      className="absolute right-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: placementColors[perf.entry_placement] }}
                      />
                  )}
                  </td>
                <td 
                  className="px-2 text-fifth whitespace-nowrap relative"
                >
                  {perf.venue_id ? (
                    <Link
                      to={`/venue/${perf.venue_id}`}
                      onClick={onClose}
                      className="hover:underline font-light transition-colors"
                    >
                      {perf.show_venue_location}
                    </Link>
                  ) : perf.show_subvenue_venue ? (
                    <Link
                      to={`/venue/${encodeURIComponent(perf.show_subvenue_venue)}`}
                      onClick={onClose}
                      className="hover:underline font-light transition-colors"
                    >
                      {perf.show_venue_location}
                    </Link>
                  ) : (
                    <Link
                      to={`/venue/${encodeURIComponent(perf.show_subvenue || perf.show_venue_location)}`}
                      onClick={onClose}
                      className="hover:underline font-light transition-colors"
                    >
                      {perf.show_venue_location}
                    </Link>
                  )}
                </td>
                <td className="px-2 text-fifth">
                  {perf.entry_short && <span className="text-red-600 mr-2 font-medium">[{perf.entry_short}]</span>}
                  {perf.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                </td>
                <td className="px-2 text-fifth whitespace-nowrap font-light text-center">
                  {perf.entry_length ? formatLength(perf.entry_length) : ''}
                </td>
                <td className="px-2">
                  <div 
                    className="w-4 h-4 rounded mx-auto border border-fourth"
                    style={{ backgroundColor: getGuestColor(perf) }}
                  />
                </td>
                <td className="px-2 text-fifth font-light">
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
