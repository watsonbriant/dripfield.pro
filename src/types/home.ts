export interface Show {
  show_date: string;
  formatted_show_date: string;
  venue_location: string;
  show_subvenue: string;
  show_group: string;
  show_tour: string;
  show_detail: string | null;
  subvenue_venue?: string;
  show_iscanon?: boolean;
  show_id: string;
  venue_id?: string; // Added for venue navigation
}

export interface SetlistEntry {
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_placement: string;
  entry_setorder: number;
  entry_set: string;
  entry_setnum: number;
  songs: {
    song_id: string;
  };
}

export interface TopSong {
  song: string;
  song_id: string;
  play_count: number;
  category_canonid: number;
  category_artwork?: string;
}

export interface ShowOpener {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

export interface SetOpener {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

export interface SetCloser {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

export interface Encore {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

export interface NotPlayedSong {
  song: string;
  song_id: string;
  play_count: number;
  category_canonid: number;
  category_artwork?: string;
}
