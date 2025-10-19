import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SetlistEntryData, GuestCategory } from '../types/setlist';

export const useSetlistEntryForm = (entry: SetlistEntryData | null, isNewEntry: boolean) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState<SetlistEntryData | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);
  const [selectedSongName, setSelectedSongName] = useState('');
  const [selectedNewSongOption, setSelectedNewSongOption] = useState<string>("N/A");

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

  // Update local state when entry changes
  useEffect(() => {
    if (entry) {
      if (isNewEntry) {
        // For new entries, set default placement based on set value
        const defaultPlacement = getDefaultPlacement(entry.entry_set || "");
        
        const entryWithDefaults: SetlistEntryData = {
          ...entry,
          entry_set: entry.entry_set || "--",
          entry_setnum: typeof entry.entry_setnum === 'string' ? parseInt(entry.entry_setnum) || 0 : entry.entry_setnum || 0,
          entry_song: entry.entry_song || "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedEntry) return;
    
    const { name, value } = e.target;
    
    // If Set changes and this is a new entry or user hasn't manually changed placement,
    // auto-update placement
    if (name === 'entry_set' && isNewEntry) {
      const defaultPlacement = getDefaultPlacement(value);
      setEditedEntry({
        ...editedEntry,
        [name]: value === "--" ? null : value,
        entry_placement: defaultPlacement // Auto-update placement when set changes
      });
    } else {
      let updatedValue: any = value;
      
      if (value === "--") {
        updatedValue = name === "entry_setnum" ? 0 : null;
      } else if (name === 'entry_setnum' || name === 'entry_setorder') {
        updatedValue = value === '' ? 0 : parseInt(value) || 0;
      }
      
      setEditedEntry({
        ...editedEntry,
        [name]: updatedValue,
      });
    }
  };

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

  const handleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prevSelected => {
      if (prevSelected.includes(guestId)) {
        return prevSelected.filter(id => id !== guestId);
      } else {
        return [...prevSelected, guestId];
      }
    });
  };

  const handleSelectAllGooseMembers = (allGuests: GuestCategory[]) => {
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

  return {
    isEditing,
    setIsEditing,
    editedEntry,
    setEditedEntry,
    selectedGuestIds,
    setSelectedGuestIds,
    songSearchTerm,
    setSongSearchTerm,
    isSongDropdownOpen,
    setIsSongDropdownOpen,
    selectedSongName,
    setSelectedSongName,
    selectedNewSongOption,
    setSelectedNewSongOption,
    handleInputChange,
    handleSongSelection,
    handleGuestSelection,
    handleSelectAllGooseMembers,
    getDefaultPlacement
  };
};
