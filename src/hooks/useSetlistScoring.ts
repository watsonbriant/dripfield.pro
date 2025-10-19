import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ScoringState {
  isScoring: boolean;
  scoringComplete: boolean;
  scoringError: string | null;
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

        // Score each pick
        for (const pick of picksData) {
          let pickScore = 0;
          let resultString = 'not_played';
          console.log(`\nScoring pick: ${pick.song} in Set ${pick.set}, Position ${pick.setnum}, Placement ${pick.placement || 'None'}`);

          // Check if this is a New Original Song or New Cover Song pick
          const isNewSongPick = pick.song === "[New Original Song]" || pick.song === "[New Cover Song]";
          
          // Get song instances based on pick type
          let songInstances = [];
          if (isNewSongPick) {
            // For new song types, look in the new songs dictionary
            // Convert bracketed format to non-bracketed format for lookup
            const lookupKey = pick.song === "[New Original Song]" ? "New Original Song" : "New Cover Song";
            songInstances = setlistNewSongs[lookupKey] || [];
            console.log(`Checking for ${lookupKey} in entry_new, found ${songInstances.length} instances`);
          } else {
            // For regular songs, use normal lookup
            songInstances = setlistSongs[pick.song] || [];
            console.log(`Checking for ${pick.song} in entry_song, found ${songInstances.length} instances`);
          }

          if (songInstances.length > 0) {
            console.log(`${isNewSongPick ? "New song type" : "Song"} was ${isNewSongPick ? "found" : "played"} ${songInstances.length} times in the setlist`);

            // Start with basic song match (2 points)
            pickScore = 2;
            resultString = 'correct_song';

            // The rest of the scoring logic remains the same...
            // Check for correct set match
            const correctSetMatch = songInstances.some(instance => pick.set === instance.set);

            // Define setAndPositionMatch outside the if block so it's available in all scopes
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
            console.log(`${isNewSongPick ? "New song type" : "Song"} was not ${isNewSongPick ? "found" : "played"} in the setlist`);
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

        // Step 6a: Handle show opener bonus - NEW CODE
        const { data: firstPickData, error: firstPickError } = await supabase
          .from('setlist_game_picks')
          .select('pick_id, song, set, setnum, placement, score, result')
          .eq('submission_id', submission.submission_id)
          .order('set', { ascending: true })
          .order('setnum', { ascending: true })
          .limit(1);

        if (firstPickError) {
          console.error('Error getting first pick:', firstPickError);
        } else if (firstPickData && firstPickData.length > 0 && actualSetlistData && actualSetlistData.length > 0) {
          // Get the first song of the actual setlist
          const actualFirstSong = actualSetlistData[0];

          console.log(`User's first pick: ${firstPickData[0].song}, first song of show: ${actualFirstSong.entry_song}`);

          // Check if first pick matches actual first song
          const isShowOpenerCorrect = firstPickData[0].song === actualFirstSong.entry_song || 
          (firstPickData[0].song === "[New Original Song]" && actualFirstSong.entry_new === "New Original Song") ||
          (firstPickData[0].song === "[New Cover Song]" && actualFirstSong.entry_new === "New Cover Song");

          if (isShowOpenerCorrect) {
            console.log(`User correctly picked the show opener`);

            // Add show opener bonus to both pick and total score
            const currentPickScore = firstPickData[0].score || 0;
            const showopenerBonus = 3;
            const newPickScore = currentPickScore + showopenerBonus;

            console.log(`Adding +${showopenerBonus} points to ${firstPickData[0].song} (from ${currentPickScore} to ${newPickScore})`);

            totalScore += showopenerBonus;

            // Update the pick with new score and set showopener_correct to TRUE
            await supabase
              .from('setlist_game_picks')
              .update({
                score: newPickScore,
                showopener_correct: true
              })
              .eq('pick_id', firstPickData[0].pick_id);
          }
        }

        // Step 6b: Handle show closer bonus - EXISTING CODE
        const { data: lastPickData, error: lastPickError } = await supabase
          .from('setlist_game_picks')
          .select('pick_id, song, set, setnum, placement, score, result')
          .eq('submission_id', submission.submission_id)
          .order('set', { ascending: false })
          .order('setnum', { ascending: false })
          .limit(1);

        if (lastPickError) {
          console.error('Error getting last pick:', lastPickError);
        } else if (lastPickData && lastPickData.length > 0 && actualLastSong) {
          console.log(`User's last pick: ${lastPickData[0].song}, last song of show: ${actualLastSong.entry_song}`);

          // Check if last pick matches actual last song
          const isShowCloserCorrect = lastPickData[0].song === actualLastSong.entry_song ||
            (lastPickData[0].song === "[New Original Song]" && actualLastSong.entry_new === "New Original Song") ||
            (lastPickData[0].song === "[New Cover Song]" && actualLastSong.entry_new === "New Cover Song");

          if (isShowCloserCorrect) {
            console.log(`User correctly picked the show closer`);

            // Add show closer bonus to both pick and total score
            const currentPickScore = lastPickData[0].score || 0;
            const showcloserBonus = 3;
            const newPickScore = currentPickScore + showcloserBonus;

            console.log(`Adding +${showcloserBonus} points to ${lastPickData[0].song} (from ${currentPickScore} to ${newPickScore})`);

            totalScore += showcloserBonus;

            // Update the pick with new score and set showcloser_correct to TRUE
            await supabase
              .from('setlist_game_picks')
              .update({
                score: newPickScore,
                showcloser_correct: true
              })
              .eq('pick_id', lastPickData[0].pick_id);
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
