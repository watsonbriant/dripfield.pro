import React from 'react';
import { SetlistEntry, Show } from '../../types/setlist';
import { SetlistTableHeader } from './SetlistTableHeader';
import { SetlistTableRow } from './SetlistTableRow';

interface DisplaySetlistTableProps {
  setlist: SetlistEntry[] | undefined;
  show: Show | undefined;
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
  hoveredReleaseId: string | null;
  releaseToEntriesMap: Map<string, Set<string>>;
  onSongClick: (songName: string) => void;
  onLastShowClick: (showId: string) => void;
  onGuestClick: (guestId: string) => void;
  onJOTYClick: (year: number, entryId: string) => void;
  onNumberClick: (entryId: string) => void;
}

export const DisplaySetlistTable: React.FC<DisplaySetlistTableProps> = ({
  setlist,
  show,
  isMobile,
    isAdmin,
    copiedEntries,
    getGuestColor,
  hoverStates,
  hoveredCategory,
  hoveredReleaseId,
  releaseToEntriesMap,
  onSongClick,
  onLastShowClick,
  onGuestClick,
  onJOTYClick,
  onNumberClick
}) => {
  // Early return if setlist is undefined or empty, or show is undefined
  if (!setlist || setlist.length === 0 || !show) {
    return (
      <div className="border border-fourth rounded-lg p-3 overflow-x-auto w-fit shadow-xl">
        <table className="border-collapse w-auto">
          <SetlistTableHeader show={show} setlist={setlist} />
          <tbody>
            <tr>
              <td colSpan={show?.show_canonid !== null ? 8 : 5} className="text-center text-fifth py-8">
                {!show ? 'Loading show data...' : 'No setlist data available'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const skipNumberingShorts = ["fake", "tease", "reprise", "aborted"];
  const songsWithNumbers = new Set<string>();
  let currentRunningNumber = 1;
  
  const uniquePlacements = new Set(setlist.map(entry => entry.entry_placement));
  const hasSinglePlacementType = uniquePlacements.size === 1;

  return (
    <div className="border border-fourth overflow-x-auto w-fit shadow-xl relative z-0 lg:z-auto">
      <table className="border-collapse table-auto relative z-0" style={{ minWidth: 'max-content' }}>
        <SetlistTableHeader show={show} setlist={setlist} />
        <tbody>
          {setlist.map((entry, index) => {
            const shouldSkipNumbering = entry.entry_short && 
              skipNumberingShorts.includes(entry.entry_short.toLowerCase());
            
            const alreadyHasNumber = songsWithNumbers.has(entry.entry_song);
            
            const displayNumber = (!alreadyHasNumber && !shouldSkipNumbering) ? 
              currentRunningNumber++ : null;
            
            if (displayNumber !== null) {
              songsWithNumbers.add(entry.entry_song);
            }

            return (
              <SetlistTableRow
                key={entry.entry_id}
                entry={entry}
                index={index}
                setlist={setlist}
                show={show}
                displayNumber={displayNumber}
                hasSinglePlacementType={hasSinglePlacementType}
                isMobile={isMobile}
                isAdmin={isAdmin}
                copiedEntries={copiedEntries}
                getGuestColor={getGuestColor}
                hoverStates={hoverStates}
                hoveredCategory={hoveredCategory}
                hoveredReleaseId={hoveredReleaseId}
                releaseToEntriesMap={releaseToEntriesMap}
                onSongClick={onSongClick}
                onLastShowClick={onLastShowClick}
                onGuestClick={onGuestClick}
                onJOTYClick={onJOTYClick}
                onNumberClick={onNumberClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
