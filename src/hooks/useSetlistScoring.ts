import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ScoringState {
  isScoring: boolean;
  scoringComplete: boolean;
  scoringError: string | null;
}

// Helper function to calculate potential score for a pick against an instance
function calculatePotentialScore(
  pick: { song: string; set: string; setnum: number; placement: string },
  instance: { set: string; setnum: number; placement: string },
  isFirstPick: boolean,
  isLastPick: boolean,
  actualFirstSong: any,
  actualLastSong: any
): { score: number; result: string; showopenerBonus: boolean; showcloserBonus: boolean } {
  let pickScore = 0;
  let resultString = 'not_played';
  let showopenerBonus = false;
  let showcloserBonus = false;

  // Start with basic song match (2 points)
  pickScore = 2;
  resultString = 'correct_song';

  // Check for correct set match
  const correctSetMatch = pick.set === instance.set;
  let setAndPositionMatch = false;

  if (correctSetMatch) {
    pickScore = 4;
    resultString = 'correct_song_set';

    // Check for correct setnum within that set
    setAndPositionMatch = pick.setnum === instance.setnum;

    if (setAndPositionMatch) {
      pickScore = 7;
      resultString = 'correct_song_set_setnum';
    }
  }

  // Check for special placements (Opener, Closer, Encore)
  const userPlacement = pick.placement || '';
  const hasOpener = userPlacement.includes('Opener');
  const hasCloser = userPlacement.includes('Closer');
  const hasEncore = userPlacement.includes('Encore');

  const actualPlacement = instance.placement || '';
  const hasMatchingPlacement = 
    (hasOpener && actualPlacement.includes('Opener')) ||
    (hasCloser && actualPlacement.includes('Closer')) ||
    (hasEncore && actualPlacement.includes('Encore'));

  if (hasMatchingPlacement) {
    if (correctSetMatch && instance.set === pick.set) {
      if (setAndPositionMatch && instance.setnum === pick.setnum) {
        // Correct song, set, setnum, and placement
        pickScore = 10;
        resultString = 'correct_song_set_setnum_openercloserencore';
      } else {
        // Correct song, set, and placement
        pickScore = 7;
        resultString = 'correct_song_set_openercloserencore';
      }
    } else if (pickScore <= 2) {
      // Only the song and placement are correct (no set match)
      pickScore = 5;
      resultString = 'correct_song_openercloserencore';
    }
  }

  // Check for show opener bonus
  if (isFirstPick && actualFirstSong) {
    const isShowOpenerMatch = 
      (pick.song === "[New Original Song]" && actualFirstSong.entry_new === "New Original Song") ||
      (pick.song === "[New Cover Song]" && actualFirstSong.entry_new === "New Cover Song");
    
    if (isShowOpenerMatch) {
      showopenerBonus = true;
      pickScore += 3;
    }
  }

  // Check for show closer bonus
  if (isLastPick && actualLastSong) {
    const isShowCloserMatch = 
      (pick.song === "[New Original Song]" && actualLastSong.entry_new === "New Original Song") ||
      (pick.song === "[New Cover Song]" && actualLastSong.entry_new === "New Cover Song");
    
    if (isShowCloserMatch) {
      showcloserBonus = true;
      pickScore += 3;
    }
  }

  return { score: pickScore, result: resultString, showopenerBonus, showcloserBonus };
}

// Helper function to generate all combinations of selecting k items from n items
function generateCombinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  if (k === items.length) return [items];

  const combinations: T[][] = [];
  
  for (let i = 0; i <= items.length - k; i++) {
    const head = items[i];
    const tailCombinations = generateCombinations(items.slice(i + 1), k - 1);
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  
  return combinations;
}

