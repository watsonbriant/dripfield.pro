import React from 'react';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SongPick, SetlistEntry } from './types';
import { 
  getPlacementColor, 
  getSetDisplayName, 
  getUniqueSets, 
  getAllUniqueSets,
  getSongsForSet, 
  getSongsForActualSet 
} from './utils';
import { TooltipContainer } from './TooltipContainer';
import { ToggleSwitch } from './ToggleSwitch';

interface SetlistDisplayProps {
  songPicks: SongPick[];
  actualSetlist: SetlistEntry[];
  showActualSetlist: boolean;
  setShowActualSetlist: (show: boolean) => void;
  viewMode: boolean;
  show_scored?: boolean;
  isSelectionClosed?: boolean;
  onRemoveSong: (index: number) => void;
  onMoveSongUp: (pickId: string) => void;
  onMoveSongDown: (pickId: string) => void;
  onRemoveSet: (setId: string) => void;
}

export const SetlistDisplay: React.FC<SetlistDisplayProps> = ({
  songPicks,
  actualSetlist,
  showActualSetlist,
  setShowActualSetlist,
  viewMode,
  show_scored,
  isSelectionClosed,
  onRemoveSong,
  onMoveSongUp,
  onMoveSongDown,
  onRemoveSet
}) => {
  // Use getAllUniqueSets when in view mode for scored shows to show all sets
  // Otherwise use getUniqueSets for regular editing mode
  const uniqueSets = (viewMode && show_scored) 
    ? getAllUniqueSets(songPicks, actualSetlist)
    : getUniqueSets(songPicks);

  if (songPicks.length === 0) {
    return (
      <div className="text-fifth font-light py-4 text-center text-sm">
        No songs selected yet. Add songs above to begin.
      </div>
    );
  }

  if (viewMode && show_scored) {
    return (
      <>
        {/* Mobile view: Toggle switch */}
        <div className="md:hidden">
          <ToggleSwitch 
            showActualSetlist={showActualSetlist}
            setShowActualSetlist={setShowActualSetlist}
          />
        </div>
        
        {/* Desktop view: Two column layout */}
        <div className="hidden md:block">
          {uniqueSets.map(setId => (
            <div key={setId} className="border border-fourth overflow-hidden mb-2">
              <div className="flex items-center px-2 py-1 bg-black">
                <h4 className="text-sm font-medium text-white flex-1">
                  {setId.startsWith('E') ? 
                    `${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'} Selections` : 
                    `Set ${setId} Selections`}
                </h4>
                <h4 className="text-sm font-medium text-white flex-1 pl-6">
                  {setId.startsWith('E') ? 
                    `Actual ${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'}` : 
                    `Actual Set ${setId}`}
                </h4>
              </div>
              
              <div className="p-2 bg-canvas">
                <div className="grid grid-cols-2 gap-0">
                  {/* Left column: User's selections */}
                  <div className="space-y-0.5 pr-3 border-r border-fourth">
                    {getSongsForSet(songPicks, setId).length > 0 ? (
                      getSongsForSet(songPicks, setId).map((pick, index) => (
                        <div 
                          key={pick.id} 
                          className="flex justify-between items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-white text-center rounded text-xs font-medium px-2 py-0.5 flex items-center justify-center"
                              style={{ 
                                backgroundColor: getPlacementColor(pick.placement) 
                              }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-fifth">
                                {pick.song}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score display in the middle */}
                          <div className="flex items-center shrink-0">
                            {pick.score !== undefined && (
                              <TooltipContainer result={pick.result} score={pick.score} pick={pick} />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-xs font-medium">
                        No songs picked for this set
                      </div>
                    )}
                  </div>
                  
                  {/* Right column: Actual setlist */}
                  <div className="space-y-0.5 pl-3">
                    {getSongsForActualSet(actualSetlist, setId).length > 0 ? (
                      getSongsForActualSet(actualSetlist, setId).map((entry, index) => (
                        <div 
                          key={entry.entry_id} 
                          className="flex items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-white text-center rounded text-xs font-medium px-2 py-0.5 flex items-center justify-center"
                              style={{ 
                                backgroundColor: getPlacementColor(entry.entry_placement) 
                              }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-fifth">
                                {entry.entry_song}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-xs font-medium">
                        No songs played in this set
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile view: Single column based on toggle state */}
        <div className="md:hidden">
          {uniqueSets.map(setId => (
            <div key={setId} className="border border-fourth overflow-hidden mb-2">
              <div className="flex items-center px-2 py-1 bg-black">
                <h4 className="text-sm font-medium text-white flex-1">
                  {setId.startsWith('E') ? 
                    `${getSetDisplayName(setId)} ${!showActualSetlist ? 'Selections' : ''}` : 
                    `Set ${setId} ${!showActualSetlist ? 'Selections' : ''}`}
                </h4>
              </div>
              
              <div className="p-2 bg-canvas">
                {!showActualSetlist ? (
                  // Show user picks
                  <div className="space-y-0.5">
                    {getSongsForSet(songPicks, setId).length > 0 ? (
                      getSongsForSet(songPicks, setId).map((pick, index) => (
                        <div 
                          key={pick.id} 
                          className="flex justify-between items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-white text-center rounded text-xs font-medium px-2 py-0.5 flex items-center justify-center"
                              style={{ backgroundColor: getPlacementColor(pick.placement) }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-fifth">
                                {pick.song}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score display */}
                          <div className="flex items-center shrink-0">
                            {pick.score !== undefined && (
                              <TooltipContainer result={pick.result} score={pick.score} pick={pick} />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-xs font-medium">
                        No songs picked for this set
                      </div>
                    )}
                  </div>
                ) : (
                  // Show actual setlist
                  <div className="space-y-0.5">
                    {getSongsForActualSet(actualSetlist, setId).length > 0 ? (
                      getSongsForActualSet(actualSetlist, setId).map((entry, index) => (
                        <div 
                          key={entry.entry_id} 
                          className="flex items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-white text-center rounded text-xs font-medium px-2 py-0.5 flex items-center justify-center"
                              style={{ backgroundColor: getPlacementColor(entry.entry_placement) }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-medium text-xs text-fifth">
                                {entry.entry_song}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-xs font-medium">
                        No songs in this set
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Regular view for non-scored or edit mode
  return (
    <div>
      {uniqueSets.map(setId => (
        <div key={setId} className="border border-fourth overflow-hidden mb-2">
          <div className="flex justify-between items-center px-0.5 py-0.5 bg-fifth">
            <h4 className="text-sm pl-1.5 font-medium text-white">
              {getSetDisplayName(setId)}
            </h4>
            {!viewMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSet(setId);
                }}
                className="bg-red-600 text-white hover:bg-red-600/80 p-1 rounded"
                title="Remove this set"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-0.5 py-1 px-2 bg-canvas">
            {getSongsForSet(songPicks, setId).map((pick, index) => (
              <div 
                key={pick.id} 
                className="flex justify-between items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-xs text-white px-1.5 py-0.5 rounded flex items-center font-medium justify-center min-w-[1.5rem]"
                    style={{ 
                      backgroundColor: getPlacementColor(pick.placement) 
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-col justify-center">
                    <span className="break-words pr-2 font-medium text-xs">
                      {pick.song}
                    </span>
                    {/* Only show placement labels if not in view mode or if the show isn't closed */}
                    {pick.placement && (!viewMode || !isSelectionClosed) && (
                      <span className="text-[0.625rem] leading-[0.625rem] text-fourth font-base">
                        {pick.placement.startsWith('Main Set') ? '' : 
                         pick.placement.startsWith('Encore') ? '' : 
                         pick.placement}
                      </span>
                    )}
                  </div>
                </div>
                
                {!viewMode ? (
                  <div className="flex items-center shrink-0 ml-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onMoveSongUp(pick.id);
                      }}
                      className="text-fifth bg-tertiary hover:bg-tertiary/40 p-0.5 mr-0.5 rounded border border-fourth"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onMoveSongDown(pick.id);
                      }}
                      className="text-fifth bg-tertiary hover:bg-tertiary/40 p-0.5 mr-0.5 rounded border border-fourth"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        const index = songPicks.findIndex(p => p.id === pick.id);
                        if (index !== -1) {
                          onRemoveSong(index);
                        }
                      }}
                      className="text-white bg-red-600 hover:bg-red-600/50 p-0.5 mr-0.5 rounded border border-fourth"
                      title="Remove song"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center shrink-0 ml-2">
                    {/* Only show + indicators for scored shows */}
                    {show_scored && pick.score !== undefined && (
                      <TooltipContainer result={pick.result} score={pick.score} pick={pick} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
