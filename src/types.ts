export interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_tour: string;
  show_subvenue: string;
  show_year: string;
  show_iscanon: boolean;
  show_alert?: string;
  show_detail?: string;
  show_coachnotes?: string;
  venue?: {
    venue: string;
    venue_location: string;
  };
  subvenue?: {
    subvenue: string;
  };
  setlist_entries: SetlistEntry[];
}

export interface SetlistEntry {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_length?: string;
  entry_placement?: string;
  entry_coachnotes?: string;
  song: {
    song: string;
    song_category: string;
    song_originalartist?: string;
  };
  guests?: Guest[];
  segue?: {
    segues: string;
  };
}

export interface Guest {
  guest: string;
  guest_instrument?: string;
  guest_displayname?: string;
}