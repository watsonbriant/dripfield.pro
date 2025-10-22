import React from 'react';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SongPick, SetlistEntry } from './types';
import { 
  cleanSongName, 
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
            <div key={setId} className="border border-secondary rounded-lg overflow-hidden mb-5">
              <div className="flex items-center px-3 py-2 bg-black">
                <h4 className="text-base font-medium text-primary flex-1">
                  {setId.startsWith('E') ? 
                    `${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'} Selections` : 
                    `Set ${setId} Selections`}
                </h4>
                <h4 className="text-base font-medium text-primary flex-1 pl-6">
                  {setId.startsWith('E') ? 
                    `Actual ${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'}` : 
                    `Actual Set ${setId}`}
                </h4>
              </div>
              
              <div className="p-2 bg-canvas">
                <div className="grid grid-cols-2 gap-0">
                  {/* Left column: User's selections */}
                  <div className="space-y-0.5 pr-3 border-r border-secondary">
                    {getSongsForSet(songPicks, setId).length > 0 ? (
                      getSongsForSet(songPicks, setId).map((pick, index) => (
                        <div 
                          key={pick.id} 
                          className="flex justify-between items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-primary text-center rounded text-sm font-normal w-8 h-6 flex items-center justify-center"
                              style={{ 
                                backgroundColor: getPlacementColor(pick.placement) 
                              }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-trad text-[1.125rem] pb-1 leading-[1rem] text-fifth">
                                {cleanSongName(pick.song)}
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
                      <div className="text-center text-fifth text-sm italic">
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
                          className="flex items-center rounded-md text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <span 
                              className="text-primary text-center rounded text-sm font-normal w-8 h-6 flex items-center justify-center"
                              style={{ 
                                backgroundColor: getPlacementColor(entry.entry_placement) 
                              }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-trad text-[1.125rem] pb-1 leading-[1rem] text-fifth">
                                {cleanSongName(entry.entry_song)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-sm italic">
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
            <div key={setId} className="border border-secondary rounded-lg overflow-hidden mb-5">
              <div className="flex items-center px-3 py-2 bg-black">
                <h4 className="text-base font-medium text-primary flex-1">
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
                              className="text-primary text-center rounded text-sm font-normal w-8 h-6 flex items-center justify-center"
                              style={{ backgroundColor: getPlacementColor(pick.placement) }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-trad text-[1.25rem] pb-1 leading-[1rem] text-sm">
                                {cleanSongName(pick.song)}
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
                      <div className="text-center text-fifth text-sm italic">
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
                              className="text-primary text-center rounded text-sm font-normal w-8 h-6 flex items-center justify-center"
                              style={{ backgroundColor: getPlacementColor(entry.entry_placement) }}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="break-words pr-2 font-trad text-[1.25rem] pb-1 leading-[1rem] text-sm">
                                {cleanSongName(entry.entry_song)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-fifth text-sm italic">
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
    <div className="space-y-1">
      {uniqueSets.map(setId => (
        <div key={setId} className="border border-secondary rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-3 py-2 bg-black">
            <h4 className="text-base font-medium text-primary">
              {getSetDisplayName(setId)}
            </h4>
            {!viewMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSet(setId);
                }}
                className="bg-red-600 text-primary hover:bg-red-600/80 p-1.5 rounded-md"
                title="Remove this set"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="space-y-1 p-2 bg-canvas">
            {getSongsForSet(songPicks, setId).map((pick, index) => (
              <div 
                key={pick.id} 
                className="flex justify-between items-center rounded-md text-fifth hover:bg-tertiary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-xs text-primary px-2 py-0.5 rounded flex items-center font-normal justify-center min-w-[1.5rem]"
                    style={{ 
                      backgroundColor: getPlacementColor(pick.placement) 
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-col justify-center">
                    <span className="break-words pr-2 font-trad text-[1.125rem] pb-1 leading-[1rem]">
                      {cleanSongName(pick.song)}
                    </span>
                    {/* Only show placement labels if not in view mode or if the show isn't closed */}
                    {pick.placement && (!viewMode || !isSelectionClosed) && (
                      <span className="text-xs text-fourth font-medium">
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
                      className="text-fifth bg-tertiary hover:bg-tertiary/40 p-1 mr-0.5 rounded border border-secondary"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onMoveSongDown(pick.id);
                      }}
                      className="text-fifth bg-tertiary hover:bg-tertiary/40 p-1 mr-0.5 rounded border border-secondary"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        const index = songPicks.findIndex(p => p.id === pick.id);
                        if (index !== -1) {
                          onRemoveSong(index);
                        }
                      }}
                      className="text-primary bg-red-600 hover:bg-red-600/50 p-1 mr-0.5 rounded border border-secondary"
                      title="Remove song"
                    >
                      <X className="w-4 h-4" />
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