// Helper function to find optimal matching using brute force
function findOptimalMatching(
  picks: Array<{ pick: any; index: number }>,
  instances: Array<{ set: string; setnum: number; placement: string }>,
  actualFirstSong: any,
  actualLastSong: any,
  allPicksSorted: any[]
): { matchedPicks: Set<number>; assignments: Map<number, number> } {
  if (instances.length === 0) {
    return { matchedPicks: new Set(), assignments: new Map() };
  }

  if (picks.length === 0) {
    return { matchedPicks: new Set(), assignments: new Map() };
  }

  // Calculate potential scores for each pick against each instance
  const scoreMatrix: Array<Array<{ score: number; result: string; showopenerBonus: boolean; showcloserBonus: boolean }>> = [];
  
  picks.forEach((pickWrapper) => {
    const pick = pickWrapper.pick;
    const isFirstPick = allPicksSorted[0]?.pick_id === pick.pick_id;
    const isLastPick = allPicksSorted[allPicksSorted.length - 1]?.pick_id === pick.pick_id;
    
    const row: Array<{ score: number; result: string; showopenerBonus: boolean; showcloserBonus: boolean }> = [];
    instances.forEach(instance => {
      const potential = calculatePotentialScore(pick, instance, isFirstPick, isLastPick, actualFirstSong, actualLastSong);
      row.push(potential);
    });
    scoreMatrix.push(row);
  });

  // If we have fewer or equal picks to instances, match all picks optimally
  if (picks.length <= instances.length) {
    // Try all permutations of assigning picks to instances
    const instanceIndices = instances.map((_, idx) => idx);
    const pickIndices = picks.map((_, idx) => idx);
    const permutations = generatePermutations(instanceIndices.slice(0, picks.length));
    
    let bestTotalScore = -1;
    let bestAssignments: Map<number, number> = new Map();

    for (const permutation of permutations) {
      let totalScore = 0;
      const assignments = new Map<number, number>();
      
      for (let i = 0; i < picks.length; i++) {
        const pickIdx = picks[i].index;
        const instanceIdx = permutation[i];
        const score = scoreMatrix[i][instanceIdx].score;
        totalScore += score;
        assignments.set(pickIdx, instanceIdx);
      }
      
      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore;
        bestAssignments = assignments;
      }
    }

    const matchedPicks = new Set(picks.map(p => p.index));
    return { matchedPicks, assignments: bestAssignments };
  }

  // If we have more picks than instances, find optimal combination
  // Generate all combinations of selecting instances.length picks from picks.length picks
  const combinations = generateCombinations(picks.map((_, idx) => idx), instances.length);
  
  let bestTotalScore = -1;
  let bestCombination: number[] = [];
  let bestAssignments: Map<number, number> = new Map();

  // Try each combination
  for (const combination of combinations) {
    // For each combination, try all permutations of assigning picks to instances
    const selectedPicks = combination.map(idx => picks[idx]);
    
    // Generate all permutations of instance assignments
    const instanceIndices = instances.map((_, idx) => idx);
    const permutations = generatePermutations(instanceIndices);
    
    for (const permutation of permutations) {
      let totalScore = 0;
      const assignments = new Map<number, number>();
      
      for (let i = 0; i < selectedPicks.length; i++) {
        const pickIdx = selectedPicks[i].index;
        const instanceIdx = permutation[i];
        const score = scoreMatrix[combination[i]][instanceIdx].score;
        totalScore += score;
        assignments.set(pickIdx, instanceIdx);
      }
      
      if (totalScore > bestTotalScore) {
        bestTotalScore = totalScore;
        bestCombination = combination;
        bestAssignments = assignments;
      }
    }
  }

  const matchedPicks = new Set(bestCombination.map(idx => picks[idx].index));
  return { matchedPicks, assignments: bestAssignments };
}

// Helper function to generate all permutations
function generatePermutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  
  const permutations: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const head = items[i];
    const tail = items.slice(0, i).concat(items.slice(i + 1));
    const tailPermutations = generatePermutations(tail);
    for (const tailPerm of tailPermutations) {
      permutations.push([head, ...tailPerm]);
    }
  }
  return permutations;
}

