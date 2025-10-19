import { SongPick } from './types';
import { generatePickId, getSetDisplayName, getOrderedSets } from './utils';

export const createSongOperations = (
  songPicks: SongPick[],
  setSongPicks: React.Dispatch<React.SetStateAction<SongPick[]>>,
  currentSet: string,
  setCurrentSet: React.Dispatch<React.SetStateAction<string>>,
  nextSetNum: number,
  setNextSetNum: React.Dispatch<React.SetStateAction<number>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  canAddSetBreak: () => boolean,
  canAddEncoreBreak: () => boolean,
  renumberSongPicks: () => void
) => {
  // Handle adding a song to the picks
  const handleAddSong = (selectedSong: string) => {
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
  };
  
  // Handle adding a new original song
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
  
  // Handle adding a new cover song
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
      
      return newPicks;
    });
  };

  return {
    handleAddSong,
    handleAddNewOriginalSong,
    handleAddNewCoverSong,
    handleAddSetBreak,
    handleAddEncoreBreak,
    handleRemoveSong,
    handleRemoveSet,
    moveSongUp,
    moveSongDown
  };
};
