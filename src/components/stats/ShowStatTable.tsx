import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Star, Clock, Space, Flame, Users } from 'lucide-react';
import { ShowStat } from '../../types/home';
import { getRankingText } from '../../utils/statsFormattingUtils';

interface ShowStatTableProps {
  title: string;
  bgColor: string;
  items: ShowStat[];
  valueFormatter?: (value: string | number) => string | React.ReactNode;
  isLast?: boolean;
  showLengthRank?: boolean;
  showEmptyState?: boolean;
}

export const ShowStatTable: React.FC<ShowStatTableProps> = ({ 
  title, 
  bgColor, 
  items, 
  valueFormatter, 
  isLast = false, 
  showLengthRank = false,
  showEmptyState = false
}) => {
  const [hoveredRank, setHoveredRank] = useState<string | null>(null);
  const [rankTooltipPosition, setRankTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const rankRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  useEffect(() => {
    if (!hoveredRank || !rankTooltipPosition) return;

    const updatePosition = () => {
      const badge = rankRefs.current[hoveredRank];
      if (badge) {
        const rect = badge.getBoundingClientRect();
        setRankTooltipPosition({ x: rect.left + rect.width + 4, y: rect.top });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredRank, rankTooltipPosition]);

  const getTitleIcon = () => {
    if (title === 'Longest Shows') {
      return <Clock className="w-3.5 h-3.5" />;
    } else if (title === 'Shows With Longest Average Show Gap') {
      return <Space className="w-3.5 h-3.5" />;
    } else if (title === 'Shows With Rarest Setlist') {
      return <Flame className="w-3.5 h-3.5" />;
    } else if (title === 'Most Attended Shows') {
      return <Users className="w-3.5 h-3.5" />;
    } else if (title === 'Highest Rated Shows') {
      return (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3.5 h-3.5" fill="currentColor" stroke="currentColor" />
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={isLast ? "pb-1 border-x-[0.5px] border-y-[0.5px] border-fourth" : "pb-1 border-x-[0.5px] border-y-[0.5px] border-fourth"}>
      <div className={`${bgColor} px-2 py-0.5 mb-0.5 flex justify-between items-center`}>
        <h3 className="text-sm font-medium">
          {title}
        </h3>
        {getTitleIcon() && (
          <div className="flex items-center">
            {getTitleIcon()}
          </div>
        )}
      </div>
      <div className="overflow-x-auto relative">
        {items.length === 0 && showEmptyState ? (
          <div className="bg-primary text-fifth px-2 py-4 text-center text-[0.625rem]">
            No data to display for this year.
          </div>
        ) : (
        <table className="w-full border-collapse min-w-max">
          <tbody>
            {items.map((item) => (
              <tr
                key={item.show_id}
                className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
              >
                <td className="pl-2 text-fifth">
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/setlist/${item.show_id}`}
                      className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem]"
                    >
                      {item.show_date}
                    </Link>
                    {showLengthRank && item.show_length_rank && (
                      <div className="relative inline-flex items-center">
                        <a
                          ref={(el) => { rankRefs.current[item.show_id] = el; }}
                          href="https://dripfield.pro/lists/45a4b90e-adbe-4af5-9051-2f4d212069fc"
                          rel="noopener noreferrer"
                          className="text-fifth text-[0.625rem] font-medium px-1 py-[1px] rounded bg-yellow-500 inline-block"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setRankTooltipPosition({ x: rect.left + rect.width + 4, y: rect.top });
                            setHoveredRank(item.show_id);
                          }}
                          onMouseLeave={() => {
                            setHoveredRank(null);
                            setRankTooltipPosition(null);
                          }}
                        >
                          #{item.show_length_rank}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-0.5 text-fifth font-light">
                  {item.show_venue_location ? (
                    item.venue_id ? (
                      <Link
                        to={`/venue/${item.venue_id}`}
                        className="hover:underline transition-colors"
                      >
                        {item.show_venue_location.replace(/[\[\]]/g, '')}
                      </Link>
                    ) : (
                      <span>{item.show_venue_location.replace(/[\[\]]/g, '')}</span>
                    )
                  ) : (
                    ''
                  )}
                </td>
                <td className="px-2 text-fifth font-light">
                  {item.show_tour ? (
                    item.tour_id ? (
                      <Link
                        to={`/tours/${item.tour_id}`}
                        className="hover:underline transition-colors"
                      >
                        {item.show_tour}
                      </Link>
                    ) : (
                      <span>{item.show_tour}</span>
                    )
                  ) : (
                    ''
                  )}
                </td>
                <td className="w-[60px] text-center font-medium text-fifth align-middle">
                  <div className="flex items-center justify-center gap-1">
                    {valueFormatter ? valueFormatter(item.value) : item.value}
                    {title === 'Highest Rated Shows' && (
                      <Star size={10} className="text-fourth" fill="currentColor" stroke="currentColor" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Rank Tooltip Portal */}
      {hoveredRank && rankTooltipPosition && items.find(item => item.show_id === hoveredRank)?.show_length_rank && createPortal(
        <div 
          className="fixed text-[0.625rem] font-medium bg-canvas text-fifth px-2 py-0.5 rounded border border-fourth shadow-lg whitespace-nowrap pointer-events-none z-[99999]"
          style={{ 
            left: `${rankTooltipPosition.x}px`,
            top: `${rankTooltipPosition.y}px`,
          }}
        >
          {getRankingText(items.find(item => item.show_id === hoveredRank)!.show_length_rank!)}
        </div>,
        document.body
      )}
    </div>
  );
};

