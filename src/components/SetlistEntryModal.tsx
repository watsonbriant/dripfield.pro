import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, X, Trash2, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface SetlistEntryData {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_setorder: number;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string | null;
  entry_coachnotes: string | null;
  entry_show: string;
  entry_new: string | null;
}

interface SetOptions {
  set: string;
}

interface SetnumOptions {
  setnums: string;
}

interface SegueOptions {
  segues: string;
}

interface PlacementOptions {
  placements: string;
}

interface SongOptions {
  song: string;
  song_id: string;
}

interface ShortOptions {
  song_shorts: string;
}

interface GuestOption {
  guest_id: string;
  guest: string;
  guest_displayname: string;
  guest_category: string;
  guest_instrument: string;
}

interface GuestCategory {
  category: string;
  guests: GuestOption[];
}

interface SetlistEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SetlistEntryData | null;
  onSave: () => void;
  onSaveStatusUpdate: (status: 'idle' | 'processing' | 'done' | 'error') => void;
  isNewEntry?: boolean;
}

const SetlistEntryModal: React.FC<SetlistEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  entry, 
  onSave,
  onSaveStatusUpdate,
  isNewEntry = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedEntry, setEditedEntry] = useState<SetlistEntryData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  
  // Options for dropdown selections
  const [sets, setSets] = useState<SetOptions[]>([]);
  const [setnums, setSetnums] = useState<SetnumOptions[]>([]);
  const [segues, setSegues] = useState<SegueOptions[]>([]);
  const [placements, setPlacements] = useState<PlacementOptions[]>([]);
  const [songs, setSongs] = useState<SongOptions[]>([]);
  const [shorts, setShorts] = useState<ShortOptions[]>([]);
  
  // Guest-related states
  const [allGuests, setAllGuests] = useState<GuestCategory[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isGuestSectionExpanded, setIsGuestSectionExpanded] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');

  // Song search states
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);
  const [selectedSongName, setSelectedSongName] = useState('');

  const [selectedNewSongOption, setSelectedNewSongOption] = useState<string>("N/A");

  const songSearchInputRef = useRef<HTMLInputElement>(null);

  const getDefaultPlacement = (setName: string): string | null => {
    if (!setName || setName === '--') return null;
    
    // Handle Set 1-5 (both "1" and "Set 1" formats)
    const mainSetMatch = setName.match(/^(?:Set )?(\d)$/);
    if (mainSetMatch) {
      return `Main Set ${mainSetMatch[1]}`;
    }
    
    // Handle E1, E2, E3
    const encoreMatch = setName.match(/^E(\d)$/);
    if (encoreMatch) {
      return `Encore ${encoreMatch[1]}`;
    }
    
    return null;
  };
  
  // Add the updateStatistics function - runs in background and reports status
  const updateStatistics = async () => {
    try {
      const { data, error } = await supabase.functions
        .invoke('update-statistics', {
          body: { action: 'update_all_setlist_entries' }
        });
      
      if (error) {
        setSaveStatus('error');
        onSaveStatusUpdate('error');
        return false;
      } else {
        setSaveStatus('done');
        onSaveStatusUpdate('done');
        return true;
      }
    } catch (error) {
      setSaveStatus('error');
      onSaveStatusUpdate('error');
      return false;
    }
  };

  // Filtered songs based on search term
  const filteredSongs = React.useMemo(() => {
    if (!songSearchTerm) return songs;
    return songs.filter(song => 
      song.song.toLowerCase().includes(songSearchTerm.toLowerCase())
    );
  }, [songs, songSearchTerm]);

  // Load dropdown options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch sets
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('set')
          .order('set');
        
        if (setsError) throw setsError;
        setSets(setsData || []);

        // Fetch setnums
        const { data: setnumsData, error: setnumsError } = await supabase
          .from('setnums')
          .select('setnums')
          .order('setnums');
        
        if (setnumsError) throw setnumsError;
        setSetnums(setnumsData || []);

        // Fetch segues
        const { data: seguesData, error: seguesError } = await supabase
          .from('segues')
          .select('segues')
          .order('segues');
        
        if (seguesError) throw seguesError;
        setSegues(seguesData || []);

        // Fetch placements
        const { data: placementsData, error: placementsError } = await supabase
          .from('placements')
          .select('placements')
          .order('placement_order');
        
        if (placementsError) throw placementsError;
        setPlacements(placementsData || []);

        // Fetch all songs with pagination
        let allSongs: SongOptions[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
          const { data: songsData, error: songsError } = await supabase
            .from('songs')
            .select('song, song_id')
            .order('song')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (songsError) throw songsError;
          
          if (songsData && songsData.length > 0) {
            allSongs = [...allSongs, ...songsData];
            page++;
            hasMore = songsData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        setSongs(allSongs);

        // Fetch song shorts
        const { data: shortsData, error: shortsError } = await supabase
          .from('song_shorts')
          .select('song_shorts')
          .order('song_shorts');
        
        if (shortsError) throw shortsError;
        setShorts(shortsData || []);
        
        // Fetch all guests
        const { data: guestsData, error: guestsError } = await supabase
          .from('guests')
          .select('guest_id, guest, guest_displayname, guest_category, guest_instrument')
          .order('guest_category')
          .order('guest_displayname');
          
        if (guestsError) throw guestsError;
        
        // Group guests by category
        const groupedGuests: GuestCategory[] = [];
        if (guestsData) {
          const guestsByCategory: Record<string, GuestOption[]> = {};
          
          guestsData.forEach(guest => {
            const category = guest.guest_category || 'Uncategorized';
            if (!guestsByCategory[category]) {
              guestsByCategory[category] = [];
            }
            guestsByCategory[category].push(guest);
          });
          
          // Convert to array of categories
          Object.keys(guestsByCategory).sort().forEach(category => {
            groupedGuests.push({
              category,
              guests: guestsByCategory[category]
            });
          });
        }
        
        setAllGuests(groupedGuests);
      } catch (error) {
        // Error handling without console logging
      }
    };

    fetchOptions();
  }, []);

  // Filtered guests based on search term
  const filteredGuestsByCategory = React.useMemo(() => {
    if (!guestSearchTerm) return allGuests;
    
    return allGuests.map(category => ({
      ...category,
      guests: category.guests.filter(guest => 
        guest.guest.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
        guest.guest_displayname?.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
        guest.guest_instrument?.toLowerCase().includes(guestSearchTerm.toLowerCase())
      )
    })).filter(category => category.guests.length > 0);
  }, [allGuests, guestSearchTerm]);

  // Update local state when entry changes
  useEffect(() => {
    if (entry) {
      if (isNewEntry) {
        // For new entries, set default placement based on set value
        const defaultPlacement = getDefaultPlacement(entry.entry_set);
        
        const entryWithDefaults = {
          ...entry,
          entry_set: entry.entry_set || "--",
          entry_setnum: entry.entry_setnum || "--",
          entry_song: entry.entry_song || null,
          entry_short: entry.entry_short || null,
          entry_segue: entry.entry_segue || null,
          entry_placement: defaultPlacement, // Set default placement
          entry_new: entry.entry_new || "FALSE"
        };
        
        setEditedEntry(entryWithDefaults);
        setSelectedSongName('');
        setSongSearchTerm('');
        setSelectedNewSongOption("N/A");
      } else {
        // existing entry logic stays the same
        setEditedEntry(entry);
        setSelectedSongName(entry.entry_song || '');
        setSongSearchTerm('');
        
        if (entry.entry_new === "New Original Song") {
          setSelectedNewSongOption("New Original Song");
        } else if (entry.entry_new === "New Cover Song") {
          setSelectedNewSongOption("New Cover Song");
        } else {
          setSelectedNewSongOption("N/A");
        }
      }
      
      setIsEditing(isNewEntry);
      
      if (!isNewEntry && entry.entry_id) {
        fetchEntryGuests(entry.entry_id);
      } else {
        setSelectedGuestIds([]);
      }
    }
  }, [entry, isNewEntry]);

  useEffect(() => {
    if (isSongDropdownOpen && songSearchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        songSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSongDropdownOpen]);
  
  // Fetch guests associated with this setlist entry
  const fetchEntryGuests = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('setlist_entry_guests')
        .select('guest_id')
        .eq('setlist_entry_id', entryId);
      
      if (error) throw error;
      
      if (data) {
        const guestIds = data.map(item => item.guest_id);
        setSelectedGuestIds(guestIds);
      }
    } catch (error) {
      // Error handling without console logging
    }
  };
  
  // Add function to handle selecting all Goose members
  const handleSelectAllGooseMembers = () => {
    // Find all guests with "Goose (current)" category
    const gooseGuestIds = allGuests
      .find(category => category.category === "Goose (current)")
      ?.guests.map(guest => guest.guest_id) || [];
    
    // Add all Goose guest IDs to selected IDs (if not already selected)
    setSelectedGuestIds(prevSelected => {
      const newSelected = [...prevSelected];
      gooseGuestIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      return newSelected;
    });
  };
  
  // Handle guest selection/deselection
  const handleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prevSelected => {
      if (prevSelected.includes(guestId)) {
        return prevSelected.filter(id => id !== guestId);
      } else {
        return [...prevSelected, guestId];
      }
    });
  };

  // Handle song selection
  const handleSongSelection = (songName: string) => {
    if (!editedEntry) return;
    
    setSelectedSongName(songName);
    setEditedEntry({
      ...editedEntry,
      entry_song: songName
    });
    setIsSongDropdownOpen(false);
    setSongSearchTerm('');
  };
  
  // State for delete confirmation
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedEntry) return;
    
    const { name, value } = e.target;
    
    let updatedValue: string | number | null = value;
    
    if (value === "--") {
      updatedValue = name === "entry_setnum" ? "--" : null;
    } else if (name === 'entry_setnum' || name === 'entry_setorder') {
      updatedValue = value === '' ? null : parseInt(value) || 0;
    }
    
    // If Set changes and this is a new entry or user hasn't manually changed placement,
    // auto-update placement
    if (name === 'entry_set' && isNewEntry) {
      const defaultPlacement = getDefaultPlacement(value);
      setEditedEntry({
        ...editedEntry,
        [name]: updatedValue,
        entry_placement: defaultPlacement // Auto-update placement when set changes
      });
    } else {
      setEditedEntry({
        ...editedEntry,
        [name]: updatedValue,
      });
    }
  };

  const toggleEdit = () => {
    if (isEditing && !isNewEntry) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };
  
  // Save guest associations for a setlist entry
  const saveGuestAssociations = async (entryId: string) => {
    try {
      // Fetch current associations
      const { data: currentAssociations, error: fetchError } = await supabase
        .from('setlist_entry_guests')
        .select('guest_id')
        .eq('setlist_entry_id', entryId);
      
      if (fetchError) throw fetchError;
      
      const currentGuestIds = currentAssociations?.map(item => item.guest_id) || [];
      
      // Determine which guests to add and which to remove
      const guestsToAdd = selectedGuestIds.filter(id => !currentGuestIds.includes(id));
      const guestsToRemove = currentGuestIds.filter(id => !selectedGuestIds.includes(id));
      
      // Process removals if needed
      if (guestsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('setlist_entry_guests')
          .delete()
          .eq('setlist_entry_id', entryId)
          .in('guest_id', guestsToRemove);
        
        if (deleteError) throw deleteError;
      }
      
      // Process additions if needed
      if (guestsToAdd.length > 0) {
        const guestAssociations = guestsToAdd.map(guestId => ({
          setlist_entry_id: entryId,
          guest_id: guestId
        }));
        
        // Insert one at a time to handle potential issues with individual records
        for (const association of guestAssociations) {
          const { error: insertError } = await supabase
            .from('setlist_entry_guests')
            .insert(association)
            .select();
          
          if (insertError) {
            // If we hit a unique constraint error, just skip and continue
            if (insertError.code !== '23505') { // PostgreSQL unique violation code
              throw insertError;
            }
          }
        }
      }
      
    } catch (error) {
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    if (!editedEntry) return;
    
    // Check if required fields are filled for new entries
    if (isNewEntry) {
      if (!editedEntry.entry_set || !editedEntry.entry_song) {
        alert('Please fill in all required fields (Set and Song are required)');
        return;
      }
    }

    // NOTE: Remove the loading overlay JSX from the modal's return statement
    // since the modal now closes immediately

    // Close modal immediately
    onClose();
    
    // Set initial status
    setSaveStatus('processing');
    onSaveStatusUpdate('processing');
    
    try {
      // Create a copy of editedEntry with empty strings and "--" converted to null
      const entryToSave = {
        ...editedEntry,
        entry_set: editedEntry.entry_set === "--" ? null : editedEntry.entry_set,
        entry_setnum: editedEntry.entry_setnum === "--" ? null : (typeof editedEntry.entry_setnum === 'string' && editedEntry.entry_setnum === "--" ? null : editedEntry.entry_setnum),
        entry_song: editedEntry.entry_song === "--" ? null : editedEntry.entry_song,
        entry_short: editedEntry.entry_short === "" || editedEntry.entry_short === "--" ? null : editedEntry.entry_short,
        entry_segue: editedEntry.entry_segue === "" || editedEntry.entry_segue === "--" ? null : editedEntry.entry_segue,
        entry_length: editedEntry.entry_length === "" ? null : editedEntry.entry_length,
        entry_placement: editedEntry.entry_placement === "" || editedEntry.entry_placement === "--" ? null : editedEntry.entry_placement,
        entry_coachnotes: editedEntry.entry_coachnotes === "" ? null : editedEntry.entry_coachnotes,
        entry_new: selectedNewSongOption === "N/A" ? "FALSE" : selectedNewSongOption
      };
      
      let savedEntryId: string;
      
      if (isNewEntry) {
        // Insert new entry - Omit entry_id as it will be generated by the database
        
        // Create a data object without the entry_id and entry_setorder for insertion
        const insertData = {
          entry_set: entryToSave.entry_set,
          entry_setnum: entryToSave.entry_setnum,
          entry_song: entryToSave.entry_song,
          entry_show: entryToSave.entry_show,
          entry_new: entryToSave.entry_new
        };
        
        // Add optional fields only if they have values
        if (entryToSave.entry_short) insertData['entry_short'] = entryToSave.entry_short;
        if (entryToSave.entry_segue) insertData['entry_segue'] = entryToSave.entry_segue;
        if (entryToSave.entry_length) insertData['entry_length'] = entryToSave.entry_length;
        if (entryToSave.entry_placement) insertData['entry_placement'] = entryToSave.entry_placement;
        if (entryToSave.entry_coachnotes) insertData['entry_coachnotes'] = entryToSave.entry_coachnotes;
        
        const { data, error } = await supabase
          .from('setlist_entries')
          .insert(insertData)
          .select();
        
        if (error) {
          alert(`Error creating entry: ${error.message}`);
          setSaveStatus('error');
          onSaveStatusUpdate('error');
          throw error;
        }
        
        // Get the new entry ID
        if (data && data.length > 0) {
          savedEntryId = data[0].entry_id;
          
          // Save guest associations if any are selected
          if (selectedGuestIds.length > 0) {
            await saveGuestAssociations(savedEntryId);
          }
        }
        
        // Update statistics after successful insert
        await updateStatistics();
      } else {
        // Update existing entry
        
        const { error } = await supabase
          .from('setlist_entries')
          .update({
            entry_set: entryToSave.entry_set,
            entry_setnum: entryToSave.entry_setnum,
            entry_song: entryToSave.entry_song,
            entry_short: entryToSave.entry_short,
            entry_segue: entryToSave.entry_segue,
            entry_length: entryToSave.entry_length,
            entry_placement: entryToSave.entry_placement,
            entry_coachnotes: entryToSave.entry_coachnotes,
            entry_new: entryToSave.entry_new
          })
          .eq('entry_id', entryToSave.entry_id);
        
        if (error) {
          alert(`Error updating entry: ${error.message}`);
          setSaveStatus('error');
          onSaveStatusUpdate('error');
          throw error;
        }
        
        // Save guest associations
        await saveGuestAssociations(entryToSave.entry_id);
        
        // Update statistics after successful update
        await updateStatistics();
      }
      
      setIsEditing(false);
      onSave(); // Trigger refetch of entries
    } catch (error) {
      setSaveStatus('error');
      onSaveStatusUpdate('error');
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-primary border border-secondary rounded-lg p-3 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-lg">
            <div className={`px-6 py-3 rounded-lg border border-secondary transition-colors ${
              saveStatus === 'processing' ? 'bg-black text-primary' :
              saveStatus === 'done' ? 'bg-green-600 text-primary' :
              saveStatus === 'error' ? 'bg-red-600 text-primary' :
              'bg-fourth text-primary'
            }`}>
              <span className="text-lg font-semibold">
                {saveStatus === 'processing' ? 'Processing...' :
                 saveStatus === 'done' ? 'Done!' :
                 saveStatus === 'error' ? 'Error.' :
                 'Saving...'}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
            {isNewEntry ? 'Add Setlist Entry' : 'Edit Setlist Entry'}
          </h3>
          <div className="flex gap-2">
            {!isNewEntry && (
              <>
                <button
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-10 h-10 rounded-md bg-blue-500 text-primary text-fifth hover:bg-blue-500/70 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-secondary"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Edit className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                {/* Only show delete button for existing entries */}
                {entry && entry.entry_id && (
                  <button
                    onClick={() => {
                      if (isDeleteConfirming) {
                        setIsSubmitting(true);
                        setSaveStatus('processing');
                        onSaveStatusUpdate('processing');
                        
                        supabase
                          .from('setlist_entries')
                          .delete()
                          .eq('entry_id', entry.entry_id)
                          .then(({ error }) => {
                            if (error) {
                              alert(`Error deleting entry: ${error.message}`);
                              setSaveStatus('error');
                              onSaveStatusUpdate('error');
                            } else {
                              updateStatistics();
                              onSave();
                              onClose();
                            }
                          })
                          .catch(error => {
                            setSaveStatus('error');
                            onSaveStatusUpdate('error');
                          })
                          .finally(() => {
                            setIsSubmitting(false);
                            setIsDeleteConfirming(false);
                          });
                      } else {
                        // First click - ask for confirmation
                        setIsDeleteConfirming(true);
                        
                        // Auto-reset confirmation state after 3 seconds
                        setTimeout(() => {
                          setIsDeleteConfirming(false);
                        }, 3000);
                      }
                    }}
                    disabled={isSubmitting}
                    className={`flex text-primary items-center justify-center w-10 h-10 rounded-md border ${
                      isDeleteConfirming 
                        ? 'bg-green-500 hover:bg-green-600 border-secondary' 
                        : 'bg-red-500 hover:bg-red-600 border-secondary'
                    } text-fifth transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
                  >
                    {isDeleteConfirming ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </>
            )}
            {isNewEntry && (
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting || !editedEntry?.entry_set || !editedEntry?.entry_song}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-tertiary text-fifth hover:bg-tertiary/80 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-secondary"
              >
                <Save className="w-5 h-5" />
                {isSubmitting && <span className="ml-1">...</span>}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-md bg-fifth hover:bg-red-600 text-red-600 hover:text-fifth transition-colors border border-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* Set */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Set</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_set"
                value={editedEntry?.entry_set === null ? "--" : editedEntry?.entry_set || "--"}
                onChange={handleInputChange}
                className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
                required
              >
                <option value="--">--</option>
                {sets.map((set) => (
                  <option key={set.set} value={set.set}>
                    {set.set}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_set || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>
          
          {/* Set Number */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Set Number</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_setnum"
                value={editedEntry?.entry_setnum === null ? "--" : editedEntry?.entry_setnum?.toString() || "--"}
                onChange={handleInputChange}
                className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
                required
              >
                <option value="--">--</option>
                {setnums.map((setnum) => (
                  <option key={setnum.setnums} value={setnum.setnums}>
                    {setnum.setnums}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_setnum || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>

          {/* Placement */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Placement</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_placement"
                value={editedEntry?.entry_placement === null ? "--" : editedEntry?.entry_placement || "--"}
                onChange={handleInputChange}
                className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              >
                <option value="--">--</option>
                {placements.map((placement) => (
                  <option key={placement.placements} value={placement.placements}>
                    {placement.placements}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_placement || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>
          
          {/* Song - Updated with searchable dropdown */}
          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-medium text-fifth">Song</label>
            {isEditing || isNewEntry ? (
              <div className="relative">
                <div
                  className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light cursor-pointer flex items-center justify-between"
                  onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
                >
                  <span className={selectedSongName ? 'text-fifth' : 'text-fifth/60'}>
                    {selectedSongName || 'Select a song...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isSongDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isSongDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-canvas border border-secondary rounded-md shadow-lg">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          ref={songSearchInputRef}
                          type="text"
                          value={songSearchTerm}
                          onChange={(e) => setSongSearchTerm(e.target.value)}
                          placeholder="Search songs..."
                          className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-xs focus:outline-none focus:ring-1 focus:ring-tertiary text-fifth placeholder-black/60"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {filteredSongs.length > 0 ? (
                        <>
                          {filteredSongs.map((song) => (
                            <div
                              key={song.song_id}
                              className={`px-3 py-0.5 hover:bg-tertiary/20 cursor-pointer text-xs ${
                                selectedSongName === song.song ? 'bg-tertiary/10' : ''
                              }`}
                              onClick={() => handleSongSelection(song.song)}
                            >
                              {song.song}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-2 text-sm text-fifth/60">
                          {songSearchTerm ? 'No songs found matching your search' : 'No songs available'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_song || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>
          
          {/* Short */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Short</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_short"
                value={editedEntry?.entry_short === null ? "--" : editedEntry?.entry_short || "--"}
                onChange={handleInputChange}
                className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              >
                <option value="--">--</option>
                {shorts.map((short) => (
                  <option key={short.song_shorts} value={short.song_shorts}>
                    {short.song_shorts}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_short || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>
          
          {/* Segue */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Segue</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_segue"
                value={editedEntry?.entry_segue === null ? "--" : editedEntry?.entry_segue || "--"}
                onChange={handleInputChange}
                className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              >
                <option value="--">--</option>
                {segues.map((segue) => (
                  <option key={segue.segues} value={segue.segues}>
                    {segue.segues}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_segue || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
              />
            )}
          </div>
          
          {/* Length */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-fifth">Length (hh:mm:ss)</label>
            <input
              type="text"
              name="entry_length"
              value={editedEntry?.entry_length || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              placeholder="00:00:00"
              className={`w-full px-2 py-2 rounded-md border ${isEditing || isNewEntry ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
            />
          </div>
          
          {/* Guests Section */}
          <div className="space-y-2 md:col-span-6 mt-2">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-medium text-fifth">Guests</label>
                  {/* Move button next to the heading, only show when editing or new entry */}
                  {(isEditing || isNewEntry) && (
                    <button
                      onClick={handleSelectAllGooseMembers}
                      className="px-2 py-1 rounded-md bg-tertiary text-fifth hover:bg-canvas transition-colors text-xs font-medium border border-secondary"
                    >
                      Select All Goose Members
                    </button>
                  )}
                </div>
                <button 
                  className="text-fifth hover:text-[#a9682e] cursor-pointer"
                  onClick={() => setIsGuestSectionExpanded(!isGuestSectionExpanded)}
                >
                  {isGuestSectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Guest Pills */}
              {selectedGuestIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedGuestIds.map(guestId => {
                    // Find the guest info
                    const guestInfo = allGuests.flatMap(category => category.guests)
                      .find(g => g.guest_id === guestId);
                    
                    if (!guestInfo) return null;
                    
                    return (
                      <div 
                        key={guestId} 
                        className="bg-tertiary text-fifth text-xs px-2 py-1 rounded-lg flex items-center border border-secondary"
                      >
                        <span>{guestInfo.guest_displayname || guestInfo.guest}</span>
                        {(isEditing || isNewEntry) && (
                          <button 
                            className="ml-1 text-fifth/70 hover:text-fifth"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening/closing the section
                              handleGuestSelection(guestId);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {isGuestSectionExpanded && (
              <div className={`border rounded-md p-3 ${isEditing || isNewEntry ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'}`}>
                {/* Add search input */}
                {(isEditing || isNewEntry) && (
                  <div className="mb-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={guestSearchTerm}
                        onChange={(e) => setGuestSearchTerm(e.target.value)}
                        placeholder="Search guests..."
                        className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-tertiary text-fifth placeholder-black/60"
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                    </div>
                  </div>
                )}
                
                {filteredGuestsByCategory.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {filteredGuestsByCategory.map(category => (
                      <div key={category.category} className="mb-4">
                        <h4 className="text-sm font-medium text-fifth mb-2">{category.category}</h4>
                        <div className="space-y-1">
                          {category.guests.map(guest => (
                            <div key={guest.guest_id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`guest-${guest.guest_id}`}
                                checked={selectedGuestIds.includes(guest.guest_id)}
                                onChange={() => handleGuestSelection(guest.guest_id)}
                                disabled={!isEditing && !isNewEntry}
                                className="mr-2 h-4 w-4 rounded border-secondary/30 bg-white checked:bg-tertiary focus:ring-tertiary disabled:opacity-50"
                              />
                              <label 
                                htmlFor={`guest-${guest.guest_id}`} 
                                className="text-fifth text-xs cursor-pointer"
                              >
                                {guest.guest_displayname || guest.guest}
                                {guest.guest_instrument && ` (${guest.guest_instrument})`}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-fifth/60 text-sm">
                    {guestSearchTerm ? 'No guests found matching your search' : 'No guests available'}
                  </p>
                )}
                
                {selectedGuestIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-secondary/10">
                    <p className="text-sm text-fifth">Selected guests: {selectedGuestIds.length}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Coach's Notes */}
          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-medium text-fifth">Coach's Notes</label>
            <textarea
              name="entry_coachnotes"
              value={editedEntry?.entry_coachnotes || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              rows={4}
              className={`w-full font-light px-2 py-2 rounded-md border ${isEditing || isNewEntry ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-medium text-fifth">New Song?</label>
            <select
              name="new_song_option"
              value={selectedNewSongOption}
              onChange={(e) => setSelectedNewSongOption(e.target.value)}
              disabled={!isEditing && !isNewEntry}
              className={`w-full font-light px-2 py-2 rounded-md border ${
                isEditing || isNewEntry ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'
              } text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
            >
              <option value="N/A">N/A</option>
              <option value="New Original Song">New Original Song</option>
              <option value="New Cover Song">New Cover Song</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetlistEntryModal;