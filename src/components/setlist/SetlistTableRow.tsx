import React from 'react';
import { createPortal } from 'react-dom';
import { MoveRight } from 'lucide-react';
import { SetlistEntry, Show } from '../../types/setlist';
import { 
  getPlacementColor, 
  formatLength, 
  calculateRarity, 
  getRarityColor,
  createMarkup,
  shouldShowSetBreak,
  getEncoreLabel,
  isMainSet
} from '../../utils/setlistUtils';
import JOTYBadge from '../JOTYBadge';

interface SetlistTableRowProps {
  entry: SetlistEntry;
  index: number;
  setlist: SetlistEntry[];
  show: Show;
  displayNumber: number | null;
  hasSinglePlacementType: boolean;
  isMobile: boolean;
  isAdmin: boolean;
  copiedEntries: Set<string>;
  getGuestColor: (entry: SetlistEntry) => string;
  hoverStates: {
    mousePosition: { x: number; y: number };
    hoveredEntry: string | null;
    hoveredSong: string | null;
    hoveredPersonnel: string | null;
    setMousePosition: (pos: { x: number; y: number }) => void;
    setHoveredEntry: (id: string | null) => void;
    setHoveredSong: (id: string | null) => void;
    setHoveredPersonnel: (id: string | null) => void;
  };
  hoveredCategory: string | null;
  onSongClick: (songName: string) => void;
  onLastShowClick: (showId: string) => void;
  onGuestClick: (guestId: string) => void;
  onJOTYClick: (year: number) => void;
  onNumberClick: (entryId: string) => void;
}

