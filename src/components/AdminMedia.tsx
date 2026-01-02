import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AdminShowDropdown } from './AdminShowDropdown';
import { useShowData } from '../hooks/useShowData';
import { useShowReleases } from '../hooks/useShowReleases';
import { supabase } from '../lib/supabase';
import { ShowData } from '../types/showTypes';
import { SetlistEntryData } from '../types/setlist';
import { formatDate } from '../utils/showUtils';
import { getPlacementColor } from '../utils/setlistUtils';
import { Check } from 'lucide-react';
import { FaYoutube } from "react-icons/fa6";
import { SiBandcamp } from "react-icons/si";
import { FaSpotify } from "react-icons/fa";
import NugsColorIcon from '../../public/src/img/NugsColor.png';

// Get service icon component
const getServiceIcon = (serviceName: string | null) => {
  if (!serviceName) return null;
  
  switch (serviceName.toLowerCase()) {
    case 'youtube':
      return <FaYoutube className="inline-block text-[#FF0033]" size="0.875rem" />;
    case 'bandcamp':
      return <SiBandcamp className="inline-block text-[#1b96bb]" size="0.875rem" />;
    case 'nugs':
      return <img src={NugsColorIcon} alt="nugs" className="inline-block h-[0.875rem] w-auto" />;
    case 'spotify':
      return <FaSpotify className="inline-block text-[#1ed760]" size="0.875rem" />;
    default:
      return null;
  }
};

