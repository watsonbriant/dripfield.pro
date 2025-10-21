export interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string; 
}

export interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_detail: string | null;
  show_subvenue: string;
  show_venue_location: string;
  show_alert: string | null;
  show_coachnotes: string | null;
  show_canonid: number | null;
  show_tour: string | null;
  show_callbacks: string | null;
  tour_showfields: boolean;
  tour_id: string;
  show_wl_link?: string | null; 
  rating_visibility?: boolean;
  show_rarity?: number | null;
  show_gap?: number | null;
  show_listcategorycomplete?: string | null;
  show_jivecomplete?: boolean;
  show_dripfieldcomplete?: boolean;
}

export interface SetlistEntry {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string;
  entry_coachnotes: string | null;
  entry_setorder: number;
  entry_show: string;
  song_tour_count: string | null;
  last_count: string | null;
  song_id: string;
  last_show_id: string | null;
  last_show_tour: string | null;
  last_show_subvenue: string | null;
  last_venue: string | null;
  last_venue_location: string | null;
  last_show_date: string | null;
  times_played: string | null;
  shows_since_debut: string | null;
  song_rarity_percentage: string | null;
  times_played_num: number | null;
  shows_since_debut_num: number | null;
  guests: {
    guest_display_name: string;
    guest_id: string;
    guest_canonid: number;
    guest_instrument: string; 
  }[];
  song_category: string;
  category_canonid: number;
  joty_round?: string | null;
  songs: {
    song_id: string;
    song_category: string;
    song_originalartist: string | null;
    categories: {
      category_canonid: number;
      category_artwork: string | null;
    };
  };
}

export interface GuestGroup {
  color: string;
  guests: Guest[];
}

export interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_canonid: number | null;
}

export interface FullSetlistDisplayProps {
  setlist: SetlistEntry[] | undefined;
  show: Show | undefined;
  showCoachNotes: boolean;
  showDates?: ShowDate[]; 
  navigateToVenue?: () => void;
  showId?: string;
  openChangesModal?: boolean;
  setOpenChangesModal?: (open: boolean) => void;
  showLengthRank?: number | null;
  scrollToReleases?: boolean;
}

export interface ShowPosition {
  current: number; 
  total: number;
  prevShowId: string | null;
  nextShowId: string | null;
}

export interface ModalSongData {
  isOpen: boolean;
  songName: string;
}

export interface ShowData {
  show_id: string;
  show_date: string;
  show_group: string;
  show_venue_location: string;
  show_canonid: number | null;
}

export interface SetlistEntryData {
  entry_id: string;
  entry_set: string | null;
  entry_setnum: number;
  entry_setorder: number;
  entry_song: string | null;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string | null;
  entry_coachnotes: string | null;
  entry_new: string | null;
  entry_show: string;
}