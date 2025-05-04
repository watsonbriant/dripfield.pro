import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Share, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import domtoimage from 'dom-to-image';

interface SongSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    show_id: string;
    show_date: string;
    show_subvenue: string;
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
  const [loadingSetlist, setLoadingSetlist] = useState(false);
  const [showActualSetlist, setShowActualSetlist] = useState(false);
  
  // New state for sharing functionality
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const shareableImageRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [clipboardSuccess, setClipboardSuccess] = useState<boolean>(false);

  // Fetch username on component mount
  useEffect(() => {
    async function fetchUsername() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching username:', error);
          return;
        }
        
        if (data && data.username) {
          setUsername(data.username);
        }
      } catch (err) {
        console.error('Error in fetch username:', err);
      }
    }
    
    fetchUsername();
  }, [user]);

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
        result: pick.result
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
        setLoadingSetlist(true);
        
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
        setLoadingSetlist(false);
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
  const getActualSetlist = () => {
    return actualSetlist;
  };

  // Toggle switch component for mobile view
  const ToggleSwitch = () => {
    return (
      <div className="flex items-center justify-center my-3">
        <div className="inline-flex border border-white/10 rounded-lg overflow-hidden">
          <span 
            className={`px-4 py-1.5 transition-colors font-semibold text-base ${!showActualSetlist ? 'bg-tertiary text-white' : 'bg-[#0e151b] text-[#fce7ca]/70'}`}
            onClick={() => setShowActualSetlist(false)}
          >
            My Picks
          </span>
          <span 
            className={`px-4 py-1.5 transition-colors font-semibold text-base ${showActualSetlist ? 'bg-tertiary text-white' : 'bg-[#0e151b] text-[#fce7ca]/70'}`}
            onClick={() => setShowActualSetlist(true)}
          >
            Actual Setlist
          </span>
        </div>
      </div>
    );
  };

  // Function to get a combined array of all sets from both user picks and actual setlist
  const getAllSets = (): string[] => {
    // Get sets from user's picks
    const userSets = new Set(songPicks.map(pick => pick.set));
    
    // Get sets from actual setlist
    const actualSets = new Set(actualSetlist.map(entry => entry.entry_set));
    
    // Combine both sets
    const allSetsSet = new Set([...userSets, ...actualSets]);
    
    // Order them correctly (numeric sets first, then encore sets)
    const numericSets = Array.from(allSetsSet)
      .filter(set => !set.startsWith('E'))
      .sort((a, b) => parseInt(a) - parseInt(b));
      
    const encoreSets = Array.from(allSetsSet)
      .filter(set => set.startsWith('E'))
      .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
      
    return [...numericSets, ...encoreSets];
  };

  // Get unique sets from actual setlist
  const getUniqueActualSets = (): string[] => {
    const setsInActual = new Set(actualSetlist.map(entry => entry.entry_set));
    
    // Order them correctly (numeric sets first, then encore sets)
    const numericSets = Array.from(setsInActual)
      .filter(set => !set.startsWith('E'))
      .sort((a, b) => parseInt(a) - parseInt(b));
      
    const encoreSets = Array.from(setsInActual)
      .filter(set => set.startsWith('E'))
      .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
      
    return [...numericSets, ...encoreSets];
  };
  
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
      'Set 1 Opener': '#006400',
      'Set 1 Closer': '#995905',
      'Set 2 Opener': '#019B7A',
      'Set 3 Opener': '#019B7A',
      'Set 4 Opener': '#019B7A',
      'Set 5 Opener': '#019B7A',
      'Set 2 Closer': '#E17401',
      'Set 3 Closer': '#E17401',
      'Set 4 Closer': '#E17401',
      'Set 5 Closer': '#E17401',
      'Encore 1': '#7C2128',
      'Encore 2': '#CE1126',
      'Encore 3': '#AF1E2D'
    };
    
    return colorMap[placement] || 'transparent';
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

  // Fetch songs from "Goose" or "Cover Songs" categories
  useEffect(() => {
    async function fetchSongs() {
      try {
        setLoading(true);
        
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
          .order('song');
        
        if (error) throw error;
        
        const songsData = data?.map(item => ({
          song: item.song,
          song_id: item.song_id,
          category_type: item.categories?.category_type
        })) || [];
        
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
    
    // Check if the song is already selected in ANY set (not just current set)
    if (songPicks.some(pick => pick.song === selectedSong && !pick.isBreak)) {
      setError('This song is already selected for this show');
      return;
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
      
      // If editing, update the existing submission and delete only the picks
      if (isEditing && show.submission_id) {
        submissionId = show.submission_id;
        
        // Delete existing picks but KEEP the submission
        const { error: picksDeleteError } = await supabase
          .from('setlist_game_picks')
          .delete()
          .eq('submission_id', submissionId);
          
        if (picksDeleteError) {
          console.error('Error deleting existing picks:', picksDeleteError);
          throw picksDeleteError;
        }
        
        // Update the existing submission record
        const { error: updateError } = await supabase
          .from('setlist_game_submissions')
          .update({
            total_songs_picked: songPicks.filter(pick => !pick.isBreak).length
            // No updated_at field in the schema
          })
          .eq('submission_id', submissionId);
        
        if (updateError) {
          console.error('Error updating submission:', updateError);
          throw updateError;
        }

      } else {
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
          console.error('Error creating submission:', submissionError);
          throw submissionError;
        }
        
        submissionId = submissionData.submission_id;
      }
      
      // Group songs by set for proper numbering
      const setGroups = {};
      const realPicks = songPicks.filter(pick => !pick.isBreak);
      
      // Group songs by set
      realPicks.forEach(pick => {
        if (!setGroups[pick.set]) {
          setGroups[pick.set] = [];
        }
        setGroups[pick.set].push(pick);
      });
      
      // Prepare picks with correct set-specific numbering
      const picksToInsert = [];
      
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
            placement: pick.placement
          });
        });
      });
      
      const { error: picksError } = await supabase
        .from('setlist_game_picks')
        .insert(picksToInsert);
      
      if (picksError) {
        console.error('Error inserting picks:', picksError);
        throw picksError;
      }
      
      setSuccess(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        // Refresh the page to update the UI
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error submitting picks:', error);
      setError('Failed to submit picks. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate preview image
  const generatePreviewImage = async () => {
    if (!shareableImageRef.current) {
      setShareError('Unable to generate image. Please try again.');
      return null;
    }
    
    try {
      setIsGeneratingImage(true);
      setShareError(null);
      
      // Force a layout render before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use dom-to-image to convert the div to a PNG
      const dataUrl = await domtoimage.toPng(shareableImageRef.current, {
        width: 450,
        height: shareableImageRef.current.offsetHeight,
        bgcolor: '#172330', // Match the site's background color
        style: {
          margin: '0',
          padding: '0'
        }
      });
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating preview image:', error);
      setShareError('Failed to generate image preview. Please try again.');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyImageToClipboard = async () => {
    try {
      setIsGeneratingImage(true);
      setShareError(null);
      
      // Generate image if it doesn't exist yet
      let imageUrl = previewImageUrl;
      if (!imageUrl) {
        imageUrl = await generatePreviewImage();
        if (!imageUrl) {
          throw new Error('Failed to generate image');
        }
      }
      
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Try to use the clipboard API to copy the image
      try {
        // Use the Clipboard API's write method for better image support
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        
        // Show success message by changing button state
        setClipboardSuccess(true);
        setTimeout(() => setClipboardSuccess(false), 2000); // Revert after 2 seconds
        
      } catch (clipboardError) {
        console.error('Clipboard API write failed:', clipboardError);
        
        // Fallback to legacy method for older browsers
        try {
          // For browsers that don't support ClipboardItem
          await navigator.clipboard.writeText('Setlist picks image copied to clipboard');
          
          // Still show success message
          setClipboardSuccess(true);
          setTimeout(() => setClipboardSuccess(false), 2000);
          
          setShareError('Your browser doesn\'t fully support clipboard images, but the image has been copied as text.');
        } catch (fallbackError) {
          console.error('Fallback clipboard method failed:', fallbackError);
          
          // If all clipboard methods fail, fall back to download
          const link = document.createElement('a');
          link.download = `echo-of-a-set-${formatDate(show.show_date)}.png`;
          link.href = imageUrl;
          link.click();
          
          setShareError('Unable to copy to clipboard. Image has been downloaded instead.');
        }
      }
    } catch (error) {
      console.error('Error copying image to clipboard:', error);
      setShareError('Failed to copy image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Toggle preview
  const handleTogglePreview = async () => {
    if (showPreview) {
      // Hide preview
      setShowPreview(false);
      return;
    }
    
    // Generate and show preview
    const imageUrl = await generatePreviewImage();
    if (imageUrl) {
      setPreviewImageUrl(imageUrl);
      setShowPreview(true);
    }
  };
  
  // Download image
  const handleDownloadImage = async () => {
    try {
      // Use existing preview or generate new image
      let imageUrl = previewImageUrl;
      
      if (!imageUrl) {
        setIsGeneratingImage(true);
        imageUrl = await generatePreviewImage();
        setIsGeneratingImage(false);
      }
      
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }
      
      // Check if the Web Share API is available (modern mobile browsers)
      if (navigator.share) {
        // Convert the data URL to a blob for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `echo-of-a-set-${formatDate(show.show_date)}.png`, { type: 'image/png' });
        
        try {
          await navigator.share({
            title: 'My Setlist Picks',
            text: `My setlist picks for ${formatDate(show.show_date)} at ${show.show_subvenue}`,
            files: [file]
          });
          return;
        } catch (shareError) {
          console.log('Share cancelled or failed', shareError);
          // Fall back to download if sharing fails
        }
      }
      
      // Fall back to traditional download for desktop or unsupported browsers
      const link = document.createElement('a');
      link.download = `echo-of-a-set-${formatDate(show.show_date)}.png`;
      link.href = imageUrl;
      link.click();
      
    } catch (error) {
      console.error('Error downloading/sharing image:', error);
      setShareError('Failed to download/share image. Please try again.');
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

  // Get result color based on result type
  const getResultColor = (result: string | undefined): string => {
    if (!result) return 'transparent';
    
    switch (result) {
      case 'not_played':
        return '#5c5c5c'; // Gray for not played
      
      case 'correct_song_set_num':
      case 'correct_song_set_openercloser':
        return '#006400'; // Dark green for perfect match
      
      case 'correct_song_showcloser':
        return '#9C27B0'; // Purple for show closer match
      
      case 'correct_song_openercloser':
        return '#228B22'; // Forest green for opener/closer match
      
      case 'correct_song_set':
        return '#4CAF50'; // Medium green for song+set match
      
      case 'correct_song':
        return '#8FBC8F'; // Light green for song match only
      
      default:
        return 'transparent';
    }
  };

  // Helper function to get a human-readable description of the result
  const getResultDescription = (result: string | undefined): string => {
    if (!result) return '';
    
    switch (result) {
      case 'not_played':
        return 'Not played';
      
      case 'correct_song':
        return 'Correct song';
      
      case 'correct_song_set':
        return 'Correct song and set';
      
      case 'correct_song_set_num':
        return 'Correct song, set, and position';
      
      case 'correct_song_openercloser':
        return 'Correct opener/closer, wrong set';
      
      case 'correct_song_set_openercloser':
        return 'Correct opener/closer and set';
      
      case 'correct_song_showcloser':
        return 'Correct show closer';
      
      default:
        return result;
    }
  };

  // TooltipContainer for score display with hover behavior
  const TooltipContainer = React.memo(({ result, score }: { result: string | undefined, score: number | undefined }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    return (
      <div 
        className="flex items-center justify-center w-8 h-6 cursor-pointer relative"
        ref={containerRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {result === 'not_played' ? (
          // Show red X icon for not played songs
          <X className="w-5 h-5 text-red-500" />
        ) : (
          // Show green +score for played songs
          <span className="font-semibold text-green-500">
            +{score}
          </span>
        )}
        
        {/* Static tooltip that appears on hover */}
        {showTooltip && (
          <div 
            className="absolute bg-[#594e5f] text-[#fce7ca] px-3 py-1.5 rounded shadow-lg z-[9999] text-xs whitespace-nowrap"
            style={{
              right: '30px', // Positioned to the left of the score
              top: '0', // Aligned with the score vertically
            }}
          >
            {getResultDescription(result)}
          </div>
        )}
      </div>
    );
  });

  // Hidden shareable image component that will be rendered to an image
  const ShareableImageComponent = () => (
    <div 
      ref={shareableImageRef} 
      className="bg-[#0c1d27] p-2" 
      style={{ 
        width: '450px', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="mt-3 ml-4">
          <h1 className="text-xl font-bold text-white">Echo of a Set</h1>
          <h2 className="text-xs font-semibold text-tertiary">A Setlist Game for Goose the Band</h2>
        </div>
        {/* Logo */}
        <img 
          src="/src/img/MoonCabin_Logo.jpg" 
          alt="Goose Logo" 
          className="w-48"
        />
      </div>
      
      {/* Show Info */}
      <div className="mb-3 ml-4 pb-3 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white/90">
          {formatDate(show.show_date)} — {show.show_subvenue}
        </h3>
        <p className="text-[#fce7ca]/70 text-sm">
          {show.show_venue_location}
        </p>
        {show.show_detail && (
          <p className="text-tertiary text-xs mt-1">
            {show.show_detail}
          </p>
        )}
        <p className="text-[#fce7ca]/90 text-sm mt-2">
          Picks by: <span className="font-semibold">{username || 'My Picks'}</span>
        </p>
      </div>
      
      {/* Picks */}
      <div className="space-y-3 ml-4">
        {getUniqueSets().map(setId => (
          <div key={setId} className="mb-2">
            <h4 className="text-base font-semibold text-white mb-1">
              {getSetDisplayName(setId)}
            </h4>
            <div className="space-y-1">
              {getSongsForSet(setId).map((pick, index) => (
                <div 
                  key={pick.id} 
                  className="flex items-center rounded-md px-1 py-1 bg-[#0e151b]/70 text-[#fce7ca]/90"
                >
                  <span 
                    className="text-white text-center text-xs rounded font-semibold w-6 h-5 flex items-center justify-center mr-2"
                    style={{ backgroundColor: getPlacementColor(pick.placement) }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm ml-2 font-medium">
                    {pick.song}
                  </span>
                  
                  {/* Show score if available */}
                  {show.show_scored && pick.score !== undefined && (
                    <div className="ml-auto">
                      {pick.result === 'not_played' ? (
                        <span className="text-red-500">✕</span>
                      ) : (
                        <span className="text-xs font-semibold text-green-500">
                          +{pick.score}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer - only show for scored shows */}
      {show.show_scored && (
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <div className="text-white font-bold">
            {submissionDetails?.totalScore} points
          </div>
          <div className="text-xs text-[#fce7ca]/70 mt-1">
            dripfield.pro — Setlist Game
          </div>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div 
        className="fixed inset-x-4 inset-y-4 md:inset-x-auto md:inset-y-auto md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-primary rounded-lg border border-white/10 shadow-xl flex flex-col md:h-auto md:max-h-[90vh] md:w-[min(1000px,calc(100vw-32px))]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white/90">
            {viewMode 
              ? (show.show_scored ? 'Setlist Game Results' : 'Your Setlist Picks')
              : (isEditing ? 'Edit Setlist Picks' : 'Select Setlist')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* Status display */}
        <div className="p-4 border-b border-white/10 bg-[#0e151b]">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div>
              <h3 className="text-white/90 font-semibold">
                {formatDate(show.show_date)} — {show.show_subvenue}
              </h3>
              <p className="text-[#fce7ca]/70 text-sm">
                {show.show_venue_location}
              </p>
            </div>
            {viewMode && show.show_scored && submissionDetails ? (
              <div className="mt-2 md:mt-0 flex flex-col items-center md:items-end">
                {/* Center the score on mobile, right-align on desktop */}
                <span className="text-lg font-bold text-tertiary">
                  {submissionDetails.totalScore} points
                </span>
                {/* Move penalty info to footer */}
              </div>
            ) : viewMode && show.isSelectionClosed && existingPicks && existingPicks.length > 0 ? (
              <div className="mt-2 md:mt-0 flex items-center justify-center md:justify-end w-full md:w-auto">
                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium">
                  Awaiting results
                </span>
              </div>
            ) : (
              <div className="mt-2 md:mt-0 justify-center md:justify-start">
                {show.isSelectionClosed ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-md text-xs">
                    Picks closed
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-xs">
                    {showInfo.timeRemaining} left to submit
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
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
              <div className="bg-green-500/20 text-green-300 px-4 py-3 rounded-lg">
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
                        className="w-full px-2 py-2 bg-black/30 border border-white/10 rounded-md text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary"
                      >
                        <option value="">Select a song...</option>
                        {songs.map((song) => (
                          <option key={song.song_id} value={song.song}>
                            {song.song}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddSong}
                      disabled={!selectedSong}
                      className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors disabled:bg-tertiary/50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="md:inline hidden">Add Song</span>
                      <span className="md:hidden inline">Add</span>
                    </button>
                  </div>
                  
                  {/* Break controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddSetBreak}
                      disabled={!canAddSetBreak()}
                      className="px-4 py-2 bg-[#0e151b] hover:bg-tertiary/20 text-white font-medium rounded-md transition-colors disabled:bg-[#0e151b]/50 disabled:text-white/50 disabled:cursor-not-allowed text-sm border border-white/10"
                    >
                      Add Set Break
                    </button>
                    
                    <button
                      onClick={handleAddEncoreBreak}
                      disabled={!canAddEncoreBreak()}
                      className="px-4 py-2 bg-[#0e151b] hover:bg-tertiary/20 text-white font-medium rounded-md transition-colors disabled:bg-[#0e151b]/50 disabled:text-white/50 disabled:cursor-not-allowed text-sm border border-white/10"
                    >
                      Add Encore Break
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </>
              )}
              
              {/* Selected songs list */}
              <div className="mt-6">
                {songPicks.length === 0 ? (
                  <div className="text-[#fce7ca]/70 py-4 text-center text-sm">
                    No songs selected yet. Add songs above to begin.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {viewMode && show.show_scored ? (
                      <>
                        {/* Mobile view: Toggle switch */}
                        <div className="md:hidden">
                          <ToggleSwitch />
                        </div>
                        
                        {/* Desktop view: Two column layout */}
                        <div className="hidden md:block">
                          {getAllSets().map(setId => (
                            <div key={setId} className="border border-white/10 rounded-lg overflow-hidden mb-5">
                              <div className="flex items-center px-3 py-2 bg-[#0e151b]">
                                <h4 className="text-base font-medium text-[#fce7ca] flex-1">
                                  {setId.startsWith('E') ? 
                                    `${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'} Selections` : 
                                    `Set ${setId} Selections`}
                                </h4>
                                <h4 className="text-base font-medium text-[#fce7ca] flex-1 pl-6">
                                  {setId.startsWith('E') ? 
                                    `Actual ${setId === 'E1' ? 'Encore' : setId === 'E2' ? '2nd Encore' : '3rd Encore'}` : 
                                    `Actual Set ${setId}`}
                                </h4>
                              </div>
                              
                              <div className="p-2">
                                <div className="grid grid-cols-2 gap-0">
                                  {/* Left column: User's selections */}
                                  <div className="space-y-1 pr-4 border-r border-white/20">
                                    {getSongsForSet(setId).length > 0 ? (
                                      getSongsForSet(setId).map((pick, index) => (
                                        <div 
                                          key={pick.id} 
                                          className="flex justify-between items-center rounded-md px-3 text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <span 
                                              className="text-white text-center rounded text-sm font-semibold w-8 h-6 flex items-center justify-center"
                                              style={{ 
                                                backgroundColor: getPlacementColor(pick.placement) 
                                              }}
                                            >
                                              {index + 1}
                                            </span>
                                            <div className="flex-1 flex flex-col justify-center">
                                              <span className="break-words pr-2 font-semibold text-sm">
                                                {pick.song}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {/* Score display in the middle */}
                                          <div className="flex items-center shrink-0">
                                            {pick.score !== undefined && (
                                              <TooltipContainer result={pick.result} score={pick.score} />
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-2 text-center text-[#fce7ca]/50 text-sm italic">
                                        No songs picked for this set
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Right column: Actual setlist */}
                                  <div className="space-y-1 pl-4">
                                    {getSongsForActualSet(setId).length > 0 ? (
                                      getSongsForActualSet(setId).map((entry, index) => (
                                        <div 
                                          key={entry.entry_id} 
                                          className="flex items-center rounded-md px-3 text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <span 
                                              className="text-white text-center rounded text-sm font-semibold w-8 h-6 flex items-center justify-center"
                                              style={{ 
                                                backgroundColor: getPlacementColor(entry.entry_placement) 
                                              }}
                                            >
                                              {index + 1}
                                            </span>
                                            <div className="flex-1 flex flex-col justify-center">
                                              <span className="break-words pr-2 font-semibold text-sm">
                                                {entry.entry_song}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-2 text-center text-[#fce7ca]/50 text-sm italic">
                                        No songs in this set
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
                          {getAllSets().map(setId => (
                            <div key={setId} className="border border-white/10 rounded-lg overflow-hidden mb-4">
                              <div className="flex items-center px-3 py-2 bg-[#0e151b]">
                                <h4 className="text-base font-medium text-[#fce7ca] flex-1">
                                  {setId.startsWith('E') ? 
                                    `${getSetDisplayName(setId)} ${!showActualSetlist ? 'Selections' : ''}` : 
                                    `Set ${setId} ${!showActualSetlist ? 'Selections' : ''}`}
                                </h4>
                              </div>
                              
                              <div className="p-2">
                                {!showActualSetlist ? (
                                  // Show user picks
                                  <div className="space-y-1">
                                    {getSongsForSet(setId).length > 0 ? (
                                      getSongsForSet(setId).map((pick, index) => (
                                        <div 
                                          key={pick.id} 
                                          className="flex justify-between items-center rounded-md px-3 text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <span 
                                              className="text-white text-center text-sm rounded font-semibold w-8 h-6 flex items-center justify-center"
                                              style={{ backgroundColor: getPlacementColor(pick.placement) }}
                                            >
                                              {index + 1}
                                            </span>
                                            <div className="flex-1 flex flex-col justify-center">
                                              <span className="break-words pr-2 font-semibold text-sm">
                                                {pick.song}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {/* Score display */}
                                          <div className="flex items-center shrink-0">
                                            {pick.score !== undefined && (
                                              <TooltipContainer result={pick.result} score={pick.score} />
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-2 text-center text-[#fce7ca]/50 text-sm italic">
                                        No songs picked for this set
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  // Show actual setlist
                                  <div className="space-y-1">
                                    {getSongsForActualSet(setId).length > 0 ? (
                                      getSongsForActualSet(setId).map((entry, index) => (
                                        <div 
                                          key={entry.entry_id} 
                                          className="flex items-center rounded-md px-3 text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <span 
                                              className="text-white text-center text-sm rounded font-semibold w-8 h-6 flex items-center justify-center"
                                              style={{ backgroundColor: getPlacementColor(entry.entry_placement) }}
                                            >
                                              {index + 1}
                                            </span>
                                            <div className="flex-1 flex flex-col justify-center">
                                              <span className="break-words pr-2 font-semibold text-sm">
                                                {entry.entry_song}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-2 text-center text-[#fce7ca]/50 text-sm italic">
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
                        <div key={setId} className="border border-white/10 rounded-lg overflow-hidden">
                          <div className="flex justify-between items-center px-3 py-2 bg-[#0e151b]">
                            <h4 className="text-base font-medium text-[#fce7ca]">
                              {getSetDisplayName(setId)}
                            </h4>
                            {!viewMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSet(setId);
                                }}
                                className="text-white hover:text-white hover:bg-red-500/20 p-1.5 rounded-md"
                                title="Remove this set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-1 p-2">
                          {getSongsForSet(setId).map((pick, index) => (
                            <div 
                              key={pick.id} 
                              className="flex justify-between items-center rounded-md px-3 text-[#fce7ca]/90 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <span 
                                  className="text-xs text-white/90 px-2 py-0.5 rounded flex items-center font-semibold justify-center min-w-[1.5rem]"
                                  style={{ 
                                    backgroundColor: getPlacementColor(pick.placement) 
                                  }}
                                >
                                  {index + 1}
                                </span>
                                <div className="flex flex-col justify-center">
                                  <span className="break-words pr-2 font-semibold text-sm">
                                    {pick.song}
                                  </span>
                                  {/* Only show placement labels if not in view mode or if the show isn't closed */}
                                  {pick.placement && (!viewMode || !show.isSelectionClosed) && (
                                    <span className="text-xs text-tertiary">
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
                                    className="text-white hover:text-white hover:bg-tertiary/20 p-1 rounded"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent event bubbling
                                      moveSongDown(pick.id);
                                    }}
                                    className="text-white hover:text-white hover:bg-tertiary/20 p-1 rounded"
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
                                    className="text-white hover:text-white hover:bg-red-500/20 p-1 rounded"
                                    title="Remove song"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center shrink-0 ml-2">
                                  {/* Only show + indicators for scored shows */}
                                  {show.show_scored && pick.score !== undefined && (
                                    <TooltipContainer result={pick.result} score={pick.score} />
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
        
        {/* Hidden component that will be rendered to an image */}
        <div className="fixed left-[-9999px] top-0">
          <ShareableImageComponent />
        </div>
        
        {/* Preview section */}
        {showPreview && previewImageUrl && (
          <div className="p-4 bg-[#0e151b] border-t border-white/10">
            <div className="flex flex-col items-center">
              <h3 className="text-white font-semibold mb-2">Image Preview</h3>
              <div className="border border-white/20 rounded-lg overflow-hidden mb-3 max-w-full">
                <img 
                  src={previewImageUrl} 
                  alt="Shareable setlist preview" 
                  className="max-w-full h-auto" 
                />
              </div>
              <p className="text-[#fce7ca]/70 text-xs text-center">
                This is how your image will look when downloaded.
              </p>
            </div>
          </div>
        )}
        
        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          {viewMode ? (
            <div className="w-full flex flex-col items-center">
              {/* Show raw points and penalties for scored shows */}
              {viewMode && show.show_scored && (
                <div className="w-full text-center mb-3">
                  {/* Raw score display */}
                  <div className="text-sm text-[#fce7ca]/80">
                    Selection score: <span className="font-semibold text-green-400">{rawPointsTotal} points</span>
                  </div>
                  
                  {/* Penalty information - now positioned below raw score */}
                  {submissionDetails && submissionDetails.songsPicked > submissionDetails.songsPlayed && (
                    <div className="text-xs text-[#fce7ca]/70 mt-1">
                      <span className="font-semibold text-red-500">
                        {`-${(submissionDetails.songsPicked - submissionDetails.songsPlayed) * 3} points`}
                      </span>
                      {` (${submissionDetails.songsPicked - submissionDetails.songsPlayed === 1 
                        ? "1 extra song picked" 
                        : `${submissionDetails.songsPicked - submissionDetails.songsPlayed} extra songs picked`})`}
                    </div>
                  )}
                </div>
              )}
              
              {/* View Mode Footer Buttons */}
              <div className="flex space-x-3">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0e151b] hover:bg-tertiary/20 text-white font-medium rounded-md transition-colors border border-white/10"
                >
                  Close
                </button>
                
                {/* Share button - now uses clipboard */}
                {viewMode && (
                  <button
                    onClick={copyImageToClipboard}
                    disabled={isGeneratingImage || clipboardSuccess}
                    className={`px-4 py-2 font-medium rounded-md transition-colors flex items-center gap-2 ${
                      clipboardSuccess 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-tertiary hover:bg-tertiary/80 text-white disabled:bg-tertiary/50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isGeneratingImage ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : clipboardSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied to clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Share className="w-4 h-4" />
                        <span>Share My Picks</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Share error message */}
              {shareError && (
                <div className="mt-2 text-red-500 text-xs text-center">
                  {shareError}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="text-[#fce7ca]/70 text-sm">
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
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:inline hidden">Clear Selections</span>
                    <span className="md:hidden inline">Clear</span>
                  </button>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={songPicks.length === 0 || submitting || success}
                className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-white font-medium rounded-md transition-colors disabled:bg-tertiary/50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span className="md:inline hidden">Submitting...</span>
                    <span className="md:hidden inline">...</span>
                  </>
                ) : success ? (
                  <span>
                    {window.innerWidth >= 768 ? 'Submitted!' : 'Done!'}
                  </span>
                ) : (
                  <>
                    <span className="md:inline hidden">{isEditing ? 'Update Picks' : 'Submit Picks'}</span>
                    <span className="md:hidden inline">{isEditing ? 'Update' : 'Submit'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}