export const SetlistTableRow: React.FC<SetlistTableRowProps> = ({
  entry,
  index,
  setlist,
  show,
  displayNumber,
  hasSinglePlacementType,
  isMobile,
  isAdmin,
  copiedEntries,
  getGuestColor,
  hoverStates,
  hoveredCategory,
  onSongClick,
  onLastShowClick,
  onGuestClick,
  onJOTYClick,
  onNumberClick
}) => {
  const {
    mousePosition,
    hoveredEntry,
    hoveredSong,
    hoveredPersonnel,
    setMousePosition,
    setHoveredEntry,
    setHoveredSong,
    setHoveredPersonnel
  } = hoverStates;

  const nextEntry = index < setlist.length - 1 ? setlist[index + 1] : null;
  const prevEntry = index > 0 ? setlist[index - 1] : null;

  const elements = [];

  if (!hasSinglePlacementType) {
    if (prevEntry && entry.entry_set.startsWith('E')) {
      if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
        elements.push(
          <tr key={`encore-${entry.entry_id}`}>
            <td 
              colSpan={show.show_canonid !== null ? 8 : 5}
              className="text-fifth text-[0.625rem] px-4 bg-red-800/30 font-medium text-center border-y border-fourth"
            >
              {getEncoreLabel(entry.entry_set)}
            </td>
          </tr>
        );
      }
    }

    if (prevEntry && shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)) {
      elements.push(
        <tr key={`setbreak-${entry.entry_id}`}>
          <td 
            colSpan={show.show_canonid !== null ? 8 : 5}
            className="text-fifth text-[0.625rem] px-4 bg-gray-300 font-medium text-center border-y border-fourth"
          >
            Set Break
          </td>
        </tr>
      );
    }
  }

  // Determine if this row should be dimmed or highlighted based on hovered category
  const shouldDimRow = hoveredCategory && entry.song_category !== hoveredCategory;
  const shouldHighlightRow = hoveredCategory && entry.song_category === hoveredCategory;
  
  elements.push(
    <tr 
      key={entry.entry_id}
      className={`text-fifth transition-colors relative ${
        shouldHighlightRow 
          ? 'bg-tertiary/40' // Highlighted rows: always tertiary/40, no hover change needed
          : 'bg-canvas/60 hover:bg-tertiary/40' // Normal rows: canvas/40, hover to tertiary/40
      } ${
        shouldDimRow ? 'opacity-10' : 'opacity-100'
      }`}
    >
      {/* Number column with absolute positioned background */}
      <td
        className={`px-1.5 ${getPlacementColor(entry.entry_placement) !== 'transparent' ? 'text-white' : 'text-fifth'} text-center font-medium text-xs whitespace-nowrap ${isAdmin ? 'cursor-pointer' : ''} relative`}
        onClick={() => onNumberClick(entry.entry_id)}
        onMouseEnter={(e) => {
          if (!isMobile) {
            setHoveredEntry(entry.entry_id);
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseMove={(e) => {
          if (!isMobile) {
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setHoveredEntry(null);
          }
        }}
      >
        {/* Absolute positioned background that fills parent row */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundColor: copiedEntries.has(entry.entry_id) 
              ? '#22c55e' 
              : getPlacementColor(entry.entry_placement)
          }}
        />
        {/* Content with relative positioning to appear above background */}
        <span className="relative z-[2] inline-block w-full h-full flex items-center justify-center">
          {copiedEntries.has(entry.entry_id) 
            ? '✓' 
            : (displayNumber || '\u00A0')
          }
        </span>
        {!isMobile && hoveredEntry === entry.entry_id && !copiedEntries.has(entry.entry_id) && createPortal(
          <div className="fixed text-[0.625rem] font-medium bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg min-w-max pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              zIndex: 99999
            }}>
            {entry.entry_placement}
          </div>,
          document.body
        )}
      </td>
  
      {/* Song title and notes column */}
      <td 
        className="px-2 cursor-pointer"
        onMouseEnter={(e) => {
          if (!isMobile) {
            setHoveredSong(entry.entry_id);
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseMove={(e) => {
          if (!isMobile) {
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setHoveredSong(null);
          }
        }}
      >
        <div className="w-full break-words flex items-center justify-between gap-2">
          <div className="text-fifth font-medium text-xs transition-colors">
            <span 
              className="hover:underline cursor-pointer mr-2 tracking-tight"
              onClick={() => onSongClick(entry.entry_song)}
            >
              {entry.entry_song}
            </span>
            {entry.entry_short && (
              <span className="text-red-600 mr-2 text-[0.625rem] font-medium">[{entry.entry_short}]</span>
            )}
            {entry.entry_segue && (
              <MoveRight className="text-red-600 inline w-[1rem] h-[1rem] mr-2" />
            )}
          </div>
          
          {/* JOTY badge container */}
          {entry.joty_round && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <JOTYBadge 
                round={entry.joty_round} 
                compact={true}
                onClick={() => {
                  const year = new Date(show.show_date).getFullYear();
                  onJOTYClick(year);
                }}
              />
            </div>
          )}
        </div>
        
        {!isMobile && hoveredSong === entry.entry_id && createPortal(
          <div 
            className="fixed text-[0.625rem] leading-[0.75rem] bg-canvas text-fifth px-2 py-1 rounded border font-light border-fourth shadow-lg min-w-max text-left pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              zIndex: 99999
            }}
          >
            <div className="font-medium">
              <span>{entry.entry_song}</span>
              {entry.entry_short && (
                <span className="text-red-600 ml-2">[{entry.entry_short}]</span>
              )}
              {entry.entry_segue && (
                <MoveRight className="text-red-600 inline ml-2 w-[1rem] h-[1rem]" />
              )}
            </div>
            {entry.times_played && (
              <div>
                <span dangerouslySetInnerHTML={createMarkup(entry.times_played)} />
              </div>
            )}
            {entry.shows_since_debut && (
              <div>
                <span dangerouslySetInnerHTML={createMarkup(entry.shows_since_debut)} />
              </div>
            )}
            {entry.song_rarity_percentage && (
              <div>
                <span dangerouslySetInnerHTML={createMarkup(entry.song_rarity_percentage)} />
              </div>
            )}
          </div>,
          document.body
        )}
      </td>
  
      {/* Duration column */}
      <td className="px-2 text-fifth text-center font-light text-xs whitespace-nowrap">
        {formatLength(entry.entry_length)}
      </td>

      {/* Last played column */}
      {show.show_canonid !== null && (
        <td 
          className={`px-2 text-center text-xs whitespace-nowrap ${entry.last_show_id ? 'cursor-pointer' : ''}`}
          onClick={() => {
            if (entry.last_show_id) {
              onLastShowClick(entry.last_show_id);
            }
          }}
          onMouseEnter={(e) => {
            if (!isMobile && entry.last_show_id) {
              setHoveredEntry(entry.entry_id + '_last');
              setMousePosition({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseMove={(e) => {
            if (!isMobile) {
              setMousePosition({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setHoveredEntry(null);
            }
          }}
        >
          <span 
            className={`font-medium rounded-md px-1 inline-block w-full ${
              entry.last_count?.includes('TD') 
                ? 'bg-emerald-600 text-white' 
                : entry.last_count?.includes('LIB')
                  ? 'bg-yellow-600 text-white' 
                  : entry.last_count?.includes('Debut')
                    ? 'bg-rose-600 text-white'
                    : 'text-fifth'
            } ${entry.last_show_id ? 'hover:underline transition-colors' : ''}`}
          >
            {entry.last_count || ''}
          </span>
          {!isMobile && hoveredEntry === entry.entry_id + '_last' && entry.last_show_id && createPortal(
            <div 
              className="fixed text-[0.625rem] leading-[0.75rem] bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg min-w-max pointer-events-none"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 10}px`,
                zIndex: 99999
              }}
            >
              <div className="font-medium">{entry.last_show_date}</div>
              <div className="font-light">{entry.last_venue_location}</div>
              {entry.last_show_tour && (
                <div className="font-light">{entry.last_show_tour}</div>
              )}
            </div>,
            document.body
          )}
        </td>
      )}
  
      {/* Tour count column */}
      {show.show_canonid !== null && (
        <td className="px-2 text-fifth font-light text-center text-xs whitespace-nowrap">
          {entry.song_tour_count || ''}
        </td>
      )}
      
      {/* Rarity column */}
      {show.show_canonid !== null && (
        <td 
          className="px-2 text-center cursor-pointer text-xs whitespace-nowrap"
          onMouseEnter={(e) => {
            if (!isMobile) {
              setHoveredSong(entry.entry_id + '_rarity');
              setMousePosition({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseMove={(e) => {
            if (!isMobile) {
              setMousePosition({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setHoveredSong(null);
            }
          }}
        >
          <span 
            className="text-white font-normal rounded-md px-1 inline-block w-full"
            style={{ 
              backgroundColor: getRarityColor(calculateRarity(entry.times_played_num, entry.shows_since_debut_num))
            }}
          >
            {calculateRarity(entry.times_played_num, entry.shows_since_debut_num)}
          </span>
          
          {!isMobile && hoveredSong === entry.entry_id + '_rarity' && createPortal(
            <div 
              className="fixed text-[0.625rem] leading-[0.75rem] bg-canvas text-fifth px-2 py-1 rounded border font-light border-fourth shadow-lg min-w-max text-left pointer-events-none"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 10}px`,
                zIndex: 99999
              }}
            >
              <div className="font-medium">
                <span>{entry.entry_song}</span>
                {entry.entry_short && (
                  <span className="text-red-600 ml-2">[{entry.entry_short}]</span>
                )}
                {entry.entry_segue && (
                  <MoveRight className="text-red-600 inline ml-2 w-[1rem] h-[0.625rem]" />
                )}
              </div>
              {entry.times_played && (
                <div>
                  <span dangerouslySetInnerHTML={createMarkup(entry.times_played)} />
                </div>
              )}
              {entry.shows_since_debut && (
                <div>
                  <span dangerouslySetInnerHTML={createMarkup(entry.shows_since_debut)} />
                </div>
              )}
              {entry.song_rarity_percentage && (
                <div>
                  <span dangerouslySetInnerHTML={createMarkup(entry.song_rarity_percentage)} />
                </div>
              )}
            </div>,
            document.body
          )}
        </td>
      )}
      
      {/* Personnel column */}
      <td 
        className="px-2 cursor-pointer relative text-xs whitespace-nowrap"
        onMouseEnter={(e) => {
          if (!isMobile) {
            setHoveredPersonnel(entry.entry_id);
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseMove={(e) => {
          if (!isMobile) {
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setHoveredPersonnel(null);
          }
        }}
      >
        <div 
          className="w-4 h-4 rounded ml-auto"
          style={{ backgroundColor: getGuestColor(entry) }}
        />
        {!isMobile && hoveredPersonnel === entry.entry_id && createPortal(
          <div 
            className="fixed text-[0.625rem] leading-[0.75rem] font-medium bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg max-w-[300px] whitespace-normal break-words pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              zIndex: 99999
            }}
          >
            {entry.guests
              ?.sort((a, b) => a.guest_canonid - b.guest_canonid)
              .map(guest => guest.guest_display_name)
              .join(', ') || 'No guest information'}
          </div>,
          document.body
        )}
      </td>
      
      {/* Coach Notes column */}
      <td className="px-2 text-fifth text-[0.625rem] [&_a]:text-[#a9682e] [&_a]:font-medium font-light max-w-[500px] leading-[0.625rem]">
        {entry.entry_coachnotes && (
          <div className="break-words" dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }} />
        )}
      </td>
    </tr>
  );
  
  return elements;
};
