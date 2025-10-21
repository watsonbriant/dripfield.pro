import React from 'react';
import { MoveRight } from 'lucide-react';
import { GiWhistle } from "react-icons/gi";
import { SetlistEntry, Show } from '../../types/setlist';
import { 
  cleanSongName, 
  getGridClass, 
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
  shouldShowCoachNotesForEntry: (entryId: string, hasCoachNotes: boolean) => boolean;
  toggleIndividualCoachNote: (entryId: string) => void;
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
  shouldShowCoachNotesForEntry,
  toggleIndividualCoachNote,
  getGuestColor,
  hoverStates,
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
          <div 
            key={`encore-${entry.entry_id}`} 
            className="text-fifth text-xs px-4 bg-red-800/30 font-medium text-center border-b border-secondary"
          >
            {getEncoreLabel(entry.entry_set)}
          </div>
        );
      }
    }

    if (prevEntry && shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)) {
      elements.push(
        <div 
          key={`setbreak-${entry.entry_id}`} 
          className="text-fifth text-xs px-4 bg-gray-300 font-medium text-center border-b border-secondary"
        >
          Set Break
        </div>
      );
    }
  }

  elements.push(
    <div 
      key={entry.entry_id}
      className={`${getGridClass(show.show_canonid)} grid-auto-columns-min-content text-fifth text-sm hover:bg-tertiary/40 transition-colors pr-2 py-[1px] items-start bg-primary relative`}
    >
      {/* Number column with absolute positioned background */}
      <div
        className={`w-8 ${getPlacementColor(entry.entry_placement) !== 'transparent' ? 'text-white' : 'text-fifth'} text-center font-medium leading-[1.125rem] mt-[1px] ${isAdmin ? 'cursor-pointer' : ''} relative`}
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
          className="absolute inset-0 -top-[2px] -bottom-[3px] z-10 pointer-events-none"
          style={{
            backgroundColor: copiedEntries.has(entry.entry_id) 
              ? '#22c55e' 
              : getPlacementColor(entry.entry_placement)
          }}
        />
        {/* Content with relative positioning to appear above background */}
        <span className="relative z-20 inline-block w-full h-full flex items-center justify-center">
          {copiedEntries.has(entry.entry_id) 
            ? '✓' 
            : (displayNumber || '\u00A0')
          }
        </span>
        {!isMobile && hoveredEntry === entry.entry_id && !copiedEntries.has(entry.entry_id) && (
          <div className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
            style={{
              left: `${mousePosition.x + 10}px`,
              top: `${mousePosition.y - 10}px`
            }}>
            {entry.entry_placement}
          </div>
        )}
      </div>
  
      {/* Song title and notes column */}
      <div className="cursor-pointer w-full flex justify-between items-start">
        <div
          className="flex-grow"
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
          <div className="w-full break-words flex items-center gap-2">
            <div className="flex-grow">
              <strong>
                <span 
                  className="text-fifth mr-2 hover:underline font-trad text-lg text-[1.125rem] leading-[1rem] transition-colors cursor-pointer"
                  onClick={() => onSongClick(entry.entry_song)}
                >
                  {cleanSongName(entry.entry_song)}
                </span>
                {entry.entry_short && (
                  <span className="text-red-600 mr-2 text-[0.75rem] leading-[1.25rem] font-medium">[{entry.entry_short}]</span>
                )}
                {entry.entry_segue && (
                  <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />
                )}
              </strong>
            </div>
            
            {/* Whistle and JOTY badge container */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {entry.entry_coachnotes && (
                <div className="relative">
                  <GiWhistle 
                    className={`h-5 w-5 cursor-pointer ${shouldShowCoachNotesForEntry(entry.entry_id, true) ? 'text-fourth' : 'text-fifth'} hover:text-fifth/60 transition-colors`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleIndividualCoachNote(entry.entry_id);
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      if (!isMobile) {
                        setHoveredEntry(entry.entry_id + '_whistle');
                        setHoveredSong(null);
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseMove={(e) => {
                      e.stopPropagation();
                      if (!isMobile) {
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      if (!isMobile) {
                        setHoveredEntry(null);
                      }
                    }}
                  />
                  {!isMobile && hoveredEntry === entry.entry_id + '_whistle' && (
                    <div 
                      className="fixed text-xs bg-tertiary font-normal text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] text-left max-w-[250px] whitespace-normal break-words [&_a]:text-[#a9682e] [&_a]:font-semibold"
                      style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`
                      }}
                      dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }}
                    />
                  )}
                </div>
              )}
              {entry.joty_round && (
                <JOTYBadge 
                  round={entry.joty_round} 
                  compact={true}
                  onClick={() => {
                    const year = new Date(show.show_date).getFullYear();
                    onJOTYClick(year);
                  }}
                />
              )}
            </div>
          </div>
          
          {entry.entry_coachnotes && shouldShowCoachNotesForEntry(entry.entry_id, true) && (
            <div 
              className="text-fifth/80 text-xs mt-0.5 w-full break-words [&_a]:text-[#a9682e] [&_a]:font-medium font-light"
              dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }}
            />
          )}
          
          {!isMobile && hoveredSong === entry.entry_id && (
            <div 
              className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 10}px`
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
            </div>
          )}
        </div>
      </div>
  
      {/* Duration column */}
      <div className="text-fifth/80 text-center font-light">
        {formatLength(entry.entry_length)}
      </div>

      {/* Last played column */}
      {show.show_canonid !== null && (
        <div className={`text-fifth/80 text-center rounded-md ${
            entry.last_count?.includes('TD') 
              ? 'bg-emerald-400 text-fifth' 
              : entry.last_count?.includes('LIB')
                ? 'bg-amber-300 text-fifth' 
                : entry.last_count?.includes('Debut')
                  ? 'bg-rose-400 text-fifth'
                  : ''
          } ${entry.last_show_id ? 'cursor-pointer hover:underline transition-colors' : ''}`}
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
          <span className="font-medium">{entry.last_count || ''}</span>
          {!isMobile && hoveredEntry === entry.entry_id + '_last' && entry.last_show_id && (
            <div 
              className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 10}px`
              }}
            >
              <div className="font-medium">{entry.last_show_date}</div>
              <div className="font-light">{entry.last_venue_location}</div>
              {entry.last_show_tour && (
                <div className="font-light">{entry.last_show_tour}</div>
              )}
            </div>
          )}
        </div>
      )}
  
      {/* Tour count column */}
      {show.show_canonid !== null && (
        <div className="text-fifth/80 font-light text-center">
          {entry.song_tour_count || ''}
        </div>
      )}
      
      {/* Rarity column */}
      {show.show_canonid !== null && (
        <div 
          className="text-white text-center font-normal rounded-md px-1 cursor-pointer"
          style={{ 
            backgroundColor: getRarityColor(calculateRarity(entry.times_played_num, entry.shows_since_debut_num)) 
          }}
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
          {calculateRarity(entry.times_played_num, entry.shows_since_debut_num)}
          
          {!isMobile && hoveredSong === entry.entry_id + '_rarity' && (
            <div 
              className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
              style={{
                left: `${mousePosition.x + 10}px`,
                top: `${mousePosition.y - 10}px`
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
            </div>
          )}
        </div>
      )}
      
      {/* Personnel column */}
      <div 
        className="cursor-pointer relative"
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
          className="w-5 h-5 rounded ml-auto"
          style={{ backgroundColor: getGuestColor(entry) }}
        />
        {!isMobile && hoveredPersonnel === entry.entry_id && (
          <div 
            className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] max-w-[300px] whitespace-normal break-words"
            style={{
              right: `${window.innerWidth - mousePosition.x + 5}px`,
              top: `${mousePosition.y - 10}px`
            }}
          >
            {entry.guests
              ?.sort((a, b) => a.guest_canonid - b.guest_canonid)
              .map(guest => guest.guest_display_name)
              .join(', ') || 'No guest information'}
          </div>
        )}
      </div>
    </div>
  );
  
  return elements;
};
