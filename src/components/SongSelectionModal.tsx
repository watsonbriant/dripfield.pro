import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SongSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    show_id: string;
    show_date: string;
    show_subvenue: string;
    show_detail: string;
    show_venue_location: string;
    show_time: string;
    show_tour: string;
    show_scored?: boolean;
    timeRemaining?: string;
    isSelectionClosed?: boolean;
    submission_id?: string;
  };
  existingPicks?: Array<{
    song: string;
    set: string;
    setnum: number;
    placement?: string;
    score?: number;
    result?: string;
  }>;
  isEditing?: boolean;
  viewMode?: boolean;
  submissionDetails?: {
    totalScore: number;
    songsPicked: number;
    songsPlayed: number;
    setlist: Array<{
      entry_song: string;
      entry_set: string;
      entry_setnum: number;
      entry_placement: string;
    }>;
    username?: string;
  };
}

interface Song {
  song: string;
  song_id: string;
  category_type?: string;
}

interface SetlistEntry {
  entry_id: string;
  entry_song: string;
  entry_set: string;
  entry_setnum: number;
  entry_placement?: string;
  entry_segue?: string;
  entry_length?: string;
}

interface SongPick {
  id: string; // Unique ID for tracking
  song: string;
  set: string;
  setnum: number;
  placement?: string;
  isBreak?: boolean;
  score?: number;
  result?: string;
}

const cleanSongName = (songName: string): string => {
  return songName
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/∆/g, 'a');
};

