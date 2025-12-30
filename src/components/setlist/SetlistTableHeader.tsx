import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, MoveRight } from 'lucide-react';
import { Show, SetlistEntry } from '../../types/setlist';

interface SetlistTableHeaderProps {
  show: Show | undefined;
  setlist?: SetlistEntry[];
}

export const SetlistTableHeader: React.FC<SetlistTableHeaderProps> = ({ show, setlist = [] }) => {
  const [hoveredLastHeader, setHoveredLastHeader] = useState(false);
  const [lastTooltipPosition, setLastTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const lastHeaderRef = useRef<HTMLTableCellElement | null>(null);

  const [hoveredSongHeader, setHoveredSongHeader] = useState(false);
  const [songTooltipPosition, setSongTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const songHeaderRef = useRef<HTMLTableCellElement | null>(null);

  // Update Last tooltip position on scroll/resize
  useEffect(() => {
    if (!hoveredLastHeader || !lastTooltipPosition) return;

    const updatePosition = () => {
      if (lastHeaderRef.current) {
        const rect = lastHeaderRef.current.getBoundingClientRect();
        setLastTooltipPosition({ x: rect.right + 4, y: rect.top });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredLastHeader, lastTooltipPosition]);

  // Update Song tooltip position on scroll/resize
  useEffect(() => {
    if (!hoveredSongHeader || !songTooltipPosition) return;

    const updatePosition = () => {
      if (songHeaderRef.current) {
        const rect = songHeaderRef.current.getBoundingClientRect();
        setSongTooltipPosition({ x: rect.right + 4, y: rect.top });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [hoveredSongHeader, songTooltipPosition]);

  // Analyze setlist to determine which items to show in tooltip
  const tooltipItems = useMemo(() => {
    if (!setlist || setlist.length === 0) {
      return {
        hasSegue: false,
        shorts: new Set<string>(),
        jotyRounds: new Set<string>(),
        lastCountTypes: new Set<string>()
      };
    }

    const shorts = new Set<string>();
    const jotyRounds = new Set<string>();
    const lastCountTypes = new Set<string>();
    let hasSegue = false;

    setlist.forEach(entry => {
      // Check for segue
      if (entry.entry_segue) {
        hasSegue = true;
      }

      // Check for short values
      if (entry.entry_short) {
        shorts.add(entry.entry_short.toLowerCase());
      }

      // Check for JOTY rounds
      if (entry.joty_round) {
        jotyRounds.add(entry.joty_round);
      }

      // Check for last_count values (Debut, TD, LIB)
      if (entry.last_count) {
        const lastCountUpper = entry.last_count.toUpperCase();
        if (lastCountUpper.includes('DEBUT')) {
          lastCountTypes.add('Debut');
        }
        if (lastCountUpper.includes('TD')) {
          lastCountTypes.add('TD');
        }
        if (lastCountUpper.includes('LIB')) {
          lastCountTypes.add('LIB');
        }
      }
    });

    return { hasSegue, shorts, jotyRounds, lastCountTypes };
  }, [setlist]);

  // Check if there are any items to display in the Song tooltip
  const hasTooltipItems = tooltipItems.hasSegue || tooltipItems.shorts.size > 0 || tooltipItems.jotyRounds.size > 0;
  
  // Check if there are any items to display in the Last tooltip
  const hasLastTooltipItems = tooltipItems.lastCountTypes.size > 0;

  // Define all possible explanations
  const shortExplanations: Record<string, { label: string; description: string }> = {
    'fake': { label: '[fake]', description: 'Song was played for a few seconds before stopping.' },
    'tease': { label: '[tease]', description: 'A small section of a song was played, such as a verse or chorus.' },
    'aborted': { label: '[aborted]', description: 'Song was started but not completed.' },
    'partial': { label: '[partial]', description: 'Part of a song\'s main section was played, but not completed.' },
    'abridged': { label: '[abridged]', description: 'Song was started and completed, but certain sections were omitted.' },
    'reprise': { label: '[reprise]', description: 'Song was continued after being played earlier in the show, or at a previous show.' },
    'unfinished': { label: '[unfinished]', description: 'Entire song was played, but it\'s ending or final chorus was omitted.' }
  };

  const jotyExplanations: Record<string, { badge: JSX.Element; description: string }> = {
    'JOTY': {
      badge: <span className="bg-gradient-to-br from-[#FFD700] to-[#FFC700] text-fifth px-1.5 py-[2px] rounded-full font-medium">JOTY</span>,
      description: 'Jam of the Year winner.'
    },
    '2nd': {
      badge: <span className="bg-gradient-to-br from-[#6B7280] to-[#6B7280] text-white px-1.5 py-[2px] rounded-full font-medium">2nd</span>,
      description: 'Runner-up in Jam of the Year.'
    },
    'F4': {
      badge: <span className="bg-gradient-to-br from-[#CD7F32] to-[#CD7F32] text-white px-1.5 py-[2px] rounded-full font-medium">F4</span>,
      description: 'Final Four in Jam of the Year.'
    },
    'E8': {
      badge: <span className="bg-[#8B5CF6] text-white px-1.5 py-[2px] rounded-full font-medium">E8</span>,
      description: 'Elite Eight in Jam of the Year.'
    },
    'S16': {
      badge: <span className="bg-[#3B82F6] text-white px-1.5 py-[2px] rounded-full font-medium">S16</span>,
      description: 'Sweet Sixteen in Jam of the Year.'
    },
    'R32': {
      badge: <span className="bg-[#10B981] text-white px-1.5 py-[2px] rounded-full font-medium">R32</span>,
      description: 'Round of 32 in Jam of the Year.'
    },
    'R64': {
      badge: <span className="bg-gray-300 text-gray-800 px-1.5 py-[2px] rounded-full font-medium">R64</span>,
      description: 'Round of 64 in Jam of the Year.'
    }
  };

  return (
    <>
      <thead>
        <tr className="text-white text-xs bg-fourth">
          <th className="font-semibold px-1.5 py-0.5 text-center whitespace-nowrap">#</th>
          <th 
            ref={songHeaderRef}
            className="font-semibold px-2 py-0.5 text-left cursor-pointer"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setSongTooltipPosition({ x: rect.right + 4, y: rect.top });
              setHoveredSongHeader(true);
            }}
            onMouseLeave={() => {
              setHoveredSongHeader(false);
              setSongTooltipPosition(null);
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (hoveredSongHeader) {
                setHoveredSongHeader(false);
                setSongTooltipPosition(null);
              } else {
                setSongTooltipPosition({ x: rect.right + 4, y: rect.top });
                setHoveredSongHeader(true);
              }
            }}
          >
            Song
          </th>
          <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">Time</th>
          {show?.show_canonid !== null && (
            <>
              <th 
                ref={lastHeaderRef}
                className="font-semibold px-2 py-0.5 text-center whitespace-nowrap cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setLastTooltipPosition({ x: rect.right + 4, y: rect.top });
                  setHoveredLastHeader(true);
                }}
                onMouseLeave={() => {
                  setHoveredLastHeader(false);
                  setLastTooltipPosition(null);
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (hoveredLastHeader) {
                    setHoveredLastHeader(false);
                    setLastTooltipPosition(null);
                  } else {
                    setLastTooltipPosition({ x: rect.right + 4, y: rect.top });
                    setHoveredLastHeader(true);
                  }
                }}
              >
                Last
              </th>
              <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">Tour</th>
              <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">Rarity</th>
            </>
          )}
          <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">
            <User strokeWidth={2} className="text-white w-3.5 h-3.5 inline" />
          </th>
          <th className="font-semibold px-2 py-0.5 text-left max-w-[500px]">Coach's Notes</th>
        </tr>
      </thead>

      {/* Last Tooltip Portal */}
      {hoveredLastHeader && lastTooltipPosition && hasLastTooltipItems && createPortal(
        <div 
          className="fixed text-[0.625rem] leading-[0.75rem] font-normal bg-canvas text-fifth rounded border border-fourth shadow-lg whitespace-normal pointer-events-none"
          style={{ 
            left: `${lastTooltipPosition.x}px`,
            top: `${lastTooltipPosition.y}px`,
            width: 'max-content',
            maxWidth: '220px',
            zIndex: 99999
          }}
        >
          {(() => {
            // Define last_count explanations
            const lastCountExplanations: Record<string, { badge: JSX.Element; description: string }> = {
              'Debut': {
                badge: <span className="bg-rose-600 text-white px-1 py-0.5 rounded font-medium">Debut</span>,
                description: 'First known time the song was played by Goose.'
              },
              'TD': {
                badge: <span className="bg-emerald-600 text-white px-1 py-0.5 rounded font-medium">TD</span>,
                description: 'Tour Debut — First known time the song was played in the current tour.'
              },
              'LIB': {
                badge: <span className="bg-yellow-600 text-white px-1 py-0.5 rounded font-medium">LIB</span>,
                description: 'Liberation — First known time the song was played in more than a calendar year.'
              }
            };

            // Collect items to render in order
            const items: Array<{ key: string; element: JSX.Element }> = [];
            const order = ['Debut', 'TD', 'LIB'];

            order.forEach(type => {
              if (tooltipItems.lastCountTypes.has(type)) {
                const explanation = lastCountExplanations[type];
                if (explanation) {
                  items.push({
                    key: type,
                    element: (
                      <div className="px-1 leading-[0.625rem] py-0.5 flex items-center gap-1">
                        {explanation.badge}
                        <span className='font-medium'>{explanation.description}</span>
                      </div>
                    )
                  });
                }
              }
            });

            // Render items with dividers (all except last)
            return items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <div key={item.key} className={!isLast ? 'border-b border-fourth/20' : ''}>
                  {item.element}
                </div>
              );
            });
          })()}
        </div>,
        document.body
      )}

      {/* Song Tooltip Portal */}
      {hoveredSongHeader && songTooltipPosition && hasTooltipItems && createPortal(
        <div 
          className="fixed text-[0.625rem] leading-[0.75rem] font-normal bg-canvas text-fifth rounded border border-fourth shadow-lg whitespace-normal pointer-events-none"
          style={{ 
            left: `${songTooltipPosition.x}px`,
            top: `${songTooltipPosition.y}px`,
            width: 'max-content',
            maxWidth: '220px',
            zIndex: 99999
          }}
        >
          {(() => {
            // Collect all items to render
            const items: Array<{ key: string; element: JSX.Element }> = [];

            // Add Segue
            if (tooltipItems.hasSegue) {
              items.push({
                key: 'segue',
                element: (
                  <div className="px-1 leading-[0.625rem] py-0.5 flex items-center gap-1">
                    <MoveRight className="text-red-600 w-5 h-5" />
                    <span className='font-medium'>Song segues into the next song without stopping.</span>
                  </div>
                )
              });
            }

            // Add Short values
            Array.from(tooltipItems.shorts).sort().forEach(short => {
              const explanation = shortExplanations[short];
              if (!explanation) return;
              items.push({
                key: short,
                element: (
                  <div className="px-1 leading-[0.625rem] py-0.5 flex items-center gap-1">
                    <span className="text-red-600 font-medium">{explanation.label}</span>
                    <span className='font-medium'>{explanation.description}</span>
                  </div>
                )
              });
            });

            // Add JOTY rounds
            ['JOTY', '2nd', 'F4', 'E8', 'S16', 'R32', 'R64'].filter(round => tooltipItems.jotyRounds.has(round)).forEach(round => {
              const explanation = jotyExplanations[round];
              if (!explanation) return;
              items.push({
                key: round,
                element: (
                  <div className="px-1 leading-[0.625rem] py-0.5 flex items-center gap-1">
                    {explanation.badge}
                    <span className='font-medium'>{explanation.description}</span>
                  </div>
                )
              });
            });

            // Render items with dividers (all except last)
            return items.map((item, index) => {
              const isLast = index === items.length - 1;
              return React.cloneElement(item.element, {
                key: item.key,
                className: `${item.element.props.className} ${!isLast ? 'border-b border-fourth/20' : ''}`
              });
            });
          })()}
        </div>,
        document.body
      )}
    </>
  );
};
