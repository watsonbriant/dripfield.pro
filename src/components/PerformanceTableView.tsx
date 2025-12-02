import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import JOTYBadge from './JOTYBadge';
import { placementColors, formatLength } from '../utils/performanceUtils';

interface ChartPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_group: string;
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
  joty_round?: string | null;
  shows_since_debut_num?: number | null;
  gap?: number | string | null;
}

interface PerformanceTableViewProps {
  performances: ChartPerformance[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: string) => void;
  selectedGroup?: string | null;
  hoveredPerformance: {
    formattedDate: string;
    show_id: string;
    entry_placement: string;
    fullData: ChartPerformance;
  } | null;
  mousePosition: { x: number; y: number };
  setHoveredPerformance: (perf: any) => void;
  setMousePosition: (pos: { x: number; y: number }) => void;
}

const PerformanceTableView: React.FC<PerformanceTableViewProps> = ({
  performances,
  sortColumn,
  sortDirection,
  handleSort,
  selectedGroup,
  hoveredPerformance,
  mousePosition,
  setHoveredPerformance,
  setMousePosition
}) => {
  const navigate = useNavigate();

  const shouldHighlight = (performance: ChartPerformance) => {
    if (!selectedGroup) return false;
    return performance.show_group === selectedGroup;
  };

  const navigateToVenue = (perf: ChartPerformance) => {
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
          <tr className="bg-fourth border-y border-fourth">
            <th 
              className="pl-2 pr-3 py-0.5 text-center text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('show_date')}
            >
              Show
            </th>
            <th 
              className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('show_group')}
            >
              Group
            </th>
            <th 
              className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('show_venue_location')}
            >
              Location
            </th>
            <th 
              className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('entry_song')}
            >
              Song
            </th>
            <th className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap">
              JOTY
            </th>
            <th 
              className="px-2 py-0.5 text-center text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('gap')}
            >
              Gap
            </th>
            <th 
              className="px-2 py-0.5 text-center text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('entry_length')}
            >
              Length
            </th>
            <th 
              className="px-2 py-0.5 text-left text-xs font-medium text-white whitespace-nowrap cursor-pointer hover:bg-white/20"
              onClick={() => handleSort('entry_coachnotes')}
            >
              Coach's Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {performances.map((perf, index) => {
            const isHighlighted = shouldHighlight(perf);
            
            return (
              <tr 
                key={`${perf.show_id}-${index}`}
                className={`${
                  index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                } hover:bg-tertiary/40 transition-colors text-[0.625rem] ${
                  isHighlighted ? 'bg-tertiary/40' : ''
                } ${
                  selectedGroup && !isHighlighted ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <td 
                  className="pl-2 pr-3 py-0.5 text-fifth whitespace-nowrap text-center"
                  style={{
                    boxShadow: placementColors[perf.entry_placement] 
                      ? `inset -4px 0 0 ${placementColors[perf.entry_placement]}` 
                      : 'none'
                  }}
                >
                  <span className="font-medium">
                    <Link
                      to={`/setlist/${perf.show_id}`}
                      className="hover:underline transition-colors table-link"
                    >
                      {formatInTimeZone(
                        new Date(perf.show_date),
                        'UTC',
                        'MM.dd.yy'
                      )}
                    </Link>
                  </span>
                </td>
                <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">{perf.show_group}</td>
                <td 
                  className="px-2 py-0.5 text-fifth whitespace-nowrap font-light"
                  onMouseEnter={(e) => {
                    if (perf.show_subvenue) {
                      setHoveredPerformance({
                        formattedDate: '',
                        show_id: perf.show_id,
                        entry_placement: '',
                        fullData: perf
                      });
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseMove={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredPerformance(null);
                  }}
                >
                  <button
                    onClick={() => navigateToVenue(perf)}
                    className="hover:underline transition-colors"
                  >
                    {perf.show_venue_location}
                  </button>
                  {hoveredPerformance?.show_id === perf.show_id && (
                  <div 
                    className="fixed bg-tertiary text-fifth px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-fourth"
                    style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`,
                        maxWidth: '250px',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: perf.show_subvenue || '' }} />
                    </div>
                  )}
                </td>
                <td className="px-2 py-0.5 text-fifth">
                  {(perf.entry_song && perf.entry_song !== '>') ? (
                    <span className="font-medium">
                      <span className="mr-2">{perf.entry_song}</span>
                      {perf.entry_short && <span className="text-red-600 mr-2">[{perf.entry_short}]</span>}
                      {perf.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                    </span>
                  ) : (
                    <Link
                      to={`/setlist/${perf.show_id}`}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      &gt;
                    </Link>
                  )}
                </td>
                <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                  {perf.joty_round && (
                    <JOTYBadge 
                      round={perf.joty_round} 
                      compact={true}
                      onClick={() => {
                        const year = new Date(perf.show_date).getFullYear();
                        navigate(`/joty/${year}`);
                      }}
                    />
                  )}
                </td>
                <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                  {perf.gap !== null && perf.gap !== undefined ? (
                    perf.gap === 'Debut' ? (
                      <span className="font-medium text-green-600">Debut</span>
                    ) : (
                      perf.gap
                    )
                  ) : ''}
                </td>
                <td className="px-2 py-0.5 text-fifth text-center font-light whitespace-nowrap">
                  {perf.entry_length ? formatLength(perf.entry_length) : ''}
                </td>
                <td className="px-2 py-0.5 text-fifth font-light">
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

export default PerformanceTableView;
