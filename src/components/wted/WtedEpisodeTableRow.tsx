import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { SetlistEntry } from '../../types/setlist';
import { WtedEpisodeEntry } from '../../hooks/useWtedEpisodeData';
import { 
  getPlacementColor, 
  formatLength, 
  shouldShowSetBreak,
  getEncoreLabel
} from '../../utils/setlistUtils';
import { GuestGroup } from '../../types/setlist';

interface WtedEpisodeTableRowProps {
  entry: WtedEpisodeEntry;
  index: number;
  entries: WtedEpisodeEntry[];
  displayNumber: number | null;
  hasSinglePlacementType: boolean;
  isMobile: boolean;
  getGuestColor: (entry: SetlistEntry, guestGroups: GuestGroup[]) => string;
  guestGroups: GuestGroup[];
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
  shouldShowGroupColumn?: boolean;
  onSongClick: (songId: string) => void;
  onGuestClick: (guestId: string) => void;
}

export const WtedEpisodeTableRow: React.FC<WtedEpisodeTableRowProps> = ({
  entry,
  index,
  entries,
  displayNumber,
  hasSinglePlacementType,
  isMobile,
  getGuestColor,
  guestGroups,
  hoverStates,
  hoveredCategory,
  shouldShowGroupColumn = false,
  onSongClick,
  onGuestClick
}) => {
  const {
    mousePosition,
    hoveredPersonnel,
    setMousePosition,
    setHoveredPersonnel
  } = hoverStates;

  if (!entry.setlist_entry) return null;

  const setlistEntry = entry.setlist_entry;
  const prevEntry = index > 0 ? entries[index - 1] : null;

  const elements = [];

  // Handle Encore bars
  if (!hasSinglePlacementType && entry.set) {
    if (prevEntry && entry.set.startsWith('E')) {
      if (!prevEntry.set || !prevEntry.set.startsWith('E') || prevEntry.set !== entry.set) {
        elements.push(
          <tr key={`encore-${entry.song}`}>
            <td 
              colSpan={shouldShowGroupColumn ? 8 : 7}
              className="text-fifth text-[0.625rem] px-4 bg-red-800/30 font-medium text-center border-y border-fourth"
            >
              {getEncoreLabel(entry.set)}
            </td>
          </tr>
        );
      }
    }

    // Handle Set Break bars
    if (prevEntry && prevEntry.set && entry.set && shouldShowSetBreak(prevEntry.set, entry.set)) {
      elements.push(
        <tr key={`setbreak-${entry.song}`}>
          <td 
            colSpan={shouldShowGroupColumn ? 8 : 7}
            className="text-fifth text-[0.625rem] px-4 bg-gray-300 font-medium text-center border-y border-fourth"
          >
            Set Break
          </td>
        </tr>
      );
    }
  }

  // Determine if this row should be dimmed or highlighted based on hovered category
  const shouldDimRow = hoveredCategory && setlistEntry.song_category !== hoveredCategory;
  const shouldHighlightRow = hoveredCategory && setlistEntry.song_category === hoveredCategory;
  
  elements.push(
    <tr 
      key={entry.song}
      className={`text-fifth transition-colors relative ${
        shouldHighlightRow 
          ? 'bg-tertiary/40'
          : 'bg-canvas/60 hover:bg-tertiary/40'
      } ${
        shouldDimRow ? 'opacity-10' : 'opacity-100'
      }`}
    >
      {/* Number column */}
      <td
        className={`px-1.5 ${getPlacementColor(entry.placement || '') !== 'transparent' ? 'text-white' : 'text-fifth'} text-center font-medium text-xs whitespace-nowrap relative bg-fourth text-white`}
      >
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            backgroundColor: getPlacementColor(entry.placement || '')
          }}
        />
        <span className="relative z-[2] inline-block w-full h-full flex items-center justify-center">
          {displayNumber || '\u00A0'}
        </span>
      </td>
  
      {/* Song title column */}
      <td className="px-2 cursor-pointer">
        <div className="w-full break-words flex items-center gap-2">
          <div className="text-fifth font-medium text-xs transition-colors">
            <span 
              className="hover:underline cursor-pointer mr-2 tracking-tight"
              onClick={() => onSongClick(setlistEntry.song_id)}
            >
              {setlistEntry.entry_song}
            </span>
            {setlistEntry.entry_short && (
              <span className="text-red-600 mr-2 text-[0.625rem] font-medium">[{setlistEntry.entry_short}]</span>
            )}
            {setlistEntry.entry_segue && (
              <MoveRight className="text-red-600 inline w-[1rem] h-[1rem] mr-2" />
            )}
          </div>
        </div>
      </td>
  
      {/* Date column */}
      <td className="px-2 text-fifth text-center font-medium text-[0.625rem] whitespace-nowrap">
        {entry.show_date && entry.show_id ? (() => {
          try {
            // Parse the date as UTC to avoid timezone issues
            const date = new Date(entry.show_date + 'T00:00:00Z');
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = date.getUTCDate().toString().padStart(2, '0');
            const year = date.getUTCFullYear().toString().slice(-2);
            const formattedDate = `${month}.${day}.${year}`;
            return (
              <Link
                to={`/setlist/${entry.show_id}`}
                className="hover:underline transition-colors"
              >
                {formattedDate}
              </Link>
            );
          } catch {
            return entry.show_date;
          }
        })() : (entry.show_date ? (() => {
          try {
            const date = new Date(entry.show_date + 'T00:00:00Z');
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = date.getUTCDate().toString().padStart(2, '0');
            const year = date.getUTCFullYear().toString().slice(-2);
            return `${month}.${day}.${year}`;
          } catch {
            return entry.show_date;
          }
        })() : '')}
      </td>

      {/* Location column */}
      <td className="px-2 text-fifth text-left font-light text-[0.625rem] whitespace-nowrap">
        {entry.show_venue_location ? (
          entry.venue_id ? (
            <Link
              to={`/venue/${entry.venue_id}`}
              className="hover:underline transition-colors"
            >
              {entry.show_venue_location}
            </Link>
          ) : (
            <span>{entry.show_venue_location}</span>
          )
        ) : ''}
      </td>

      {/* Duration column */}
      <td className="px-2 text-fifth text-center font-light text-[0.625rem] whitespace-nowrap">
        {formatLength(setlistEntry.entry_length)}
      </td>

      {/* Group column - only shown if shouldShowGroupColumn is true */}
      {shouldShowGroupColumn && (
        <td className="px-2 text-fifth text-center font-medium text-[0.625rem] whitespace-nowrap">
          {entry.show_group || ''}
        </td>
      )}

      {/* Personnel column */}
      <td 
        className="px-2 cursor-pointer relative text-xs whitespace-nowrap"
        onMouseEnter={(e) => {
          if (!isMobile && setlistEntry.guests && setlistEntry.guests.length > 0) {
            setHoveredPersonnel(entry.song);
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
        {setlistEntry.guests && setlistEntry.guests.length > 0 && (
          <div 
            className="w-4 h-4 rounded ml-auto"
            style={{ backgroundColor: getGuestColor(setlistEntry, guestGroups) }}
          />
        )}
        {!isMobile && hoveredPersonnel === entry.song && setlistEntry.guests && setlistEntry.guests.length > 0 && createPortal(
          <div 
            className="fixed text-[0.625rem] leading-[0.75rem] font-medium bg-canvas text-fifth px-2 py-1 rounded border border-fourth shadow-lg max-w-[300px] whitespace-normal break-words pointer-events-none"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`,
              zIndex: 99999
            }}
          >
            {setlistEntry.guests
              ?.sort((a, b) => a.guest_canonid - b.guest_canonid)
              .map(guest => guest.guest_display_name)
              .join(', ') || 'No guest information'}
          </div>,
          document.body
        )}
      </td>

      {/* Coach's Notes column */}
      <td className="px-2 text-fifth text-[0.625rem] font-light max-w-[500px]">
        {setlistEntry.entry_coachnotes ? (
          <div dangerouslySetInnerHTML={{ __html: setlistEntry.entry_coachnotes }} />
        ) : (
          '\u00A0'
        )}
      </td>
    </tr>
  );

  return <>{elements}</>;
};

