import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { SongPick, Song, SetlistEntry, SongSelectionModalProps } from './types';
import { 
  calculateTimeRemaining, 
  generatePickId, 
  getSetDisplayName, 
  getUniqueSets,
  getPlacement,
  getOrderedSets
} from './utils';

export const useSongSelection = (props: SongSelectionModalProps) => {
  const { isOpen, existingPicks = [], isEditing = false, viewMode = false, show } = props;
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [songPicks, setSongPicks] = useState<SongPick[]>([]);
  const [currentSet, setCurrentSet] = useState<string>('1');
  const [nextSetNum, setNextSetNum] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [rawPointsTotal, setRawPointsTotal] = useState<number>(0);
  const [actualSetlist, setActualSetlist] = useState<SetlistEntry[]>([]);
  const [showActualSetlist, setShowActualSetlist] = useState(false);

  const [showInfo, setShowInfo] = useState({
    ...show,
    timeRemaining: show.timeRemaining || '',
    isSelectionClosed: show.isSelectionClosed || false
  });

  // Function to calculate time remaining that can be called repeatedly
  const calculateTimeRemainingCallback = useCallback((showTime: string) => {
    return calculateTimeRemaining(showTime);
  }, []);

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
        result: pick.result,
        showcloser_correct: (pick as any).showcloser_correct,
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
      }
    }
    
    fetchActualSetlist();
  }, [show.show_id, viewMode, show.show_scored]);

  // Set up live updating timer
  useEffect(() => {
    // Skip if no show data
    if (!show || !show.show_time) return;
    
    const updateTimeRemaining = () => {
      const { timeRemaining, isSelectionClosed } = calculateTimeRemainingCallback(show.show_time);
      
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
  }, [show?.show_time, calculateTimeRemainingCallback]);

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

  return {
    songs,
    loading,
    selectedSong,
    setSelectedSong,
    songPicks,
    setSongPicks,
    currentSet,
    setCurrentSet,
    nextSetNum,
    setNextSetNum,
    submitting,
    setSubmitting,
    error,
    setError,
    success,
    setSuccess,
    rawPointsTotal,
    actualSetlist,
    showActualSetlist,
    setShowActualSetlist,
    showInfo,
    calculateTimeRemainingCallback
  };
};

export const useSetlistOperations = (songPicks: SongPick[], setSongPicks: React.Dispatch<React.SetStateAction<SongPick[]>>) => {
  const isUpdatingRef = useRef(false);

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
      const orderedSets = getUniqueSets(prevPicks);
      
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
      
      // Update placements after renumbering
      setTimeout(() => updatePlacements(), 10);
      
      return updatedPicks;
    });
  };

  // Run updatePlacements whenever song picks array changes
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

  return {
    canAddSetBreak,
    canAddEncoreBreak,
    updatePlacements,
    renumberSongPicks
  };
};
