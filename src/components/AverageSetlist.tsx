import React from 'react';
import SetlistDisplay from './SetlistDisplay';
import { useAverageSetlist } from '../hooks/useAverageSetlist';
import { Show } from '../types/tourTypes';

interface AverageSetlistProps {
  shows: Show[];
  type: 'year' | 'tour';
  title: string; // e.g., "2024 Average Setlist" or "2025 Fall Tour Average Setlist"
}

export const AverageSetlist: React.FC<AverageSetlistProps> = ({ shows, type, title }) => {
  const { averageSetlist, isLoading, error } = useAverageSetlist(shows, type);

  if (isLoading) {
    return (
      <div className="bg-primary border border-fourth shadow-xl mt-4">
        <div className="bg-tertiary text-fifth py-0.5 px-2">
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth text-xs text-center mt-2">Calculating average setlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary border border-fourth shadow-xl mt-4">
        <div className="bg-tertiary text-fifth py-0.5 px-2">
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          <p className="text-red-500 text-xs text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!averageSetlist || averageSetlist.length === 0) {
    return null; // Don't display if no setlist entries
  }

  return (
    <div className="bg-primary border border-fourth shadow-xl mt-4">
      <div className="bg-tertiary text-fifth py-0.5 px-2">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="py-2">
        <SetlistDisplay setlist={averageSetlist} horizontalMargin="mx-2" />
      </div>
      
      {/* Stats Section */}
      {/* {stats && (
        <div className="border-t border-fourth px-3 py-2 mt-2">
          <h3 className="text-xs font-semibold text-fifth mb-2">Calculation Details</h3>
          <div className="space-y-1 text-[0.625rem] text-fifth">
            <div className="flex justify-between">
              <span>Canonical Shows Analyzed:</span>
              <span className="font-medium">{stats.totalCanonicalShows}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Setlist Entries:</span>
              <span className="font-medium">{stats.totalSetlistEntries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Unique Songs Considered:</span>
              <span className="font-medium">{stats.totalUniqueSongs}</span>
            </div>
            <div className="flex justify-between">
              <span>Set Inclusion Threshold:</span>
              <span className="font-medium">{stats.threshold}%</span>
            </div>
            
            {stats.includedSets.length > 0 && (
              <div className="mt-2 pt-2 border-t border-fourth/50">
                <div className="font-semibold mb-1">Included Sets:</div>
                {stats.includedSets.map((setInfo) => (
                  <div key={setInfo.set} className="pl-2 flex justify-between">
                    <span>
                      Set {setInfo.set === 'E1' ? 'Encore 1' : setInfo.set === 'E2' ? 'Encore 2' : setInfo.set === 'E3' ? 'Encore 3' : setInfo.set}:
                    </span>
                    <span className="font-medium">
                      {setInfo.showsWithSet}/{stats.totalCanonicalShows} shows ({setInfo.percentage.toFixed(1)}%) • Avg {setInfo.avgSongsPerSet} songs
                    </span>
                  </div>
                ))}
              </div>
            )}

            {stats.songSelections && stats.songSelections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-fourth/50">
                <button
                  onClick={() => setShowSongDetails(!showSongDetails)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-fifth hover:text-white transition-colors mb-2"
                >
                  <span>Song Selection Details</span>
                  {showSongDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                
                {showSongDetails && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.songSelections.map((selection, index) => {
                      const setDisplayName = selection.assignedSet === 'E1' ? 'Encore 1' : 
                                            selection.assignedSet === 'E2' ? 'Encore 2' : 
                                            selection.assignedSet === 'E3' ? 'Encore 3' : 
                                            `Set ${selection.assignedSet}`;

                      return (
                        <div key={`${selection.song}-${index}`} className="pl-2 border-l-2 border-fourth/30">
                          <div className="font-medium text-fifth mb-1">{selection.song}</div>
                          <div className="text-[0.6rem] text-fifth/80 space-y-0.5">
                            <div className="flex justify-between">
                              <span>Assigned to:</span>
                              <span className="font-medium">{setDisplayName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total appearances:</span>
                              <span className="font-medium">{selection.totalAppearances} shows</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average points:</span>
                              <span className="font-medium">{selection.averagePoints.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rarity percentage:</span>
                              <span className="font-medium">{selection.rarityPercentage.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};
