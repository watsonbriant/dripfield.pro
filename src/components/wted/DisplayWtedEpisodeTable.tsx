import React from 'react';
import { WtedEpisodeEntry } from '../../hooks/useWtedEpisodeData';
import { SetlistEntry, GuestGroup } from '../../types/setlist';
import { WtedEpisodeTableHeader } from './WtedEpisodeTableHeader';
import { WtedEpisodeTableRow } from './WtedEpisodeTableRow';

interface DisplayWtedEpisodeTableProps {
  entries: WtedEpisodeEntry[];
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
  onSongClick: (songId: string) => void;
  onGuestClick: (guestId: string) => void;
}

export const DisplayWtedEpisodeTable: React.FC<DisplayWtedEpisodeTableProps> = ({
  entries,
  isMobile,
  getGuestColor,
  guestGroups,
  hoverStates,
  hoveredCategory,
  onSongClick,
  onGuestClick
}) => {
  // Check if show_group column should be displayed
  // Only show if there's at least one entry with show_group !== "Goose"
  const showGroupValues = entries
    ?.map(entry => entry.show_group)
    .filter((group): group is string => group !== null && group !== undefined) || [];
  const hasNonGooseGroup = showGroupValues.some(group => group !== 'Goose');
  const shouldShowGroupColumn = hasNonGooseGroup;

  if (!entries || entries.length === 0) {
    return (
      <div className="border border-fourth rounded-lg p-3 overflow-x-auto w-fit shadow-xl">
        <table className="border-collapse w-auto">
          <WtedEpisodeTableHeader shouldShowGroupColumn={shouldShowGroupColumn} />
          <tbody>
            <tr>
              <td colSpan={shouldShowGroupColumn ? 8 : 7} className="text-center text-fifth py-8">
                No episode entries available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  let currentRunningNumber = 1;
  
  const uniquePlacements = new Set(
    entries
      .map(entry => entry.placement)
      .filter(Boolean)
  );
  const hasSinglePlacementType = uniquePlacements.size === 1;

  return (
    <div className="border border-fourth overflow-x-auto w-fit shadow-xl relative z-0 lg:z-auto">
      <table className="border-collapse table-auto relative z-0" style={{ minWidth: 'max-content' }}>
        <WtedEpisodeTableHeader shouldShowGroupColumn={shouldShowGroupColumn} />
        <tbody>
          {entries.map((entry, index) => {
            if (!entry.setlist_entry) return null;
            
            const displayNumber = currentRunningNumber++;

            return (
              <WtedEpisodeTableRow
                key={entry.song}
                entry={entry}
                index={index}
                entries={entries}
                displayNumber={displayNumber}
                hasSinglePlacementType={hasSinglePlacementType}
                isMobile={isMobile}
                getGuestColor={getGuestColor}
                guestGroups={guestGroups}
                hoverStates={hoverStates}
                hoveredCategory={hoveredCategory}
                shouldShowGroupColumn={shouldShowGroupColumn}
                onSongClick={onSongClick}
                onGuestClick={onGuestClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