export function useSetlistScoring() {
  const [isScoring, setIsScoring] = useState(false);
  const [scoringComplete, setScoringComplete] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  const scoreSubmissions = async (selectedShowToScore: string, onComplete?: () => void) => {
    if (!selectedShowToScore) {
      return;
    }

    try {
      setIsScoring(true);
      setScoringError(null);
      console.log("Beginning scoring process for show ID:", selectedShowToScore);

      // Step 1: Count total songs played at this show
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlist_entries')
        .select('entry_id')
        .eq('entry_show', selectedShowToScore);

      if (setlistError) {
        console.error('Error fetching setlist:', setlistError);
        throw new Error(`Failed to fetch setlist: ${setlistError.message}`);
      }

      const totalSongsPlayed = setlistData.length;
      console.log(`Total songs played at this show: ${totalSongsPlayed}`);

      // Step 2: Get actual setlist data (for more detailed processing)
      const { data: actualSetlistData, error: actualSetlistError } = await supabase
        .from('setlist_entries')
        .select('entry_id, entry_song, entry_set, entry_setnum, entry_placement, entry_new')
        .eq('entry_show', selectedShowToScore)
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true });

      if (actualSetlistError) {
        console.error('Error fetching actual setlist data:', actualSetlistError);
        throw actualSetlistError;
      }

      console.log("Fetched actual setlist data:", actualSetlistData);

      // Step 3: Find the last song of the show
      const actualLastSong = actualSetlistData && actualSetlistData.length > 0
        ? actualSetlistData[actualSetlistData.length - 1]
        : null;

      if (actualLastSong) {
        console.log(`Actual last song: ${actualLastSong.entry_song}, Set ${actualLastSong.entry_set}, Position ${actualLastSong.entry_setnum}`);
      } else {
        console.log("No last song found");
      }

      // Step 4: Get all submissions for this show
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('setlist_game_submissions')
        .select('submission_id, user_id, total_songs_picked')
        .eq('show_id', selectedShowToScore);

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      console.log(`Found ${submissionsData.length} submissions to score`);

      // Step 5: For each submission, update total_songs_played and score picks
      for (const submission of submissionsData) {
        console.log(`\nScoring submission ${submission.submission_id} for user ${submission.user_id}`);
        let totalScore = 0;

        // Update total_songs_played
        await supabase
          .from('setlist_game_submissions')
          .update({ total_songs_played: totalSongsPlayed })
          .eq('submission_id', submission.submission_id);

        // Get all picks for this submission
        const { data: picksData, error: picksError } = await supabase
          .from('setlist_game_picks')
          .select('pick_id, song, set, setnum, placement')
          .eq('submission_id', submission.submission_id);

        if (picksError) {
          console.error('Error fetching picks:', picksError);
          continue; // Skip to next submission if there's an error
        }

        console.log(`Found ${picksData.length} picks to score`);

        // Sort picks by set and setnum for determining first/last picks
        const sortedPicks = [...picksData].sort((a, b) => {
          const setCompare = a.set.localeCompare(b.set);
          if (setCompare !== 0) return setCompare;
          return a.setnum - b.setnum;
        });

        // Create a dictionary of songs in setlist for quick lookup
        const setlistSongs = {};
        // Create a separate dictionary for new songs
        const setlistNewSongs = {
          "New Original Song": [],
          "New Cover Song": []
        };

        actualSetlistData.forEach(entry => {
          // Add to regular songs dictionary
          if (!setlistSongs[entry.entry_song]) {
            setlistSongs[entry.entry_song] = [];
          }
          setlistSongs[entry.entry_song].push({
            set: entry.entry_set,
            setnum: entry.entry_setnum,
            placement: entry.entry_placement
          });
          
          // Also add to new songs dictionary if it's a new song
          if (entry.entry_new === "New Original Song" || entry.entry_new === "New Cover Song") {
            if (!setlistNewSongs[entry.entry_new]) {
              setlistNewSongs[entry.entry_new] = [];
            }
            setlistNewSongs[entry.entry_new].push({
              set: entry.entry_set,
              setnum: entry.entry_setnum,
              placement: entry.entry_placement
            });
          }
        });

        // Separate regular picks from new song picks
        const regularPicks: any[] = [];
        const newOriginalPicks: Array<{ pick: any; index: number }> = [];
        const newCoverPicks: Array<{ pick: any; index: number }> = [];

        picksData.forEach((pick, index) => {
          if (pick.song === "[New Original Song]") {
            newOriginalPicks.push({ pick, index });
          } else if (pick.song === "[New Cover Song]") {
            newCoverPicks.push({ pick, index });
          } else {
            regularPicks.push(pick);
          }
        });

        // Score regular picks (existing logic)
        for (const pick of regularPicks) {
          let pickScore = 0;
          let resultString = 'not_played';
          console.log(`\nScoring pick: ${pick.song} in Set ${pick.set}, Position ${pick.setnum}, Placement ${pick.placement || 'None'}`);

          const songInstances = setlistSongs[pick.song] || [];
          console.log(`Checking for ${pick.song} in entry_song, found ${songInstances.length} instances`);

          if (songInstances.length > 0) {
            console.log(`Song was played ${songInstances.length} times in the setlist`);

            // Start with basic song match (2 points)
            pickScore = 2;
            resultString = 'correct_song';

            // Check for correct set match
            const correctSetMatch = songInstances.some(instance => pick.set === instance.set);
            let setAndPositionMatch = false;

            if (correctSetMatch) {
              console.log(`User picked correct set: ${pick.set}`);
              pickScore = 4;
              resultString = 'correct_song_set';

              // Check for correct setnum within that set
              setAndPositionMatch = songInstances.some(instance =>
                pick.set === instance.set && pick.setnum === instance.setnum
              );

              if (setAndPositionMatch) {
                console.log(`User picked correct setnum within set: ${pick.setnum}`);
                pickScore = 7;
                resultString = 'correct_song_set_setnum';
              }
            }

            // Check for special placements (Opener, Closer, Encore)
            const userPlacement = pick.placement || '';
            const hasOpener = userPlacement.includes('Opener');
            const hasCloser = userPlacement.includes('Closer');
            const hasEncore = userPlacement.includes('Encore');

            // Check if the song had the same placement in any instance
            const matchingPlacementInstance = songInstances.find(instance => {
              const actualPlacement = instance.placement || '';
              return (hasOpener && actualPlacement.includes('Opener')) ||
                (hasCloser && actualPlacement.includes('Closer')) ||
                (hasEncore && actualPlacement.includes('Encore'));
            });

            if (matchingPlacementInstance) {
              console.log(`User picked correct placement: ${userPlacement}`);

              // Check which special case applies based on the points awarded
              if (correctSetMatch && matchingPlacementInstance.set === pick.set) {
                if (setAndPositionMatch && matchingPlacementInstance.setnum === pick.setnum) {
                  // Correct song, set, setnum, and placement
                  pickScore = 10;
                  resultString = 'correct_song_set_setnum_openercloserencore';
                } else {
                  // Correct song, set, and placement
                  pickScore = 7;
                  resultString = 'correct_song_set_openercloserencore';
                }
              } else if (pickScore <= 2) {
                // Only the song and placement are correct (no set match)
                pickScore = 5;
                resultString = 'correct_song_openercloserencore';
              }
            }
          } else {
            console.log(`Song was not played in the setlist`);
          }

          // Add to total score
          totalScore += pickScore;
          console.log(`Score for this pick: ${pickScore}, result: ${resultString}`);

          // Update the pick's score and result
          await supabase
            .from('setlist_game_picks')
            .update({ score: pickScore, result: resultString })
            .eq('pick_id', pick.pick_id);
        }

        // Score new song picks using optimal matching
        const newSongTypes = [
          { picks: newOriginalPicks, instances: setlistNewSongs["New Original Song"], type: "New Original Song" },
          { picks: newCoverPicks, instances: setlistNewSongs["New Cover Song"], type: "New Cover Song" }
        ];

        for (const { picks, instances, type } of newSongTypes) {
          if (picks.length === 0) continue;

          console.log(`\nScoring ${picks.length} ${type} picks against ${instances.length} instances`);

          // Find optimal matching
          const { matchedPicks, assignments } = findOptimalMatching(
            picks,
            instances,
            actualSetlistData[0],
            actualLastSong,
            sortedPicks
          );

          // Score matched picks
          for (const pickWrapper of picks) {
            const pick = pickWrapper.pick;
            const pickIndex = pickWrapper.index;
            const isMatched = matchedPicks.has(pickIndex);

            if (isMatched) {
              const instanceIdx = assignments.get(pickIndex);
              if (instanceIdx === undefined || instanceIdx >= instances.length) {
                console.error(`Invalid instance index ${instanceIdx} for pick ${pick.pick_id}`);
                // Fallback: score as unmatched
                await supabase
                  .from('setlist_game_picks')
                  .update({
                    score: 0,
                    result: 'not_played',
                    showopener_correct: false,
                    showcloser_correct: false
                  })
                  .eq('pick_id', pick.pick_id);
                continue;
              }

              const instance = instances[instanceIdx];
              const isFirstPick = sortedPicks[0]?.pick_id === pick.pick_id;
              const isLastPick = sortedPicks[sortedPicks.length - 1]?.pick_id === pick.pick_id;

              const potential = calculatePotentialScore(
                pick,
                instance,
                isFirstPick,
                isLastPick,
                actualSetlistData[0],
                actualLastSong
              );

              totalScore += potential.score;
              console.log(`Score for ${type} pick: ${potential.score}, result: ${potential.result}`);

              // Update the pick's score and result
              await supabase
                .from('setlist_game_picks')
                .update({
                  score: potential.score,
                  result: potential.result,
                  showopener_correct: potential.showopenerBonus,
                  showcloser_correct: potential.showcloserBonus
                })
                .eq('pick_id', pick.pick_id);
            } else {
              // Unmatched pick gets 0 points
              console.log(`${type} pick not matched, scoring 0 points`);
              await supabase
                .from('setlist_game_picks')
                .update({
                  score: 0,
                  result: 'not_played',
                  showopener_correct: false,
                  showcloser_correct: false
                })
                .eq('pick_id', pick.pick_id);
            }
          }
        }

        // Step 6: Handle show opener/closer bonuses for regular songs
        // (New song bonuses are handled in optimal matching)
        if (sortedPicks.length > 0 && actualSetlistData && actualSetlistData.length > 0) {
          const firstPick = sortedPicks[0];
          const lastPick = sortedPicks[sortedPicks.length - 1];
          const actualFirstSong = actualSetlistData[0];

          // Check show opener bonus for regular songs
          if (firstPick.song !== "[New Original Song]" && firstPick.song !== "[New Cover Song]") {
            const isShowOpenerCorrect = firstPick.song === actualFirstSong.entry_song;

            if (isShowOpenerCorrect) {
              console.log(`User correctly picked the show opener: ${firstPick.song}`);

              // Get current score
              const { data: currentPickData } = await supabase
                .from('setlist_game_picks')
                .select('score')
                .eq('pick_id', firstPick.pick_id)
                .single();

              const currentPickScore = currentPickData?.score || 0;
              const showopenerBonus = 3;
              const newPickScore = currentPickScore + showopenerBonus;

              console.log(`Adding +${showopenerBonus} points to ${firstPick.song} (from ${currentPickScore} to ${newPickScore})`);

              totalScore += showopenerBonus;

              // Update the pick with new score and set showopener_correct to TRUE
              await supabase
                .from('setlist_game_picks')
                .update({
                  score: newPickScore,
                  showopener_correct: true
                })
                .eq('pick_id', firstPick.pick_id);
            }
          }

          // Check show closer bonus for regular songs
          if (actualLastSong && lastPick.song !== "[New Original Song]" && lastPick.song !== "[New Cover Song]") {
            const isShowCloserCorrect = lastPick.song === actualLastSong.entry_song;

            if (isShowCloserCorrect) {
              console.log(`User correctly picked the show closer: ${lastPick.song}`);

              // Get current score
              const { data: currentPickData } = await supabase
                .from('setlist_game_picks')
                .select('score')
                .eq('pick_id', lastPick.pick_id)
                .single();

              const currentPickScore = currentPickData?.score || 0;
              const showcloserBonus = 3;
              const newPickScore = currentPickScore + showcloserBonus;

              console.log(`Adding +${showcloserBonus} points to ${lastPick.song} (from ${currentPickScore} to ${newPickScore})`);

              totalScore += showcloserBonus;

              // Update the pick with new score and set showcloser_correct to TRUE
              await supabase
                .from('setlist_game_picks')
                .update({
                  score: newPickScore,
                  showcloser_correct: true
                })
                .eq('pick_id', lastPick.pick_id);
            }
          }
        }

        // Step 7: Apply penalty for excess picks
        if (submission.total_songs_picked > totalSongsPlayed) {
          const excessSongs = submission.total_songs_picked - totalSongsPlayed;
          const penalty = excessSongs * 3;

          console.log(`Applying penalty of -${penalty} points for ${excessSongs} excess songs`);

          totalScore -= penalty;
        }

        // Step 8: Update submission's total score
        console.log(`Final score for submission: ${totalScore} points`);

        await supabase
          .from('setlist_game_submissions')
          .update({ score: totalScore })
          .eq('submission_id', submission.submission_id);
      }

      // Step 9: Mark the show as scored
      const { error: updateError } = await supabase
        .from('shows')
        .update({ show_scored: true })
        .eq('show_id', selectedShowToScore);

      if (updateError) {
        console.error('Error updating show_scored:', updateError);
        throw updateError;
      }

      console.log("Scoring completed successfully!");
      setScoringComplete(true);

      // Step 10: Call completion callback
      if (onComplete) {
        setTimeout(() => {
          onComplete();
          setScoringComplete(false);
        }, 2000);
      }

    } catch (error) {
      console.error('Error scoring submissions:', error);
      setScoringError(error?.message || 'Failed to score submissions. Please try again.');
    } finally {
      setIsScoring(false);
    }
  };

  return {
    isScoring,
    scoringComplete,
    scoringError,
    scoreSubmissions
  };
}
