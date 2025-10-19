import { supabase } from '../../lib/supabase';
import { SongPick, SongSelectionModalProps } from './types';
import { calculateTimeRemaining, getPlacement } from './utils';

export const createSubmissionHandler = (
  user: any,
  show: SongSelectionModalProps['show'],
  songPicks: SongPick[],
  isEditing: boolean,
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>,
  onClose: () => void
) => {
  return async () => {
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
};