// Component for the song selection modal
export function SongSelectionModal({ 
  isOpen, 
  onClose, 
  show, 
  existingPicks = [], 
  isEditing = false,
  viewMode = false,
  submissionDetails
}: SongSelectionModalProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [songPicks, setSongPicks] = useState<SongPick[]>([]);
  const [currentSet, setCurrentSet] = useState<string>('1');
  const [nextSetNum, setNextSetNum] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { user } = useAuth();
  const [showInfo, setShowInfo] = useState({
    ...show,
    timeRemaining: show.timeRemaining || '',
    isSelectionClosed: show.isSelectionClosed || false
  });

  const [rawPointsTotal, setRawPointsTotal] = useState<number>(0);
  const [actualSetlist, setActualSetlist] = useState<SetlistEntry[]>([]);
  const [showActualSetlist, setShowActualSetlist] = useState(false);
  


  // Function to calculate time remaining that can be called repeatedly
  const calculateTimeRemaining = useCallback((showTime: string): { 
    timeRemaining: string; 
    isSelectionClosed: boolean;
  } => {
    const now = new Date();
    const showDateTime = new Date(showTime);
    const oneHourBefore = new Date(showDateTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    
    const isSelectionClosed = now >= oneHourBefore;
    
    // Calculate time remaining
    let timeRemaining = '';
    if (!isSelectionClosed) {
      const timeDiff = oneHourBefore.getTime() - now.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        timeRemaining = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = `${minutes}m`;
      }
    }
    
    return { timeRemaining, isSelectionClosed };
  }, []);

  // Add this useEffect specifically for view mode
  useEffect(() => {
    if (viewMode && existingPicks && existingPicks.length > 0) {
      
      // Check if any picks have showcloser_correct flag
      // const hasShowCloser = existingPicks.some(pick => (pick as any).showcloser_correct);
      
      // Get unique sets from existing picks, sorted in correct order
      const uniqueSets = [...new Set(existingPicks.map(pick => pick.set))].sort((a, b) => {
        // Sort by set number, handling E prefixes for encores
        const aIsEncore = a.startsWith('E');
        const bIsEncore = b.startsWith('E');
        
        // If both are encores or both are not, sort normally
        if (aIsEncore === bIsEncore) {
          const aNum = aIsEncore ? parseInt(a.substring(1)) : parseInt(a);
          const bNum = bIsEncore ? parseInt(b.substring(1)) : parseInt(b);
          return aNum - bNum;
        }
        
        // If only one is an encore, the encore comes after regular sets
        return aIsEncore ? 1 : -1;
      });
      
      // Generate break markers
      const breaks: SongPick[] = uniqueSets.map(set => ({
        id: generatePickId(),
        song: `--- ${getSetDisplayName(set)} ---`, 
        set: set, 
        setnum: 0, 
        isBreak: true
      }));
      
      // Convert existing picks to SongPick format
      const picksWithIds: SongPick[] = existingPicks.map(pick => ({
        id: generatePickId(),
        song: pick.song,
        set: pick.set,
        setnum: pick.setnum,
        placement: pick.placement,
        score: pick.score,
        result: pick.result,
        showcloser_correct: (pick as any).showcloser_correct,  // Ensure this property is copied over
        showopener_correct: (pick as any).showopener_correct
      }));
      
      // Combine breaks and picks
      const allPicks = [...breaks, ...picksWithIds];
      
      // Update state
      setSongPicks(allPicks);

      // Calculate raw points total (sum of all non-null scores)
      if (viewMode && show.show_scored) {
        const totalRawPoints = existingPicks.reduce((total, pick) => {
          return total + (pick.score || 0);
        }, 0);
        setRawPointsTotal(totalRawPoints);
      }
    }
  }, [viewMode, existingPicks, show.show_scored]);

  // Add this useEffect to fetch the actual setlist when in view mode for a scored show
  useEffect(() => {
    async function fetchActualSetlist() {
      if (!show.show_id || !viewMode || !show.show_scored) return;
      
      try {
        // setLoadingSetlist(true);
        
        const { data, error } = await supabase
          .from('setlist_entries')
          .select('entry_id, entry_song, entry_set, entry_setnum, entry_placement, entry_segue, entry_length')
          .eq('entry_show', show.show_id)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true });
        
        if (error) {
          console.error('Error fetching actual setlist:', error);
          return;
        }
        
        if (data) {
          setActualSetlist(data);
        }
      } catch (err) {
        console.error('Error in fetch setlist:', err);
      } finally {
        // setLoadingSetlist(false);
      }
    }
    
    fetchActualSetlist();
  }, [show.show_id, viewMode, show.show_scored]);

  // Set up live updating timer
  useEffect(() => {
    // Skip if no show data
    if (!show || !show.show_time) return;
    
    const updateTimeRemaining = () => {
      const { timeRemaining, isSelectionClosed } = calculateTimeRemaining(show.show_time);
      
      // Update the show object with new remaining time
      setShowInfo(prev => ({
        ...prev,
        timeRemaining,
        isSelectionClosed
      }));
    };
    
    // Update immediately, then set interval
    updateTimeRemaining();
    const intervalId = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [show?.show_time, calculateTimeRemaining]);

  // Load existing picks if in edit mode
  useEffect(() => {
    if (isEditing && existingPicks && existingPicks.length > 0) {
      // Get unique sets from existing picks, sorted in correct order
      const uniqueSets = [...new Set(existingPicks.map(pick => pick.set))].sort((a, b) => {
        // Sort by set number, handling E prefixes for encores
        const aIsEncore = a.startsWith('E');
        const bIsEncore = b.startsWith('E');
        
        // If both are encores or both are not, sort normally
        if (aIsEncore === bIsEncore) {
          const aNum = aIsEncore ? parseInt(a.substring(1)) : parseInt(a);
          const bNum = bIsEncore ? parseInt(b.substring(1)) : parseInt(b);
          return aNum - bNum;
        }
        
        // If only one is an encore, the encore comes after regular sets
        return aIsEncore ? 1 : -1;
      });
      
      // Generate break markers
      const breaks: SongPick[] = uniqueSets.map(set => ({
        id: generatePickId(),
        song: `--- ${getSetDisplayName(set)} ---`, 
        set: set, 
        setnum: 0, 
        isBreak: true
      }));
      
      // Convert existing picks to SongPick format
      const picksWithIds: SongPick[] = existingPicks.map(pick => ({
        id: generatePickId(),
        song: pick.song,
        set: pick.set,
        setnum: pick.setnum,
        placement: pick.placement
      }));
      
      // Calculate next set number based on the highest setnum in existing picks + 1
      const highestSetNum = Math.max(...existingPicks.map(pick => pick.setnum), 0);
      setNextSetNum(highestSetNum + 1);
      
      // Combine breaks and picks
      const allPicks = [...breaks, ...picksWithIds];
      
      // Set current set to the last set
      if (uniqueSets.length > 0) {
        setCurrentSet(uniqueSets[uniqueSets.length - 1]);
      }
      
      // Update state
      setSongPicks(allPicks);
    }
  }, [isEditing, existingPicks]);

  // Check if we've reached max sets
  const canAddSetBreak = () => {
    const currentSets = [...new Set(
      songPicks
        .filter(pick => !pick.set.startsWith('E'))
        .map(pick => parseInt(pick.set))
    )];
    
    const sortedSets = currentSets.sort((a, b) => a - b);
    const highestSet = sortedSets.length > 0 ? sortedSets[sortedSets.length - 1] : 0;
    
    return highestSet < 5;
  };

  // Check if we've reached max encores
  const canAddEncoreBreak = () => {
    const currentEncores = [...new Set(
      songPicks
        .filter(pick => pick.set.startsWith('E'))
        .map(pick => parseInt(pick.set.substring(1)))
    )];
    
    const sortedEncores = currentEncores.sort((a, b) => a - b);
    const highestEncore = sortedEncores.length > 0 ? sortedEncores[sortedEncores.length - 1] : 0;
    
    return highestEncore < 3;
  };
  
  // Helper function to get unique sets from actual setlist

  // Toggle switch component for mobile view
  const ToggleSwitch = () => {
    return (
      <div className="flex items-center justify-center my-3">
        <div className="inline-flex border border-secondary rounded-lg overflow-hidden">
          <span 
            className={`px-4 py-1.5 transition-colors font-semibold hover:bg-tertiary/40 text-base ${!showActualSetlist ? 'bg-tertiary text-fifth' : 'bg-canvas text-fifth'}`}
            onClick={() => setShowActualSetlist(false)}
          >
            My Picks
          </span>
          <span 
            className={`px-4 py-1.5 transition-colors font-semibold hover:bg-tertiary/40 text-base ${showActualSetlist ? 'bg-tertiary text-fifth' : 'bg-canvas text-fifth'}`}
            onClick={() => setShowActualSetlist(true)}
          >
            Actual Setlist
          </span>
        </div>
      </div>
    );
  };

  // Function to get a combined array of all sets from both user picks and actual setlist

  
  // Get songs for a specific set from actual setlist
  const getSongsForActualSet = (set: string): SetlistEntry[] => {
    return actualSetlist
      .filter(entry => entry.entry_set === set)
      .sort((a, b) => a.entry_setnum - b.entry_setnum);
  };

  // Get the placement for a song based on its position within its set
  const getPlacement = (set: string, songs: SongPick[], currentSong: SongPick): string => {
    // Sort the songs in this set by setnum
    const sortedSongs = [...songs].sort((a, b) => a.setnum - b.setnum);
    
    // If this is an encore set, return the encore designation
    if (set.startsWith('E')) {
      return `Encore ${set.substring(1)}`;
    }
    
    // Find the index of the current song in the sorted array
    const songIndex = sortedSongs.findIndex(s => s.id === currentSong.id);
    
    // If only one song in the set, it's the opener
    if (sortedSongs.length === 1) {
      return `Set ${set} Opener`;
    }
    
    // First song is opener
    if (songIndex === 0) {
      return `Set ${set} Opener`;
    }
    
    // Last song is closer
    if (songIndex === sortedSongs.length - 1) {
      return `Set ${set} Closer`;
    }
    
    // Regular song in the middle gets "Main Set X" designation
    return `Main Set ${set}`;
  };

  // Helper to get a set's display name
  const getSetDisplayName = (set: string): string => {
    if (set === 'E1') return 'Encore';
    if (set === 'E2') return '2nd Encore';
    if (set === 'E3') return '3rd Encore';
    return `Set ${set}`;
  };

  // Get unique sets that have picks
  const getUniqueSets = (): string[] => {
    const setsWithPicks = new Set(songPicks.map(pick => pick.set));
    
    // Order them correctly (numeric sets first, then encore sets)
    const numericSets = Array.from(setsWithPicks)
      .filter(set => !set.startsWith('E'))
      .sort((a, b) => parseInt(a) - parseInt(b));
      
    const encoreSets = Array.from(setsWithPicks)
      .filter(set => set.startsWith('E'))
      .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
      
    return [...numericSets, ...encoreSets];
  };
  
  // Get songs for a specific set
  const getSongsForSet = (set: string): SongPick[] => {
    return songPicks
      .filter(pick => pick.set === set && !pick.isBreak)
      .sort((a, b) => a.setnum - b.setnum); // Ensure they're ordered by setnum
  };

  // Generate a unique ID for new picks
  const generatePickId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Get placement color based on placement type (matching FullSetlistDisplay)
  const getPlacementColor = (placement: string | undefined): string => {
    if (!placement) return 'transparent';
    
    const colorMap: { [key: string]: string } = {
      'Set 1 Opener': '#047857',
      'Set 1 Closer': '#1e40af',
      'Set 2 Opener': '#10b981',
      'Set 3 Opener': '#10b981',
      'Set 4 Opener': '#10b981',
      'Set 5 Opener': '#10b981',
      'Set 2 Closer': '#3b82f6',
      'Set 3 Closer': '#3b82f6',
      'Set 4 Closer': '#3b82f6',
      'Set 5 Closer': '#3b82f6',
      'Encore 1': '#be123c',
      'Encore 2': '#f43f5e',
      'Encore 3': '#f43f5e'
    };
    
    return colorMap[placement] || '#000000';
  };

  // Update placements for all songs to ensure correct labeling
  const updatePlacements = () => {
    // Keep track of whether we actually made changes
    let madeChanges = false;
    
    setSongPicks(prevPicks => {
      // Group songs by set (excluding break markers)
      const setGroups: Record<string, SongPick[]> = {};
      
      const realSongs = prevPicks.filter(pick => !pick.isBreak);
      
      realSongs.forEach(pick => {
        if (!setGroups[pick.set]) {
          setGroups[pick.set] = [];
        }
        
        setGroups[pick.set].push(pick);
      });
      
      // Create a new array with updated placements
      const updatedPicks = [...prevPicks];
      
      // Update placements for each song
      for (const setId in setGroups) {
        const setGroup = setGroups[setId];
        
        // Sort songs by setnum for this set
        const sortedSetGroup = [...setGroup].sort((a, b) => a.setnum - b.setnum);
        
        // Update each song in the set
        sortedSetGroup.forEach((song) => {
          // Determine placement based on position
          const oldPlacement = song.placement;
          const placement = getPlacement(setId, sortedSetGroup, song);
          
          // Only update if the placement actually changed
          if (oldPlacement !== placement) {
            madeChanges = true;
            
            // Find and update the song in our picks array
            const songIndex = updatedPicks.findIndex(p => p.id === song.id);
            if (songIndex >= 0) {
              updatedPicks[songIndex] = {
                ...updatedPicks[songIndex],
                placement
              };
            }
          }
        });
      }
      
      // Only return a new array if we actually made changes
      // This prevents unnecessary re-renders
      return madeChanges ? updatedPicks : prevPicks;
    });
  };

  // Helper function to renumber all songs with sequential numbers
  const renumberSongPicks = () => {
    setSongPicks(prevPicks => {
      // Group songs by set
      const setGroups: Record<string, SongPick[]> = {};
      
      // Get real songs (non-break markers)
      const realSongs = prevPicks.filter(pick => !pick.isBreak);
      
      // Group songs by set
      realSongs.forEach(pick => {
        if (!setGroups[pick.set]) {
          setGroups[pick.set] = [];
        }
        setGroups[pick.set].push(pick);
      });
      
      // For each set, sort and renumber songs
      const updatedPicks = [...prevPicks];
      
      // Process sets in order (numeric sets first, then encore sets)
      const orderedSets = getUniqueSets();
      
      // Track the highest overall setnum to update nextSetNum
      let highestSetnum = 0;
      
      orderedSets.forEach(setId => {
        if (!setGroups[setId]) return;
        
        // Sort songs in this set by their current setnum
        const sortedSongs = [...setGroups[setId]].sort((a, b) => a.setnum - b.setnum);
        
        // Renumber each song starting from 1 for each set
        let setCounter = 1;
        
        sortedSongs.forEach((song) => {
          const songIndex = updatedPicks.findIndex(p => p.id === song.id);
          if (songIndex >= 0) {
            updatedPicks[songIndex] = {
              ...updatedPicks[songIndex],
              setnum: setCounter++
            };
            
            // Track highest overall setnum to update nextSetNum
            highestSetnum = Math.max(highestSetnum, setCounter - 1);
          }
        });
      });
      
      // Update nextSetNum to be one more than the highest setnum
      // This ensures new songs added to any set get unique numbers
      setTimeout(() => setNextSetNum(highestSetnum + 1), 10);
      
      // Update placements after renumbering
      setTimeout(() => updatePlacements(), 10);
      
      return updatedPicks;
    });
  };

  // Run updatePlacements whenever song picks array changes
  // Use a ref to track when updates are in progress to prevent infinite loops
  const isUpdatingRef = useRef(false);
  
  useEffect(() => {
    if (songPicks.length > 0 && !isUpdatingRef.current) {
      // Set flag to prevent re-entry
      isUpdatingRef.current = true;
      
      // Use setTimeout to ensure we're outside the current render cycle
      setTimeout(() => {
        updatePlacements();
        // Reset flag after update is complete
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }, 0);
    }
  }, [songPicks]);

  // Fetch songs from "Goose" or "Cover Songs" categories with pagination
  useEffect(() => {
    async function fetchSongs() {
      try {
        setLoading(true);
        
        // Paginate through all songs
        let allSongs: any[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('songs')
            .select(`
              song, 
              song_id,
              song_category,
              categories!inner(
                category,
                category_type
              )
            `)
            .in('categories.category_type', ['Goose', 'Cover Songs'])
            .order('song')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allSongs = [...allSongs, ...data];
            page++;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        // Group songs by category type
        const gooseSongs: Song[] = [];
        const coverSongs: Song[] = [];
        
        allSongs.forEach(item => {
          const songData = {
            song: item.song,
            song_id: item.song_id,
            category_type: item.categories?.category_type
          };
          
          if (item.categories?.category_type === 'Goose') {
            gooseSongs.push(songData);
          } else if (item.categories?.category_type === 'Cover Songs') {
            coverSongs.push(songData);
          }
        });
        
        // Combine arrays with Goose songs first
        const songsData = [...gooseSongs, ...coverSongs];
        setSongs(songsData);
      } catch (error) {
        console.error('Error fetching songs:', error);
        setError('Failed to load songs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen) {
      fetchSongs();
    }
  }, [isOpen]);

    // Handle adding a song to the picks
    const handleAddSong = () => {
      if (!selectedSong) {
        setError('Please select a song first');
        return;
      }
      
      // Only check for duplicates if it's a regular song (not a New Original/Cover Song)
      if (selectedSong !== "[New Original Song]" && selectedSong !== "[New Cover Song]") {
        // Check if the song is already selected in ANY set (not just current set)
        if (songPicks.some(pick => pick.song === selectedSong && !pick.isBreak)) {
          setError('This song is already selected for this show.');
          return;
        }
      }
      
      setError(null);
      
      // Add new song with sequential numbering
      const newPick: SongPick = {
        id: generatePickId(),
        song: selectedSong,
        set: currentSet,
        setnum: nextSetNum
      };
      
      setSongPicks([...songPicks, newPick]);
      setNextSetNum(nextSetNum + 1);
      setSelectedSong('');
    };
    
    // Handle adding a new original song - remove the duplicate check
    const handleAddNewOriginalSong = () => {
      setError(null);
      
      // Add new original song with sequential numbering
      const newPick: SongPick = {
        id: generatePickId(),
        song: "[New Original Song]",
        set: currentSet,
        setnum: nextSetNum
      };
      
      setSongPicks([...songPicks, newPick]);
      setNextSetNum(nextSetNum + 1);
    };
    
    // Handle adding a new cover song - remove the duplicate check
    const handleAddNewCoverSong = () => {
      setError(null);
      
      // Add new cover song with sequential numbering
      const newPick: SongPick = {
        id: generatePickId(),
        song: "[New Cover Song]",
        set: currentSet,
        setnum: nextSetNum
      };
      
      setSongPicks([...songPicks, newPick]);
      setNextSetNum(nextSetNum + 1);
    };

  // Handle adding a set break
  const handleAddSetBreak = () => {
    // Find current highest set number
    const currentSets = songPicks
      .filter(pick => !pick.set.startsWith('E'))
      .map(pick => parseInt(pick.set));
    
    const highestSet = currentSets.length > 0 ? Math.max(...currentSets) : 0;
    
    if (highestSet >= 5) {
      setError('Maximum of 5 sets allowed');
      return;
    }
    
    const nextSet = (highestSet + 1).toString();
    
    // Add set break marker
    setSongPicks([...songPicks, { 
      id: generatePickId(),
      song: `--- Set ${nextSet} ---`, 
      set: nextSet, 
      setnum: 0, 
      isBreak: true 
    }]);
    
    // Update current set
    setCurrentSet(nextSet);
    setNextSetNum(nextSetNum);
    setError(null);
  };

  // Handle adding an encore break
  const handleAddEncoreBreak = () => {
    // Find current highest encore number
    const currentEncores = songPicks
      .filter(pick => pick.set.startsWith('E'))
      .map(pick => parseInt(pick.set.substring(1)));
    
    const highestEncore = currentEncores.length > 0 ? Math.max(...currentEncores) : 0;
    
    if (highestEncore >= 3) {
      setError('Maximum of 3 encores allowed');
      return;
    }
    
    const nextEncore = `E${highestEncore + 1}`;
    
    // Add encore break marker
    setSongPicks([...songPicks, { 
      id: generatePickId(),
      song: `--- ${getSetDisplayName(nextEncore)} ---`, 
      set: nextEncore, 
      setnum: 0, 
      isBreak: true 
    }]);
    
    // Update current set
    setCurrentSet(nextEncore);
    setNextSetNum(nextSetNum);
    setError(null);
  };

  // Handle removing a song from the picks
  const handleRemoveSong = (index: number) => {
    if (index < 0 || index >= songPicks.length) return;
    
    const removedPick = songPicks[index];
    
    // If we're removing a break, we need to recalculate set numbers
    if (removedPick.isBreak) {
      // Check if this is a set break or encore break
      const setToRemove = removedPick.set;
      
      // Create a new array without the break marker and update state
      setSongPicks(prevPicks => {
        const filteredPicks = prevPicks.filter((_, i) => i !== index);
        
        // Immediately call handleRemoveSet after updating state
        setTimeout(() => handleRemoveSet(setToRemove), 50);
        
        return filteredPicks;
      });
      
      return;
    }
    
    // For regular songs, just remove it and update
    setSongPicks(prevPicks => {
      const newPicks = [...prevPicks];
      newPicks.splice(index, 1);
      
      // Renumber songs after removing one
      setTimeout(() => renumberSongPicks(), 50);
      
      return newPicks;
    });
  };

  // Remove a set and ensure sequential numbering
  const handleRemoveSet = (setToRemove: string) => {
    // Use a functional state update to ensure we're working with the latest state
    setSongPicks(prevPicks => {
      // Check if it's a regular set or encore
      const isEncore = setToRemove.startsWith('E');
      
      // Get all sets of this type (regular or encore)
      const allSetsOfType = prevPicks
        .filter(pick => isEncore ? pick.set.startsWith('E') : !pick.set.startsWith('E'))
        .map(pick => pick.set);
      
      const uniqueSets = [...new Set(allSetsOfType)]
        .sort((a, b) => {
          if (isEncore) {
            return parseInt(a.substring(1)) - parseInt(b.substring(1));
          }
          return parseInt(a) - parseInt(b);
        });
      
      // Find the index of the set to remove
      const setIndex = uniqueSets.indexOf(setToRemove);
      if (setIndex === -1) return prevPicks; // No changes if set not found
      
      // Create a mapping for set renumbering
      const setMapping: Record<string, string> = {};
      
      // Remove the set and its songs
      const newPicks = prevPicks.filter(pick => pick.set !== setToRemove);
      
      // Renumber subsequent sets to ensure sequential ordering
      if (setIndex < uniqueSets.length - 1) {
        for (let i = setIndex + 1; i < uniqueSets.length; i++) {
          const oldSet = uniqueSets[i];
          const newSetNum = isEncore 
            ? `E${i}` // Encores become E1, E2, E3
            : `${i}`; // Regular sets become 1, 2, 3, 4, 5
          
          setMapping[oldSet] = newSetNum;
        }
        
        // Apply the mapping to renumber sets
        const updatedPicks = newPicks.map(pick => {
          if (setMapping[pick.set]) {
            return {
              ...pick,
              set: setMapping[pick.set],
              song: pick.isBreak 
                ? `--- ${getSetDisplayName(setMapping[pick.set])} ---` 
                : pick.song
            };
          }
          return pick;
        });
        
        // Update current set if needed (in a separate useEffect)
        if (currentSet === setToRemove) {
          const newSets = updatedPicks
            .filter(pick => !pick.isBreak)
            .map(pick => pick.set);
          
          if (newSets.length > 0) {
            const lastSet = [...new Set(newSets)].sort().pop() || '1';
            setTimeout(() => setCurrentSet(lastSet), 50);
          } else {
            // If no sets left, reset to set 1
            setTimeout(() => setCurrentSet('1'), 50);
          }
        }
        
        // Renumber all songs after state update
        setTimeout(() => renumberSongPicks(), 50);
        
        return updatedPicks;
      } else {
        // Just remove the set if it's the last one
        // Update current set if needed (in a separate useEffect)
        if (currentSet === setToRemove) {
          const newSets = newPicks
            .filter(pick => !pick.isBreak)
            .map(pick => pick.set);
          
          if (newSets.length > 0) {
            const lastSet = [...new Set(newSets)].sort().pop() || '1';
            setTimeout(() => setCurrentSet(lastSet), 50);
          } else {
            // If no sets left, reset to set 1
            setTimeout(() => setCurrentSet('1'), 50);
          }
        }
        
        // Renumber all songs after state update
        setTimeout(() => renumberSongPicks(), 50);
        
        return newPicks;
      }
    });
  };

  // Helper function to get all sets in correct order
  const getOrderedSets = (picks: SongPick[]): string[] => {
    const setsWithPicks = new Set(picks.map(pick => pick.set));
    
    // Order them correctly (numeric sets first, then encore sets)
    const numericSets = Array.from(setsWithPicks)
      .filter(set => !set.startsWith('E'))
      .sort((a, b) => parseInt(a) - parseInt(b));
      
    const encoreSets = Array.from(setsWithPicks)
      .filter(set => set.startsWith('E'))
      .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
      
    return [...numericSets, ...encoreSets];
  };

  // Improved move song up function
  const moveSongUp = (pickId: string) => {
    setSongPicks(prevPicks => {
      const pickIndex = prevPicks.findIndex(p => p.id === pickId);
      if (pickIndex < 0) return prevPicks;
      
      const pick = prevPicks[pickIndex];
      
      // Get songs in the current set, ordered by setnum
      const currentSetSongs = prevPicks
        .filter(p => p.set === pick.set && !p.isBreak)
        .sort((a, b) => a.setnum - b.setnum);
      
      // Find position of this song within its set
      const positionInSet = currentSetSongs.findIndex(p => p.id === pickId);
      
      // If it's already at the top of set 1, do nothing (can't move up further)
      if (positionInSet === 0 && pick.set === '1') {
        return prevPicks;
      }
      
      // If it's at the top of its set but not set 1, move to previous set
      if (positionInSet === 0) {
        // Get all sets in order
        const orderedSets = getOrderedSets(prevPicks);
        const currentSetIndex = orderedSets.indexOf(pick.set);
        
        if (currentSetIndex > 0) {
          const previousSet = orderedSets[currentSetIndex - 1];
          
          // Get songs in the previous set
          const previousSetSongs = prevPicks
            .filter(p => p.set === previousSet && !p.isBreak)
            .sort((a, b) => a.setnum - b.setnum);
          
          // Create new picks array
          const newPicks = [...prevPicks];
          
          if (previousSetSongs.length > 0) {
            // Get the last song in the previous set
            const lastSongInPrevSet = previousSetSongs[previousSetSongs.length - 1];
            
            // Move the song to the previous set and give it a setnum that's just after the last song
            newPicks[pickIndex] = {
              ...newPicks[pickIndex],
              set: previousSet,
              setnum: lastSongInPrevSet.setnum + 1
            };
          } else {
            // If no songs in previous set, just add it with setnum 1
            newPicks[pickIndex] = {
              ...newPicks[pickIndex],
              set: previousSet,
              setnum: 1
            };
          }
          
          // Update placements after the move
          setTimeout(() => updatePlacements(), 50);
          
          return newPicks;
        }
        
        return prevPicks; // Can't move if there's no previous set
      }
      
      // Regular case: swap with the song above it within the same set
      const newPicks = [...prevPicks];
      const prevSong = currentSetSongs[positionInSet - 1];
      const prevSongIndex = prevPicks.findIndex(p => p.id === prevSong.id);
      
      // Swap set numbers
      const tempSetnum = newPicks[pickIndex].setnum;
      newPicks[pickIndex].setnum = newPicks[prevSongIndex].setnum;
      newPicks[prevSongIndex].setnum = tempSetnum;
      
      // Update placements after the swap
      setTimeout(() => updatePlacements(), 50);
      
      return newPicks;
    });
  };
  
  // Improved move song down function
  const moveSongDown = (pickId: string) => {
    setSongPicks(prevPicks => {
      const pickIndex = prevPicks.findIndex(p => p.id === pickId);
      if (pickIndex < 0) return prevPicks;
      
      const pick = prevPicks[pickIndex];
      
      // Get songs in the current set, ordered by setnum
      const currentSetSongs = prevPicks
        .filter(p => p.set === pick.set && !p.isBreak)
        .sort((a, b) => a.setnum - b.setnum);
      
      // Find position of this song within its set
      const positionInSet = currentSetSongs.findIndex(p => p.id === pickId);
      
      // If it's already at the bottom of its set
      if (positionInSet === currentSetSongs.length - 1) {
        // Get all sets in order
        const orderedSets = getOrderedSets(prevPicks);
        const currentSetIndex = orderedSets.indexOf(pick.set);
        
        // Check if there's a next set
        if (currentSetIndex < orderedSets.length - 1) {
          const nextSet = orderedSets[currentSetIndex + 1];
          
          // Get songs in the next set
          const nextSetSongs = prevPicks
            .filter(p => p.set === nextSet && !p.isBreak)
            .sort((a, b) => a.setnum - b.setnum);
          
          // Create new picks array
          const newPicks = [...prevPicks];
          
          if (nextSetSongs.length > 0) {
            // Get the first song in the next set
            const firstSongInNextSet = nextSetSongs[0];
            
            // Move the song to the next set and give it a setnum that's just before the first song
            const newSetnum = firstSongInNextSet.setnum > 1 ? firstSongInNextSet.setnum - 1 : 0;
            
            newPicks[pickIndex] = {
              ...newPicks[pickIndex],
              set: nextSet,
              setnum: newSetnum
            };
          } else {
            // If no songs in next set, just add it with setnum 1
            newPicks[pickIndex] = {
              ...newPicks[pickIndex],
              set: nextSet,
              setnum: 1
            };
          }
          
          // Update placements after the move
          setTimeout(() => updatePlacements(), 50);
          
          return newPicks;
        }
        
        return prevPicks; // Can't move if there's no next set
      }
      
      // Regular case: swap with the song below it within the same set
      const newPicks = [...prevPicks];
      const nextSong = currentSetSongs[positionInSet + 1];
      const nextSongIndex = prevPicks.findIndex(p => p.id === nextSong.id);
      
      // Swap set numbers
      const tempSetnum = newPicks[pickIndex].setnum;
      newPicks[pickIndex].setnum = newPicks[nextSongIndex].setnum;
      newPicks[nextSongIndex].setnum = tempSetnum;
      
      // Update placements after the swap
      setTimeout(() => updatePlacements(), 50);
      
      return newPicks;
    });
  };

  // Handle submitting the picks
  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to submit picks');
      return;
    }
    
    if (songPicks.length === 0) {
      setError('Please add at least one song');
      return;
    }

    // Force recalculation of the cutoff time
    const { isSelectionClosed } = calculateTimeRemaining(show.show_time);
    if (isSelectionClosed || show.show_scored) {
      setError('Submission period has closed. You can no longer submit picks for this show.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      let submissionId;
      
      // Check if this user already has a submission for this show
      if (!isEditing) {
        // Check if this user already has a submission for this show
        const { data: existingSubmission, error: existingError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id')
          .eq('user_id', user.id)
          .eq('show_id', show.show_id)
          .single();

        if (!existingError && existingSubmission) {
          // If there's already a submission, switch to editing mode
          isEditing = true;
          show.submission_id = existingSubmission.submission_id;
        }
      }
      
      // If editing, update the existing submission and delete only the picks
      if (isEditing && show.submission_id) {
        submissionId = show.submission_id;
        
        try {
          // Delete existing picks but KEEP the submission
          const { error: picksDeleteError } = await supabase
            .from('setlist_game_picks')
            .delete()
            .eq('submission_id', submissionId);
            
          if (picksDeleteError) {
            throw picksDeleteError;
          }
        } catch (deleteError: any) {
          setError(`Error deleting existing picks: ${deleteError.message || 'Unknown error'}`);
          return;
        }
        
        try {
          // Update the existing submission record
          const { error: updateError } = await supabase
            .from('setlist_game_submissions')
            .update({
              total_songs_picked: songPicks.filter(pick => !pick.isBreak).length
            })
            .eq('submission_id', submissionId);
          
          if (updateError) {
            throw updateError;
          }
        } catch (updateError: any) {
          setError(`Error updating submission: ${updateError.message || 'Unknown error'}`);
          return;
        }

      } else {
        try {
          // Create a new submission record
          const { data: submissionData, error: submissionError } = await supabase
            .from('setlist_game_submissions')
            .insert([{
              user_id: user.id,
              show_id: show.show_id,
              tour_id: show.show_tour,
              submission_status: 'open',
              total_songs_picked: songPicks.filter(pick => !pick.isBreak).length
            }])
            .select()
            .single();
          
          if (submissionError) {
            if (submissionError.code === '23505') { // PostgreSQL unique constraint violation
              setError(`You already have picks submitted for this show. Try refreshing the page.`);
            } else {
              setError(`Error creating submission: ${submissionError.message || 'Unknown error'}`);
            }
            return;
          }
          
          submissionId = submissionData.submission_id;
        } catch (insertError: any) {
          if (insertError.code === '23505') { // PostgreSQL unique constraint violation
            setError(`Duplicate entry: You already have picks for this show. Please refresh the page.`);
          } else {
            setError(`Error creating submission: ${insertError.message || 'Unknown error'}`);
          }
          return;
        }
      }
      
      // Group songs by set for proper numbering
      const setGroups: Record<string, SongPick[]> = {};
      const realPicks = songPicks.filter(pick => !pick.isBreak);
      
      // Group songs by set
      realPicks.forEach(pick => {
        if (!setGroups[pick.set]) {
          setGroups[pick.set] = [];
        }
        setGroups[pick.set].push(pick);
      });
      
      // Prepare picks with correct set-specific numbering
      const picksToInsert: any[] = [];
      
      // Process each set to create properly numbered picks
      Object.keys(setGroups).forEach(setId => {
        // Sort songs in this set by their current setnum
        const sortedSetSongs = [...setGroups[setId]].sort((a, b) => a.setnum - b.setnum);
        
        // Create database entries with set-specific sequential numbering
        sortedSetSongs.forEach((pick, index) => {
          picksToInsert.push({
            submission_id: submissionId,
            user_id: user.id,
            show_id: show.show_id,
            song: pick.song,
            set: pick.set,
            setnum: index + 1, // 1-based indexing for each set
            placement: pick.placement || getPlacement(setId, sortedSetSongs, pick) // Ensure placement is defined
          });
        });
      });
      
      try {
        const { error: picksError } = await supabase
          .from('setlist_game_picks')
          .insert(picksToInsert);
        
        if (picksError) {
          throw picksError;
        }
      } catch (picksInsertError: any) {
        setError(`Error inserting picks: ${picksInsertError.message || 'Unknown error'}`);
        return;
      }
      
      setSuccess(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        // Refresh the page to update the UI
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      // For any other errors that weren't caught by specific handlers
      let errorMessage = 'Failed to submit picks. Please try again.';
      
      if (error.code === '23505') {
        errorMessage = 'Error: You already have picks for this show. Please refresh the page.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  // Format date for display (MM.DD.YY)
  const formatDate = (dateString: string) => {
    return dateString
      .split('-')
      .slice(1)
      .concat(dateString.substring(2, 4))
      .join('.');
  };

  // Total number of songs selected (excluding breaks)
  const totalSongsSelected = songPicks.filter(pick => !pick.isBreak).length;

  // Helper function to get a human-readable description of the result
  const getResultDescription = (result: string | undefined, showcloser_correct?: boolean, showopener_correct?: boolean): string => {
    
    if (!result) return '';
    
    let description = '';
    
    switch (result) {
      case 'not_played':
        return '❌&nbsp;&nbsp;Song Not Played';
      
      case 'correct_song':
        description = '✅&nbsp;&nbsp;Song';
        break;
      
      case 'correct_song_set':
        description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Set';
        break;
      
      case 'correct_song_set_setnum':
        description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Set<br>✅&nbsp;&nbsp;Set Position';
        break;
      
      case 'correct_song_openercloserencore':
        description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>❌&nbsp;&nbsp;Set';
        break;
      
      case 'correct_song_set_openercloserencore':
        description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>✅&nbsp;&nbsp;Set';
        break;
      
      case 'correct_song_set_setnum_openercloserencore':
        description = '✅&nbsp;&nbsp;Song<br>✅&nbsp;&nbsp;Opener/Closer/Encore<br>✅&nbsp;&nbsp;Set<br>✅&nbsp;&nbsp;Set Position';
        break;
      
      default:
        return result;
    }
    
    // Add Show Opener info if the showopener_correct flag is true
    if (showopener_correct === true) {
      description += '<br>✅&nbsp;&nbsp;Show Opener';
    }
    
    // Add Show Closer info if the showcloser_correct flag is true
    if (showcloser_correct === true) {
      description += '<br>✅&nbsp;&nbsp;Show Closer';
    }
    
    return description;
  };

  // TooltipContainer for score display with hover behavior
  const TooltipContainer = React.memo(({ result, score, pick }: { 
    result: string | undefined, 
    score: number | undefined,
    pick?: SongPick
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    
    // Calculate tooltip position when it becomes visible
    useEffect(() => {
      if (showTooltip && containerRef.current && tooltipRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        // Get actual tooltip dimensions
        const tooltipWidth = tooltipRect.width || tooltipRef.current.offsetWidth;
        const tooltipHeight = tooltipRect.height || tooltipRef.current.offsetHeight;
        
        // Position tooltip so its RIGHT edge is 8px (2 Tailwind units) to the LEFT of the container
        let x = containerRect.left - tooltipWidth - 8; // 8px = 2 Tailwind units
        let y = containerRect.top + (containerRect.height / 2) - (tooltipHeight / 2); // Center vertically
        
        // Keep tooltip within viewport bounds
        if (x < 8) {
          // If no space on left, show on right side instead
          x = containerRect.right + 8;
        }
        if (y < 8) {
          y = 8;
        }
        if (y + tooltipHeight > window.innerHeight - 8) {
          y = window.innerHeight - tooltipHeight - 8;
        }
        
        setTooltipPosition({ x, y });
      }
    }, [showTooltip]); // Remove tooltipRef dependency to avoid infinite loops
    
    // Create the tooltip content using React Portal
    const tooltipContent = showTooltip ? createPortal(
      <div 
        ref={tooltipRef}
        className="bg-tertiary border border-secondary text-fifth font-medium px-3 py-1.5 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none"
        style={{
          position: 'fixed',
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          zIndex: 999999,
          // Initially invisible to measure dimensions
          visibility: tooltipPosition.x === 0 && tooltipPosition.y === 0 ? 'hidden' : 'visible',
        }}
        dangerouslySetInnerHTML={{ 
          __html: getResultDescription(result, (pick as any)?.showcloser_correct ?? false, (pick as any)?.showopener_correct ?? false)
        }}
      />,
      document.body
    ) : null;
    
    return (
      <>
        <div 
          className="flex items-center justify-center w-8 h-6 cursor-pointer relative"
          ref={containerRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {result === 'not_played' ? (
            <X className="w-6 h-6 text-primary p-0.5 bg-red-600 rounded-lg" />
          ) : (
            <span className="font-medium text-primary bg-green-600 rounded-lg px-1">
              +{score}
            </span>
          )}
        </div>
        {tooltipContent}
      </>
    );
  });


  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 inset-y-4 md:inset-x-auto md:inset-y-auto md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col md:h-auto md:max-h-[90vh] md:w-[min(1000px,calc(100vw-32px))]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-secondary">
          <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
            {viewMode 
              ? (show.show_scored ? 'Setlist Game Results' : 'Your Setlist Picks')
              : (isEditing ? 'Edit Setlist Picks' : 'Select Setlist')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-fifth/70" />
          </button>
        </div>
        
        {/* Status display */}
        <div className="px-3 py-2 border-b border-secondary bg-canvas">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="text-center md:text-left">
              <h3 className="text-fifth font-medium">
                {formatDate(show.show_date)} — {show.show_subvenue}
              </h3>
              <p className="text-fifth/70 font-light text-sm">
                {show.show_venue_location}
              </p>
            </div>
            {viewMode && show.show_scored && submissionDetails ? (
              <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
                <h2 className="text-base font-semibold bg-green-600 text-primary inline-block px-3 py-1 rounded-lg border border-secondary">
                  {submissionDetails.totalScore} points
                </h2>
              </div>
            ) : viewMode && show.isSelectionClosed && existingPicks && existingPicks.length > 0 ? (
              <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
                <span className="px-3 py-1.5 bg-blue-600 text-primary rounded-md text-sm font-medium">
                  Awaiting results
                </span>
              </div>
            ) : (
              <div className="mt-2 md:mt-0 flex justify-center md:justify-end">
                {show.isSelectionClosed ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-700 rounded-md text-xs border border-red-500/30">
                    Picks closed
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 text-green-700 rounded-md text-xs border border-green-500/30">
                    {showInfo.timeRemaining} left to submit
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-3 h-3 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-[#fce7ca]/70 mt-4 text-sm">Loading songs...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="bg-green-500/20 text-fifth px-4 py-3 rounded-lg">
                Your song selections have been {isEditing ? 'updated' : 'submitted'} successfully!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Only show song selection UI if not in view mode */}
              {!viewMode && (
                <>
                  {/* Song selection */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                    <select
                      value={selectedSong}
                      onChange={(e) => setSelectedSong(e.target.value)}
                      className="w-full px-2 py-2 bg-canvas border border-secondary rounded-md text-fifth font-medium focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none"
                    >
                      <option value="">Select a song...</option>
                      
                      {/* Goose Songs Section */}
                      <optgroup label="Goose Songs">
                        {songs
                          .filter(song => song.category_type === 'Goose' && !song.song.includes("[New") && !(song as any).song_placeholder)
                          .map((song) => (
                            <option key={song.song_id} value={song.song}>
                              {song.song}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Cover Songs Section */}
                      <optgroup label="Cover Songs">
                        {songs
                          .filter(song => song.category_type === 'Cover Songs' && !song.song.includes("[New") && !(song as any).song_placeholder)
                          .map((song) => (
                            <option key={song.song_id} value={song.song}>
                              {song.song}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    </div>
                    <button
                      onClick={handleAddSong}
                      disabled={!selectedSong}
                      className="px-4 py-2 bg-tertiary hover:bg-tertiary/40 text-fifth font-semibold rounded-md transition-colors disabled:bg-tertiary/50 disabled:cursor-not-allowed flex items-center gap-2 border border-secondary"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="md:inline hidden">Add Song</span>
                      <span className="md:hidden inline">Add</span>
                    </button>
                  </div>
                  
                  {/* Break controls and special song buttons */}
                  <div className="flex flex-wrap gap-3 justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddSetBreak}
                        disabled={!canAddSetBreak()}
                        className="px-3 py-1 bg-[#f9ae37] hover:bg-[#f9ae37]/80 text-fifth font-medium rounded-md transition-colors disabled:bg-canvas/50 disabled:text-fifth/50 disabled:cursor-not-allowed text-sm border border-secondary"
                      >
                        Add Set Break
                      </button>
                      
                      <button
                        onClick={handleAddEncoreBreak}
                        disabled={!canAddEncoreBreak()}
                        className="px-3 py-1 bg-red-400 hover:bg-red-400/80 text-fifth font-medium rounded-md transition-colors disabled:bg-canvas/50 disabled:text-fifth/50 disabled:cursor-not-allowed text-sm border border-secondary"
                      >
                        Add Encore Break
                      </button>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddNewOriginalSong}
                        className="px-3 py-1 bg-green-400 hover:bg-green-400/80 text-fifth font-medium rounded-md transition-colors border border-secondary text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="md:inline hidden">New Original Song</span>
                        <span className="md:hidden inline">New Original Song</span>
                      </button>
                      
                      <button
                        onClick={handleAddNewCoverSong}
                        className="px-3 py-1 bg-blue-400 hover:bg-blue-400/80 text-fifth font-medium rounded-md transition-colors border border-secondary text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="md:inline hidden">New Cover Song</span>
                        <span className="md:hidden inline">New Cover Song</span>
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/20 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-500/30">
                      {error}
                    </div>
                  )}
                </>
              )}
              
              {/* Selected songs list */}
              <div>
                {songPicks.length === 0 ? (
                  <div className="text-fifth font-light py-4 text-center text-sm">
                    No songs selected yet. Add songs above to begin.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {viewMode && show.show_scored ? (
                      <>
                        {/* Mobile view: Toggle switch */}
                        <div className="md:hidden">
                          <ToggleSwitch />
                        </div>
                        
                        {/* Desktop view: Two column layout */}
                        <div className="hidden md:block">
                          {getUniqueSets().map(setId => (
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
                                    {getSongsForSet(setId).length > 0 ? (
                                      getSongsForSet(setId).map((pick, index) => (
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
                                    {getSongsForActualSet(setId).length > 0 ? (
                                      getSongsForActualSet(setId).map((entry, index) => (
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
                          {getUniqueSets().map(setId => (
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
                                    {getSongsForSet(setId).length > 0 ? (
                                      getSongsForSet(setId).map((pick, index) => (
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
                                    {getSongsForActualSet(setId).length > 0 ? (
                                      getSongsForActualSet(setId).map((entry, index) => (
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
                    ) : (
                      // Regular view for non-scored or edit mode
                      getUniqueSets().map(setId => (
                        <div key={setId} className="border border-secondary rounded-lg overflow-hidden">
                          <div className="flex justify-between items-center px-3 py-2 bg-black">
                            <h4 className="text-base font-medium text-primary">
                              {getSetDisplayName(setId)}
                            </h4>
                            {!viewMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSet(setId);
                                }}
                                className="bg-red-600 text-primary hover:bg-red-600/80 p-1.5 rounded-md"
                                title="Remove this set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-1 p-2 bg-canvas">
                          {getSongsForSet(setId).map((pick, index) => (
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
                                  {pick.placement && (!viewMode || !show.isSelectionClosed) && (
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
                                      moveSongUp(pick.id);
                                    }}
                                    className="text-fifth bg-tertiary hover:bg-tertiary/40 p-1 mr-0.5 rounded border border-secondary"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent event bubbling
                                      moveSongDown(pick.id);
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
                                        handleRemoveSong(index);
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
                                  {show.show_scored && pick.score !== undefined && (
                                    <TooltipContainer result={pick.result} score={pick.score} pick={pick} />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        
        {/* Footer actions */}
        <div className="p-3 border-t bg-canvas border-secondary rounded-b-lg">
          {viewMode ? (
            <div className="w-full flex flex-col items-center">
              {/* Show raw points and penalties for scored shows */}
              {viewMode && show.show_scored && (
                <div className="w-full text-center mb-3">
                  {/* Raw score display */}
                  <div className="text-sm text-fifth font-semibold">
                    Selection score: <span className="font-medium text-primary bg-green-600 rounded-lg py-1 px-1.5 ml-1.5">{rawPointsTotal} points</span>
                  </div>
                  
                  {/* Penalty information - now positioned below raw score */}
                  {submissionDetails && submissionDetails.songsPicked > submissionDetails.songsPlayed && (
                    <div className="text-xs text-fifth font-semibold mt-2">
                      {` ${submissionDetails.songsPicked - submissionDetails.songsPlayed === 1 
                        ? "1 extra song picked" 
                        : `${submissionDetails.songsPicked - submissionDetails.songsPlayed} extra songs picked`}:`}
                      <span className="font-medium text-primary bg-red-600 rounded-lg py-1 px-1.5 ml-1.5">
                        {`-${(submissionDetails.songsPicked - submissionDetails.songsPlayed) * 3} points`}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* View Mode Footer Buttons */}
              <div className="flex space-x-3">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="px-3 py-1 bg-red-600 hover:bg-red-600/80 text-primary flex items-center gap-2 font-medium rounded-md transition-colors border border-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
              
            </div>
          ) : (
            <>
              {/* Mobile view: stacked layout */}
              <div className="block md:hidden w-full">
                <div className="flex justify-center mb-3">
                  <div className="text-fifth font-semibold text-sm">
                    {totalSongsSelected} song{totalSongsSelected !== 1 ? 's' : ''} selected
                  </div>
                </div>
                <div className="flex justify-center items-center space-x-2">
                  {songPicks.length > 0 && (
                    <button
                      onClick={() => {
                        // Clear all selections immediately without confirmation
                        setSongPicks([]);
                        setCurrentSet('1');
                        setNextSetNum(1);
                        setError(null);
                      }}
                      className="px-3 py-2 bg-red-600 border border-secondary hover:bg-red-700 text-primary font-medium rounded-md transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                  
                  
                  <button
                    onClick={handleSubmit}
                    disabled={songPicks.length === 0 || submitting || success}
                    className="px-3 py-2 bg-green-600 border border-secondary hover:bg-green-600/80 text-primary font-medium rounded-md transition-colors disabled:bg-black/50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>...</span>
                      </>
                    ) : success ? (
                      <span>Done!</span>
                    ) : (
                      <>
                        <span>{isEditing ? 'Update' : 'Submit'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Desktop view: remains the same */}
              <div className="hidden md:flex md:justify-between md:items-center">
                <div className="flex items-center gap-3">
                  <div className="text-fifth font-semibold text-sm">
                    {totalSongsSelected} song{totalSongsSelected !== 1 ? 's' : ''} selected
                  </div>
                  {songPicks.length > 0 && (
                    <button
                      onClick={() => {
                        // Clear all selections immediately without confirmation
                        setSongPicks([]);
                        setCurrentSet('1');
                        setNextSetNum(1);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-primary border border-secondary font-medium rounded-md transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear Selections</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={songPicks.length === 0 || submitting || success}
                    className="px-4 py-2 bg-green-600 hover:bg-green-600/80 border border-secondary text-primary font-medium rounded-md transition-colors disabled:bg-green-600/50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : success ? (
                      <span>Submitted!</span>
                    ) : (
                      <>
                        <span>{isEditing ? 'Update Picks' : 'Submit Picks'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
            </>
          )}
        </div>
      </div>
    </>
  );
}