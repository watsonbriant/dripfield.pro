import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
  showsWithReleases
}: TourShowsTableProps) {
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
      // Tooltip position will be recalculated on next hover
      hideTooltip();
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [tooltipState.isVisible, tooltipState.position]);

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
    ...(user ? [{ key: 'attended', label: <Check size={12} className="text-fifth" strokeWidth={4} /> }] : []),
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
        <div 
          className="flex justify-center items-center"
          onMouseEnter={(e) => updateTooltip('Setlist Scan', e.currentTarget)}
          onMouseLeave={hideTooltip}
        >
          <div className="text-white bg-[#006400] rounded p-0.5">
            <FileMusic size={12} strokeWidth={2} />
          </div>
        </div>
      )
    },
    { 
      key: 'releases', 
      label: (
        <div 
          className="flex justify-center items-center"
          onMouseEnter={(e) => updateTooltip('Media Available', e.currentTarget)}
          onMouseLeave={hideTooltip}
        >
          <div className="text-white bg-[#7c2128] rounded p-0.5">
            <AudioLines size={12} strokeWidth={2} />
          </div>
        </div>
      )
    },
    { 
      key: 'attendees', 
      label: (
        <div
          onMouseEnter={(e) => updateTooltip('Show Attendees', e.currentTarget)}
          onMouseLeave={hideTooltip}
        >
          <Users size={12} className="text-fifth" strokeWidth={2} />
        </div>
      )
    },
    { 
      key: 'wl_link', 
      label: (
        <div
          onMouseEnter={(e) => updateTooltip('Chat on WysteriaLane.org', e.currentTarget)}
          onMouseLeave={hideTooltip}
        >
          <img src={wlImage} alt="WysteriaLane" className="w-[12px] h-[12px]" />
        </div>
      )
    },
    { key: 'show_detail', label: 'Detail' }
  ];

  return (
    <div>
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
          <h2 className="text-sm font-semibold">
            {currentTour}
          </h2>
          <span className="text-fifth font-semibold text-sm whitespace-nowrap">
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
                    onMouseEnter={(e) => {
                      if (key === 'show_gap') {
                        updateTooltip('Average Show Gap', e.currentTarget);
                      } else if (key === 'show_rarity') {
                        updateTooltip('Show Setlist Rarity', e.currentTarget);
                      }
                    }}
                    onMouseLeave={() => {
                      if (key === 'show_gap' || key === 'show_rarity') {
                        hideTooltip();
                      }
                    }}
                    className={`${key === 'show_length' || key === 'show_rarity' || key === 'show_date' || key === 'rating' || key === 'attendees' ? 'text-center' : 'text-left'}
                      text-sm font-medium text-fifth whitespace-nowrap 
                      ${key !== 'attended' && key !== 'setlist' && key !== 'releases' && key !== 'wl_link' ? 'px-2 cursor-pointer hover:bg-black/10' : key === 'setlist' || key === 'releases' ? 'w-8 px-1 text-center' : 'w-8 px-1 text-center'}`}
                  >
                    <div className={`flex items-center ${key === 'show_length' || key === 'attended' || key === 'show_rarity' || key === 'show_gap' || key === 'show_date' || key === 'rating' || key === 'setlist' || key === 'attendees' || key === 'releases' || key === 'wl_link' ? 'justify-center' : ''} gap-1`}>
                      {label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedShows.map((show, index) => (
                <tr
                  key={show.show_id}
                  className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                >
                  <td className="px-2 py-0.5 text-center whitespace-nowrap">
                    <span className="font-medium text-fifth">
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
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                    {show.show_length || ''}
                  </td>
                  <td className="px-2 py-0 whitespace-nowrap text-center">
                    {show.show_rarity ? (
                      <span
                        className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
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
                        className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
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
                    {show.venue_id ? (
                      <Link
                        to={`/venue/${show.venue_id}`}
                      className="hover:underline transition-colors"
                    >
                      {show.show_subvenue}
                      </Link>
                    ) : (
                      <span>{show.show_subvenue}</span>
                    )}
                  </td>
                  <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                    {show.show_venue_location}
                  </td>
                  <td className="px-2 py-0.5 text-fifth whitespace-nowrap text-center">
                    <div className="relative flex items-center justify-center group">
                      <div className={`flex items-center justify-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-5' : ''}`}>
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
                          onClick={() => show.show_wl_link && window.open(show.show_wl_link, '_blank')}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip Portal */}
      {tooltipState.isVisible && tooltipState.position && createPortal(
        <div 
          className="fixed text-[0.625rem] leading-[0.75rem] font-normal bg-canvas text-fifth px-1.5 py-1 rounded border border-fourth shadow-lg whitespace-nowrap pointer-events-none z-[99999]"
          style={{ 
            left: `${tooltipState.position.x}px`,
            top: `${tooltipState.position.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '2px'
          }}
        >
          {tooltipState.text}
        </div>,
        document.body
      )}
    </div>
  );
}
