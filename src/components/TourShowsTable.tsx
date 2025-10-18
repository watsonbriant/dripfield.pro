import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowUp, ArrowDown, FileMusic, Users, Star, AudioLines } from 'lucide-react';
import { Show } from '../types/tourTypes';
import { getRarityColor, getGapColor } from '../utils/tourUtils';
import { sortData } from '../utils/sortingUtils';
import wlImage from '../img/WL.png';

interface TourShowsTableProps {
  shows: Show[];
  currentTour: string;
  user: any;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  showRatings: Record<string, number>;
  attendeeCounts: Record<string, number>;
  showsWithSetlists: Set<string>;
  showsWithReleases: Set<string>;
  navigateToVenue: (show: Show) => void;
}

export function TourShowsTable({
  shows,
  currentTour,
  user,
  sortColumn,
  sortDirection,
  onSort,
  showRatings,
  attendeeCounts,
  showsWithSetlists,
  showsWithReleases,
  navigateToVenue
}: TourShowsTableProps) {
  const navigate = useNavigate();

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" /> :
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  const sortedShows = sortData(shows, sortColumn, sortDirection, showRatings, attendeeCounts);

  const columns = [
    { key: 'show_date', label: 'Date' },
    ...(user ? [{ key: 'attended', label: <Check size={16} className="text-fifth" strokeWidth={4} /> }] : []),
    { key: 'show_group', label: 'Group' },
    { key: 'show_length', label: 'Length' },
    { key: 'show_rarity', label: 'Rarity' },
    { key: 'show_gap', label: 'Gap' },
    { key: 'show_subvenue', label: 'Venue' },
    { key: 'show_venue_location', label: 'Location' },
    { key: 'rating', label: 'Rating' },
    { 
      key: 'setlist', 
      label: (
        <div className="flex justify-center items-center">
          <div className="text-primary bg-[#006400] rounded p-1">
            <FileMusic size={16} strokeWidth={2} />
          </div>
        </div>
      )
    },
    { 
      key: 'releases', 
      label: (
        <div className="flex justify-center items-center">
          <div className="text-primary bg-[#7c2128] rounded p-1">
            <AudioLines size={16} strokeWidth={2} />
          </div>
        </div>
      )
    },
    { key: 'attendees', label: <Users size={16} className="text-fifth" strokeWidth={2} /> },
    { key: 'wl_link', label: <img src={wlImage} alt="WysteriaLane" className="w-4 h-4" /> },
    { key: 'show_detail', label: 'Detail' }
  ];

  return (
    <div className="mt-6">
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
            {currentTour}
          </h2>
          <span className="text-fifth font-semibold text-lg whitespace-nowrap pl-4">
            {shows.length} {shows.length === 1 ? 'Show' : 'Shows'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                {columns.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => key !== 'attended' && key !== 'setlist' && key !== 'releases' && key !== 'wl_link' ? onSort(key) : null}
                    className={`${key === 'show_length' || key === 'show_rarity' || key === 'show_date' || key === 'rating' || key === 'attendees' ? 'text-center' : 'text-left'}
                      text-s font-semibold text-fifth whitespace-nowrap 
                      ${key !== 'attended' && key !== 'setlist' && key !== 'releases' && key !== 'wl_link' ? 'px-2 py-1 cursor-pointer hover:bg-black/10' : key === 'setlist' || key === 'releases' ? 'w-8 px-1 py-0.5 text-center' : 'w-8 px-1 py-1 text-center'}`}
                  >
                    <div className={`flex items-center ${key === 'show_length' || key === 'attended' || key === 'show_rarity' || key === 'show_gap' || key === 'show_date' || key === 'rating' || key === 'setlist' || key === 'users' || key === 'releases' || key === 'wl_link' ? 'justify-center' : ''} gap-1`}>
                      {label}
                      {getSortIcon(key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedShows.map((show, index) => (
                <tr
                  key={show.show_id}
                  className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-2 py-0.5 text-center whitespace-nowrap">
                    <span className="font-medium text-fifth">
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
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                    {show.show_length || ''}
                  </td>
                  <td className="px-2 py-0 whitespace-nowrap text-center">
                    {show.show_rarity ? (
                      <span
                        className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                        style={{
                          backgroundColor: getRarityColor(show.show_rarity)
                        }}
                      >
                        {show.show_rarity}
                      </span>
                    ) : (
                      <span className="text-fifth"></span>
                    )}
                  </td>
                  <td className="px-2 py-0 whitespace-nowrap text-center">
                    {show.show_gap ? (
                      <span
                        className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                        style={{
                          backgroundColor: getGapColor(show.show_gap)
                        }}
                      >
                        {show.show_gap}
                      </span>
                    ) : (
                      <span className="text-fifth"></span>
                    )}
                  </td>
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                    <button
                      onClick={() => navigateToVenue(show)}
                      className="hover:underline transition-colors"
                    >
                      {show.show_subvenue}
                    </button>
                  </td>
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                    {show.show_venue_location}
                  </td>
                  <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                    <div className="relative flex items-center justify-center group">
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
                    <span className="text-xs font-medium">
                      {attendeeCounts[show.show_id] || 0}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