export const AdminMedia: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  const [setlistEntries, setSetlistEntries] = useState<SetlistEntryData[]>([]);
  const [mediaEntries, setMediaEntries] = useState<Set<string>>(new Set());
  const [loadingSetlist, setLoadingSetlist] = useState(false);
  const [togglingEntry, setTogglingEntry] = useState<string | null>(null);
  const [hoveredReleaseId, setHoveredReleaseId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const headerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { allShows, loading, loadingProgress } = useShowData();
  const { showReleases, loadingReleases, fetchShowReleases } = useShowReleases();

  // Filtered shows for dropdown
  const filteredShows = useMemo(() => {
    return allShows.filter(show => {
      const searchLower = searchTerm.toLowerCase();
      const dateStr = formatDate(show.show_date);
      return (
        dateStr.includes(searchLower) ||
        show.show_canonid?.toString().includes(searchLower) ||
        show.show_group.toLowerCase().includes(searchLower) ||
        show.show_venue_location?.toLowerCase().includes(searchLower) ||
        show.show_subvenue.toLowerCase().includes(searchLower)
      );
    });
  }, [allShows, searchTerm]);

  // Fetch setlist entries for selected show
  const fetchSetlistEntries = async (showId: string) => {
    try {
      setLoadingSetlist(true);
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
          entry_id, 
          entry_set, 
          entry_setnum, 
          entry_setorder,
          entry_song, 
          entry_short, 
          entry_segue, 
          entry_placement
        `)
        .eq('entry_show', showId)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true })
        .order('entry_setorder', { ascending: true });

      if (error) throw error;
      setSetlistEntries((data || []) as SetlistEntryData[]);
    } catch (error) {
      console.error('Error fetching setlist entries:', error);
      setSetlistEntries([]);
    } finally {
      setLoadingSetlist(false);
    }
  };

  // Fetch media entries (setlist_entry_media records) for selected show
  const fetchMediaEntries = async (showId: string) => {
    try {
      // First get all setlist entry IDs for this show
      const { data: entries, error: entriesError } = await supabase
        .from('setlist_entries')
        .select('entry_id')
        .eq('entry_show', showId);

      if (entriesError) throw entriesError;
      if (!entries || entries.length === 0) {
        setMediaEntries(new Set());
        return;
      }

      const entryIds = entries.map(e => e.entry_id);

      // Fetch all media entries for these setlist entries
      const { data: mediaData, error: mediaError } = await supabase
        .from('setlist_entry_media')
        .select('setlist_entry_id, release_id')
        .in('setlist_entry_id', entryIds);

      if (mediaError) throw mediaError;

      // Create a Set of keys in format "entry_id:release_id"
      const mediaSet = new Set<string>();
      if (mediaData) {
        mediaData.forEach(media => {
          mediaSet.add(`${media.setlist_entry_id}:${media.release_id}`);
        });
      }
      setMediaEntries(mediaSet);
    } catch (error) {
      console.error('Error fetching media entries:', error);
      setMediaEntries(new Set());
    }
  };

  // Handle show selection
  const handleShowSelect = async (show: ShowData) => {
    setSelectedShow(show);
    setIsDropdownOpen(false);
    setSearchTerm('');
    await Promise.all([
      fetchSetlistEntries(show.show_id),
      fetchShowReleases(show.show_id),
      fetchMediaEntries(show.show_id)
    ]);
  };

  // Toggle media entry (check/uncheck)
  const handleToggleMedia = async (entryId: string, releaseId: string) => {
    const key = `${entryId}:${releaseId}`;
    const isChecked = mediaEntries.has(key);
    
    setTogglingEntry(key);

    try {
      if (isChecked) {
        // Delete the record
        const { error } = await supabase
          .from('setlist_entry_media')
          .delete()
          .eq('setlist_entry_id', entryId)
          .eq('release_id', releaseId);

        if (error) throw error;

        // Update local state
        const newMediaEntries = new Set(mediaEntries);
        newMediaEntries.delete(key);
        setMediaEntries(newMediaEntries);
      } else {
        // Insert the record
        const { error } = await supabase
          .from('setlist_entry_media')
          .insert({
            setlist_entry_id: entryId,
            release_id: releaseId
          });

        if (error) throw error;

        // Update local state
        const newMediaEntries = new Set(mediaEntries);
        newMediaEntries.add(key);
        setMediaEntries(newMediaEntries);
      }
    } catch (error) {
      console.error('Error toggling media entry:', error);
    } finally {
      setTogglingEntry(null);
    }
  };

  // Toggle all entries for a release (select all / deselect all)
  const handleToggleAllForRelease = async (releaseId: string) => {
    if (!selectedShow || setlistEntries.length === 0) return;

    // Check if all entries are already checked
    const allChecked = setlistEntries.every(entry => {
      const key = `${entry.entry_id}:${releaseId}`;
      return mediaEntries.has(key);
    });

    // Determine what to do
    const shouldCheckAll = !allChecked;

    // Collect all operations
    const operations: Promise<void>[] = [];

    for (const entry of setlistEntries) {
      const key = `${entry.entry_id}:${releaseId}`;
      const isCurrentlyChecked = mediaEntries.has(key);

      if (shouldCheckAll && !isCurrentlyChecked) {
        // Need to insert
        operations.push(
          supabase
            .from('setlist_entry_media')
            .insert({
              setlist_entry_id: entry.entry_id,
              release_id: releaseId
            })
            .then(({ error }) => {
              if (error) throw error;
              return Promise.resolve();
            }) as Promise<void>
        );
      } else if (!shouldCheckAll && isCurrentlyChecked) {
        // Need to delete
        operations.push(
          supabase
            .from('setlist_entry_media')
            .delete()
            .eq('setlist_entry_id', entry.entry_id)
            .eq('release_id', releaseId)
            .then(({ error }) => {
              if (error) throw error;
              return Promise.resolve();
            }) as Promise<void>
        );
      }
    }

    try {
      await Promise.all(operations);

      // Update local state
      const newMediaEntries = new Set(mediaEntries);
      for (const entry of setlistEntries) {
        const key = `${entry.entry_id}:${releaseId}`;
        if (shouldCheckAll) {
          newMediaEntries.add(key);
        } else {
          newMediaEntries.delete(key);
        }
      }
      setMediaEntries(newMediaEntries);
    } catch (error) {
      console.error('Error toggling all media entries:', error);
    }
  };

  // Handle tooltip positioning
  useEffect(() => {
    if (hoveredReleaseId && headerRefs.current[hoveredReleaseId]) {
      const headerElement = headerRefs.current[hoveredReleaseId];
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 4
        });
      }
    } else {
      setTooltipPosition(null);
    }
  }, [hoveredReleaseId]);

  return (
    <div>
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
          Media Management
        </h3>

        <AdminShowDropdown
          isOpen={isDropdownOpen}
          onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredShows={filteredShows}
          onShowSelect={handleShowSelect}
          loading={loading}
          loadingProgress={loadingProgress}
        />
      </div>

      {selectedShow && (
        <div className="px-2 pb-1 mb-2">
          <h4 className="text-sm text-fifth font-medium">
            {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
          </h4>
        </div>
      )}

      {selectedShow && (
        <div className="overflow-x-auto">
          {loadingSetlist || loadingReleases ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-lg h-8 w-8 border-t-2 border-b-2 border-fourth"></div>
            </div>
          ) : (
            <>
              {setlistEntries.length > 0 ? (
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-canvas border-y border-fourth/10">
                      <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">S</th>
                      <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">#</th>
                      <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">Song</th>
                      <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">Short</th>
                      <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">&gt;</th>
                      <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">Placement</th>
                      {showReleases.map((releaseShow) => {
                        const allChecked = setlistEntries.length > 0 && setlistEntries.every(entry => {
                          const key = `${entry.entry_id}:${releaseShow.release_id}`;
                          return mediaEntries.has(key);
                        });
                        const someChecked = setlistEntries.some(entry => {
                          const key = `${entry.entry_id}:${releaseShow.release_id}`;
                          return mediaEntries.has(key);
                        });

                        return (
                          <th
                            key={releaseShow.release_id}
                            className="px-2 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div
                                ref={el => headerRefs.current[releaseShow.release_id] = el}
                                className="relative cursor-pointer"
                                onMouseEnter={() => setHoveredReleaseId(releaseShow.release_id)}
                                onMouseLeave={() => setHoveredReleaseId(null)}
                              >
                                {getServiceIcon(releaseShow.releases.release_service)}
                              </div>
                              <button
                                onClick={() => handleToggleAllForRelease(releaseShow.release_id)}
                                className={`w-4 h-4 flex items-center justify-center rounded border transition-colors text-[0.625rem] ${
                                  allChecked
                                    ? 'bg-fourth border-fourth text-white'
                                    : someChecked
                                    ? 'bg-fourth/50 border-fourth text-white'
                                    : 'bg-canvas border-fourth/30 text-fifth/30 hover:bg-tertiary/40'
                                } cursor-pointer`}
                                title={allChecked ? 'Deselect all' : 'Select all'}
                              >
                                {allChecked && <Check className="w-2.5 h-2.5" />}
                                {someChecked && !allChecked && <span className="text-[0.5rem]">−</span>}
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {setlistEntries.map((entry, index) => (
                      <tr
                        key={entry.entry_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                        } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                      >
                        <td className="px-2 font-light text-fifth whitespace-nowrap text-center border-r border-fourth/10">
                          {entry.entry_set}
                        </td>
                        <td className="px-2 font-light text-fifth whitespace-nowrap text-center border-r border-fourth/10">
                          {entry.entry_setnum}
                        </td>
                        <td className="px-2 text-fifth whitespace-nowrap font-medium border-r border-fourth/10">
                          {entry.entry_song}
                        </td>
                        <td className="px-2 font-light text-fifth whitespace-nowrap border-r border-fourth/10">
                          {entry.entry_short || ''}
                        </td>
                        <td className="px-2 font-light text-fifth whitespace-nowrap border-r border-fourth/10">
                          {entry.entry_segue || ''}
                        </td>
                        <td className="px-2 text-fifth whitespace-nowrap border-r border-fourth/10">
                          <div
                            className="px-2 rounded-lg text-center font-medium mx-auto"
                            style={{
                              backgroundColor: getPlacementColor(entry.entry_placement || ''),
                              color: getPlacementColor(entry.entry_placement || '') !== 'transparent' ? 'white' : 'black',
                              width: 'fit-content'
                            }}
                          >
                            {entry.entry_placement || ''}
                          </div>
                        </td>
                        {showReleases.map((releaseShow) => {
                          const key = `${entry.entry_id}:${releaseShow.release_id}`;
                          const isChecked = mediaEntries.has(key);
                          const isToggling = togglingEntry === key;

                          return (
                            <td
                              key={releaseShow.release_id}
                              className="px-2 text-center border-r border-fourth/10"
                            >
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleToggleMedia(entry.entry_id, releaseShow.release_id)}
                                  disabled={isToggling}
                                  className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                                    isChecked
                                      ? 'bg-fourth border-fourth text-white'
                                      : 'bg-canvas border-fourth/30 text-fifth/30 hover:bg-tertiary/40'
                                  } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {isChecked && <Check className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bg-primary border border-fourth rounded-lg p-3 text-center">
                  <p className="text-fifth text-xs">No setlist entries found for this show.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedShow && !loading && (
        <div className="bg-primary border border-fourth rounded-lg p-3 text-center">
          <p className="text-fifth text-xs">Select a show to view its media assignments.</p>
        </div>
      )}

      {/* Tooltip Portal */}
      {hoveredReleaseId && tooltipPosition && (() => {
        const releaseShow = showReleases.find(r => r.release_id === hoveredReleaseId);
        if (!releaseShow) return null;

        return createPortal(
          <div
            className="fixed bg-canvas border border-fourth text-fifth font-medium px-2 py-1 rounded shadow-lg text-[0.625rem] leading-[0.75rem] whitespace-nowrap pointer-events-none z-[99999]"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-4px'
            }}
          >
            <div className="font-medium">{releaseShow.releases.release_displayname}</div>
            {releaseShow.releases.release_service && (
              <div className="text-[0.625rem] font-light opacity-75 mt-0.5">
                {releaseShow.releases.release_service}
              </div>
            )}
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default AdminMedia;

