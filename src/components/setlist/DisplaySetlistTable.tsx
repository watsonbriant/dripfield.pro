import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SetlistEntry, Show } from '../../types/setlist';
import { SetlistTableHeader } from './SetlistTableHeader';
import { SetlistTableRow } from './SetlistTableRow';

const WTED_WEBHOOK_URL = 'https://public.radio.co/stations/s3c11c85d6/requests';
const WTED_RATE_LIMIT_MS = 10000;
const WTED_SUCCESS_DISPLAY_MS = 2000;

const WTED_ERROR_MESSAGES: Record<number, string> = {
  403: 'Requests for WTED Goose Radio have been disabled.',
  404: 'Requested track not found. Submit a bug report for us to investigate.',
  409: 'You have already requested this track. Stay tuned to WTED Goose Radio to hear it!',
  429: 'You have reached the limit for requesting songs at this time, please check back later!'
};

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
  // Compute whether to show the radio (WTED) column - only if any entry has radio_id
  const hasRadioIds = (setlist && setlist.some(entry => entry.radio_id)) ?? false;

  // WTED request state
  const lastWtedRequestTimeRef = useRef<number>(0);
  const [wtedSuccessEntryId, setWtedSuccessEntryId] = useState<string | null>(null);
  const [wtedModalMessage, setWtedModalMessage] = useState<string | null>(null);

  const handleWtedRequest = useCallback(async (entryId: string, radioId: string) => {
    const now = Date.now();
    if (now - lastWtedRequestTimeRef.current < WTED_RATE_LIMIT_MS) {
      setWtedModalMessage('Please wait 10 seconds before requesting another song.');
      return;
    }

    try {
      const trackId = parseInt(radioId, 10);
      if (isNaN(trackId)) return;

      const response = await fetch(WTED_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackId })
      });

      if (response.ok) {
        lastWtedRequestTimeRef.current = now;
        setWtedSuccessEntryId(entryId);
        setTimeout(() => setWtedSuccessEntryId(null), WTED_SUCCESS_DISPLAY_MS);
      } else {
        let message = WTED_ERROR_MESSAGES[response.status];
        if (!message) {
          try {
            const data = await response.json();
            const apiMessage = data?.errors?.[0]?.message;
            if (typeof apiMessage === 'string') {
              message = apiMessage;
            }
          } catch {
            // Ignore JSON parse errors
          }
          if (!message) {
            message = 'Unable to submit request. Please try again later.';
          }
        }
        setWtedModalMessage(message);
      }
    } catch {
      setWtedModalMessage('Unable to submit request. Please try again later.');
    }
  }, []);

  // Early return if setlist is undefined or empty, or show is undefined
  if (!setlist || setlist.length === 0 || !show) {
    return (
      <div className="border border-fourth rounded-lg p-3 overflow-x-auto w-fit shadow-xl">
        <table className="border-collapse w-auto">
          <SetlistTableHeader show={show} setlist={setlist} showRadioColumn={false} />
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
        <SetlistTableHeader show={show} setlist={setlist} showRadioColumn={hasRadioIds} />
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
                showRadioColumn={hasRadioIds}
                onWtedRequest={handleWtedRequest}
                wtedSuccessEntryId={wtedSuccessEntryId}
              />
            );
          })}
        </tbody>
      </table>

      {/* WTED modal (rate limit and API errors) */}
      {wtedModalMessage && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[49999]"
            onClick={() => setWtedModalMessage(null)}
          />
          <div className="fixed inset-0 z-[50000] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-primary border border-fourth shadow-xl rounded-lg p-4 max-w-sm pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-fifth text-sm">
                {wtedModalMessage}
              </p>
              <button
                className="mt-3 w-full py-1.5 bg-tertiary text-fifth border border-fourth rounded hover:bg-fourth hover:text-white transition-colors text-sm font-medium"
                onClick={() => setWtedModalMessage(null)}
              >
                OK
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
