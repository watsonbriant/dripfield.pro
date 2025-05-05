import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, X, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';

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
  isNewEntry?: boolean;
}

const SetlistEntryModal: React.FC<SetlistEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  entry, 
  onSave,
  isNewEntry = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedEntry, setEditedEntry] = useState<SetlistEntryData | null>(null);
  
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


  const [selectedNewSongOption, setSelectedNewSongOption] = useState<string>("N/A");

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

        // Fetch songs
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('song, song_id')
          .order('song');
        
        if (songsError) throw songsError;
        setSongs(songsData || []);

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
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  // Update local state when entry changes
  useEffect(() => {
    if (entry) {
      // For new entries, ensure defaults are set properly
      if (isNewEntry) {
        // Create a copy of entry with default values for dropdowns
        const entryWithDefaults = {
          ...entry,
          entry_set: entry.entry_set || "--",
          entry_setnum: entry.entry_setnum || "--",
          entry_song: entry.entry_song || null,
          entry_short: entry.entry_short || null,
          entry_segue: entry.entry_segue || null,
          entry_placement: entry.entry_placement || null,
          entry_new: entry.entry_new || "FALSE" // Add default for entry_new
        };
        
        setEditedEntry(entryWithDefaults);
        // For new entries, default to N/A
        setSelectedNewSongOption("N/A");
      } else {
        setEditedEntry(entry);
        
        // For existing entries, set the dropdown value based on the database value
        if (entry.entry_new === "New Original Song") {
          setSelectedNewSongOption("New Original Song");
        } else if (entry.entry_new === "New Cover Song") {
          setSelectedNewSongOption("New Cover Song");
        } else {
          // If it's FALSE or null or undefined, set to N/A
          setSelectedNewSongOption("N/A");
        }
      }
      
      setIsEditing(isNewEntry); // Auto-enable editing mode for new entries
      
      // Only fetch guests for existing entries
      if (!isNewEntry && entry.entry_id) {
        fetchEntryGuests(entry.entry_id);
      } else {
        // Clear selected guests for new entries
        setSelectedGuestIds([]);
      }
    }
  }, [entry, isNewEntry]);
  
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
      console.error('Error fetching entry guests:', error);
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
  
  // State for delete confirmation
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedEntry) return;
    
    const { name, value } = e.target;
    
    // Handle special cases like numbers and "--" option for dropdowns
    let updatedValue: string | number | null = value;
    
    if (value === "--") {
      updatedValue = name === "entry_setnum" ? "--" : null;  // Keep "--" string for entry_setnum
    } else if (name === 'entry_setnum' || name === 'entry_setorder') {
      updatedValue = value === '' ? null : parseInt(value) || 0;
    }
    
    setEditedEntry({
      ...editedEntry,
      [name]: updatedValue,
    });
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
            // If we hit a unique constraint error, just log and continue
            if (insertError.code === '23505') { // PostgreSQL unique violation code
              console.warn(`Skipping duplicate guest association: ${association.guest_id}`);
            } else {
              throw insertError;
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error saving guest associations:', error);
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    if (!editedEntry) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if required fields are filled for new entries
      if (isNewEntry) {
        if (!editedEntry.entry_set || !editedEntry.entry_song) {
          alert('Please fill in all required fields (Set and Song are required)');
          setIsSubmitting(false);
          return;
        }
      }
  
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
        entry_new: selectedNewSongOption === "N/A" ? "FALSE" : selectedNewSongOption // Add this line
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
          entry_new: entryToSave.entry_new // Add this line
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
          console.error('Error creating setlist entry:', error);
          alert(`Error creating entry: ${error.message}`);
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
            entry_new: entryToSave.entry_new // Add this line
          })
          .eq('entry_id', entryToSave.entry_id);
        
        if (error) {
          console.error('Error updating setlist entry:', error);
          alert(`Error updating entry: ${error.message}`);
          throw error;
        }
        
        // Save guest associations
        await saveGuestAssociations(entryToSave.entry_id);
      }
      
      setIsEditing(false);
      onSave(); // Trigger refetch of entries
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error('Error saving setlist entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#172330] border border-white/10 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl text-white font-semibold">
            {isNewEntry ? 'Add Setlist Entry' : 'Edit Setlist Entry'}
          </h3>
          <div className="flex gap-2">
            {!isNewEntry && (
              <>
                <button
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-10 h-10 rounded-md bg-tertiary text-white hover:bg-tertiary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                        // Second click - proceed with deletion
                        setIsSubmitting(true);
                        
                        supabase
                          .from('setlist_entries')
                          .delete()
                          .eq('entry_id', entry.entry_id)
                          .then(({ error }) => {
                            if (error) {
                              console.error('Error deleting setlist entry:', error);
                              alert(`Error deleting entry: ${error.message}`);
                            } else {
                              onSave(); // Trigger refetch of entries
                              onClose(); // Close modal after successful deletion
                            }
                          })
                          .catch(error => {
                            console.error('Error during deletion:', error);
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
                    className={`flex items-center justify-center w-10 h-10 rounded-md ${
                      isDeleteConfirming 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-tertiary text-white hover:bg-tertiary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isSubmitting && <span className="ml-1">...</span>}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Set */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Set</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_set"
                value={editedEntry?.entry_set === null ? "--" : editedEntry?.entry_set || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>
          
          {/* Set Number */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Set Number</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_setnum"
                value={editedEntry?.entry_setnum === null ? "--" : editedEntry?.entry_setnum?.toString() || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>

          {/* Placement */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Placement</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_placement"
                value={editedEntry?.entry_placement === null ? "--" : editedEntry?.entry_placement || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>
          
          {/* Song */}
          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-semibold text-white">Song</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_song"
                value={editedEntry?.entry_song === null ? "--" : editedEntry?.entry_song || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                required
              >
                <option value="--">--</option>
                {songs.map((song) => (
                  <option key={song.song_id} value={song.song}>
                    {song.song}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedEntry?.entry_song || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>
          
          {/* Short */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Short</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_short"
                value={editedEntry?.entry_short === null ? "--" : editedEntry?.entry_short || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>
          
          {/* Segue */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Segue</label>
            {isEditing || isNewEntry ? (
              <select
                name="entry_segue"
                value={editedEntry?.entry_segue === null ? "--" : editedEntry?.entry_segue || "--"}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
                className="w-full px-2 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            )}
          </div>
          
          {/* Length */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Length (hh:mm:ss)</label>
            <input
              type="text"
              name="entry_length"
              value={editedEntry?.entry_length || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              placeholder="00:00:00"
              className={`w-full px-2 py-2 rounded-md border ${isEditing || isNewEntry ? 'border-tertiary bg-white/10' : 'border-white/10 bg-white/5'} text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
            />
          </div>
          
          {/* Guests Section */}
          <div className="space-y-2 md:col-span-6 mt-2">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-semibold text-white">Guests</label>
                  {/* Move button next to the heading, only show when editing or new entry */}
                  {(isEditing || isNewEntry) && (
                    <button
                      onClick={handleSelectAllGooseMembers}
                      className="px-2 py-1 rounded-md bg-tertiary text-white hover:bg-tertiary/90 transition-colors text-xs font-semibold"
                    >
                      Select All Goose Members
                    </button>
                  )}
                </div>
                <button 
                  className="text-gray-300 hover:text-white cursor-pointer"
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
                        className="bg-tertiary text-white text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        <span>{guestInfo.guest_displayname || guestInfo.guest}</span>
                        {(isEditing || isNewEntry) && (
                          <button 
                            className="ml-1 text-white/70 hover:text-white"
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
              <div className={`border rounded-md p-3 ${isEditing || isNewEntry ? 'border-tertiary bg-white/5' : 'border-white/10 bg-white/5'}`}>
                {allGuests.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {allGuests.map(category => (
                      <div key={category.category} className="mb-4">
                        <h4 className="text-sm font-medium text-white mb-2">{category.category}</h4>
                        <div className="space-y-2">
                          {category.guests.map(guest => (
                            <div key={guest.guest_id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`guest-${guest.guest_id}`}
                                checked={selectedGuestIds.includes(guest.guest_id)}
                                onChange={() => handleGuestSelection(guest.guest_id)}
                                disabled={!isEditing && !isNewEntry}
                                className="mr-2 h-4 w-4 rounded border-white/30 bg-white/5 checked:bg-tertiary focus:ring-tertiary disabled:opacity-50"
                              />
                              <label 
                                htmlFor={`guest-${guest.guest_id}`} 
                                className="text-[#fce7ca] text-sm cursor-pointer"
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
                  <p className="text-gray-400 text-sm">No guests available</p>
                )}
                
                {selectedGuestIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-white">Selected guests: {selectedGuestIds.length}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Coach's Notes */}
          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-semibold text-white">Coach's Notes</label>
            <textarea
              name="entry_coachnotes"
              value={editedEntry?.entry_coachnotes || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              rows={4}
              className={`w-full px-2 py-2 rounded-md border ${isEditing || isNewEntry ? 'border-tertiary bg-white/10' : 'border-white/10 bg-white/5'} text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <label className="block text-sm font-semibold text-white">New Song?</label>
            <select
              name="new_song_option"
              value={selectedNewSongOption}
              onChange={(e) => setSelectedNewSongOption(e.target.value)}
              disabled={!isEditing && !isNewEntry}
              className={`w-full px-2 py-2 rounded-md border ${
                isEditing || isNewEntry ? 'border-tertiary bg-white/10' : 'border-white/10 bg-white/5'
              } text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
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