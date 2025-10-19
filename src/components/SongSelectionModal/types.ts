export interface SongSelectionModalProps {
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

export interface Song {
  song: string;
  song_id: string;
  category_type?: string;
}

export interface SetlistEntry {
  entry_id: string;
  entry_song: string;
  entry_set: string;
  entry_setnum: number;
  entry_placement?: string;
  entry_segue?: string;
  entry_length?: string;
}

export interface SongPick {
  id: string; // Unique ID for tracking
  song: string;
  set: string;
  setnum: number;
  placement?: string;
  isBreak?: boolean;
  score?: number;
  result?: string;
  showcloser_correct?: boolean;
  showopener_correct?: boolean;
}

export interface TimeRemainingResult {
  timeRemaining: string;
  isSelectionClosed: boolean;
}
