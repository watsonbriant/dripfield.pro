import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { LiberatedSong } from '../../types/home';
import { formatDate, extractShowCount } from '../../utils/statsFormattingUtils';

interface LiberatedSongsTableProps {
  items: LiberatedSong[];
  isLast?: boolean;
}

export const LiberatedSongsTable: React.FC<LiberatedSongsTableProps> = ({ items, isLast = false }) => {
  const [hoveredLibBadge, setHoveredLibBadge] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const badgeRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});

  useEffect(() => {
    if (!hoveredLibBadge || !tooltipPosition) return;

    const updatePosition = () => {
      const badge = badgeRefs.current[hoveredLibBadge];
      if (badge) {
        const rect = badge.getBoundingClientRect();
        setTooltipPosition({ x: rect.right + 4, y: rect.top });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredLibBadge, tooltipPosition]);

  return (
    <div className={isLast ? "pb-0 border-x-[0.5px] border-fourth" : "pb-1 border-x-[0.5px] border-fourth"}>
      <div className="bg-[#3c1e40] text-white px-2 py-0.5 mb-0.5 flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Top Returning Songs
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <tbody>
            {items.map((song, index) => (
              <tr
                key={`${song.song}-${index}`}
                className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
              >
                <td className="pl-2 text-fifth">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/song/${song.song_id}`}
                      className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem]"
                    >
                      {song.song}
                    </Link>
                    <div className="flex items-center gap-1 ml-3">
                      {song.last_count && song.last_count.toUpperCase().includes('LIB') && (
                        <div className="relative flex items-center">
                          <span 
                            ref={(el) => { badgeRefs.current[song.song] = el; }}
                            className="inline-flex items-center justify-center font-medium rounded-full text-[0.625rem] px-1.5 shadow-sm bg-yellow-600 text-white cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipPosition({ x: rect.right + 4, y: rect.top });
                              setHoveredLibBadge(song.song);
                            }}
                            onMouseLeave={() => {
                              setHoveredLibBadge(null);
                              setTooltipPosition(null);
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (hoveredLibBadge === song.song) {
                                setHoveredLibBadge(null);
                                setTooltipPosition(null);
                              } else {
                                setTooltipPosition({ x: rect.right + 4, y: rect.top });
                                setHoveredLibBadge(song.song);
                              }
                            }}
                          >
                            LIB
                          </span>
                        </div>
                      )}
                      {song.category_artwork && (
                        <img
                          src={song.category_artwork}
                          alt={`${song.song} artwork`}
                          className="w-4 h-4 rounded object-cover border border-fourth"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 text-fifth font-light">
                  {song.show_date && (
                    <>
                      <span className="font-light">Returned&nbsp;&nbsp;</span>
                      {song.show_id ? (
                        <Link
                          to={`/setlist/${song.show_id}`}
                          className="font-medium cursor-pointer hover:underline"
                        >
                          {formatDate(song.show_date)}
                        </Link>
                      ) : (
                        <span className="font-medium">{formatDate(song.show_date)}</span>
                      )}
                      {song.venue_location && <span className="text-fifth/70 font-light">&nbsp;[{song.venue_location.replace(/[\[\]]/g, '')}]</span>}
                    </>
                  )}
                </td>
                <td className="px-2 text-fifth font-light whitespace-nowrap">
                  {song.last_show_date && (
                    <>
                      <span className="font-light">LTP&nbsp;&nbsp;</span>
                      {song.last_show_id ? (
                        <Link
                          to={`/setlist/${song.last_show_id}`}
                          className="font-medium cursor-pointer hover:underline"
                        >
                          {song.last_show_date}
                        </Link>
                      ) : (
                        <span className="font-medium">{song.last_show_date}</span>
                      )}
                      {extractShowCount(song.last_count) && (
                        <span className="text-fifth/70 font-light">
                          &nbsp;({extractShowCount(song.last_count)} shows)
                        </span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Tooltip Portal */}
      {hoveredLibBadge && tooltipPosition && createPortal(
        <div 
          className="fixed text-[0.625rem] leading-[0.75rem] font-medium bg-canvas text-fifth px-1.5 py-1 rounded border border-fourth shadow-lg whitespace-normal pointer-events-none"
          style={{ 
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            maxWidth: '150px',
            width: 'max-content',
            zIndex: 99999
          }}
        >
          LIB <span className="text-fifth font-normal">(Song Liberation)</span><br /><span className="text-fifth font-light">Song returned after a full calendar year of not being played.</span>
        </div>,
        document.body
      )}
    </div>
  );
};

