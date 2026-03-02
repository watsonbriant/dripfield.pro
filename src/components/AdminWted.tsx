import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AdminShowDropdown } from './AdminShowDropdown';
import { useShowData } from '../hooks/useShowData';
import { supabase } from '../lib/supabase';
import { ShowData } from '../types/showTypes';
import { formatDate } from '../utils/showUtils';
import { getPlacementColor } from '../utils/setlistUtils';

interface WtedSetlistEntry {
  entry_id: string;
  entry_set: string | null;
  entry_setnum: number;
  entry_setorder: number;
  entry_song: string | null;
  entry_short: string | null;
  entry_segue: string | null;
  entry_placement: string | null;
  radio_id: string | null;
}

export const AdminWted: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowData | null>(null);
  const [setlistEntries, setSetlistEntries] = useState<WtedSetlistEntry[]>([]);
  const [loadingSetlist, setLoadingSetlist] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showDataLoadedRef = useRef(false);

  const { allShows, loading, loadingProgress } = useShowData();

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
          entry_placement,
          radio_id
        `)
        .eq('entry_show', showId)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true })
        .order('entry_setorder', { ascending: true });

      if (error) throw error;
      setSetlistEntries((data || []) as WtedSetlistEntry[]);
    } catch (error) {
      console.error('Error fetching setlist entries:', error);
      setSetlistEntries([]);
    } finally {
      setLoadingSetlist(false);
    }
  };

  useEffect(() => {
    if (allShows.length > 0 && !showDataLoadedRef.current) {
      showDataLoadedRef.current = true;
      try {
        const storedShowId = localStorage.getItem('adminSelectedShowId');
        if (storedShowId) {
          const storedShow = allShows.find(show => show.show_id === storedShowId);
          if (storedShow) {
            setSelectedShow(storedShow);
            fetchSetlistEntries(storedShow.show_id);
          }
        }
      } catch (error) {
        console.error('Error restoring selected show from localStorage:', error);
      }
    }
  }, [allShows]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminSelectedShowId' && e.newValue) {
        const newShowId = e.newValue;
        if (!selectedShow || selectedShow.show_id !== newShowId) {
          const newShow = allShows.find(show => show.show_id === newShowId);
          if (newShow) {
            setSelectedShow(newShow);
            fetchSetlistEntries(newShow.show_id);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedShow, allShows]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const storedShowId = localStorage.getItem('adminSelectedShowId');
          if (storedShowId && (!selectedShow || selectedShow.show_id !== storedShowId)) {
            const storedShow = allShows.find(show => show.show_id === storedShowId);
            if (storedShow) {
              setSelectedShow(storedShow);
              fetchSetlistEntries(storedShow.show_id);
            }
          } else if (selectedShow) {
            fetchSetlistEntries(selectedShow.show_id);
          }
        } catch (error) {
          console.error('Error syncing selected show:', error);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedShow, allShows]);

  useEffect(() => {
    if (editingEntryId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingEntryId]);

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

  const handleShowSelect = async (show: ShowData) => {
    setSelectedShow(show);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setEditingEntryId(null);

    try {
      localStorage.setItem('adminSelectedShowId', show.show_id);
    } catch (error) {
      console.error('Error saving selected show to localStorage:', error);
    }

    await fetchSetlistEntries(show.show_id);
  };

  const handleStartEdit = (entry: WtedSetlistEntry) => {
    setEditingEntryId(entry.entry_id);
    setEditingValue(entry.radio_id || '');
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingValue('');
  };

  const handleSaveRadioId = async (entryId: string) => {
    setSavingEntryId(entryId);

    try {
      const { error } = await supabase
        .from('setlist_entries')
        .update({ radio_id: editingValue.trim() || null })
        .eq('entry_id', entryId);

      if (error) throw error;

      setSetlistEntries(prev =>
        prev.map(e =>
          e.entry_id === entryId
            ? { ...e, radio_id: editingValue.trim() || null }
            : e
        )
      );
    } catch (error) {
      console.error('Error saving radio_id:', error);
    } finally {
      setSavingEntryId(null);
      setEditingEntryId(null);
      setEditingValue('');
    }
  };

  const handleBlur = (entryId: string) => {
    if (savingEntryId === entryId) return;
    const entry = setlistEntries.find(e => e.entry_id === entryId);
    const originalValue = entry?.radio_id || '';
    const trimmed = editingValue.trim();
    if (trimmed !== originalValue) {
      handleSaveRadioId(entryId);
    } else {
      handleCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, entryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRadioId(entryId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
          WTED Radio IDs
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
          selectedShow={selectedShow}
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
          {loadingSetlist ? (
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
                      <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap border-r border-fourth/10">Radio ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {setlistEntries.map((entry, index) => (
                      <tr
                        key={entry.entry_id}
                        className="hover:bg-tertiary/40 transition-colors text-[0.625rem]"
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
                        <td className="px-2 border-r border-fourth/10">
                          {editingEntryId === entry.entry_id ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onBlur={() => handleBlur(entry.entry_id)}
                              onKeyDown={e => handleKeyDown(e, entry.entry_id)}
                              className="w-full min-w-[4rem] px-1.5 py-0.5 text-xs border border-fourth rounded bg-canvas text-fifth focus:outline-none focus:ring-1 focus:ring-fourth"
                              placeholder="Track ID"
                            />
                          ) : (
                            <button
                              onClick={() => handleStartEdit(entry)}
                              className="w-full text-left px-2 text-fifth hover:bg-tertiary/40 rounded text-xs"
                            >
                              {entry.radio_id || '—'}
                            </button>
                          )}
                        </td>
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
          <p className="text-fifth text-xs">Select a show to manage WTED radio IDs.</p>
        </div>
      )}
    </div>
  );
};

export default AdminWted;
