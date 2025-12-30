export interface SongData {
  song: string;
  song_category: string;
  song_originalartist: string | null;
  song_coachnotes: string | null;
  song_lyrics: string | null;
  categories: {
    category_type: string;
    category_artwork?: string;
  };
}

export interface Performance {
  entry_id?: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_tour: string | null;
  entry_length: string | null;
  entry_placement: string;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_segue: string | null;
  entry_set: string;
  entry_setnum: number;
  entry_song: string;
  joty_round?: string | null;
  guests: {
    guest_display_name: string;
  }[];
}

export interface GroupCount {
  group: string;
  count: number;
}

export interface PlacementStat {
  placement: string;
  count: number;
  percentage: number;
  order?: number;
}

export interface Stats {
  groupCounts: GroupCount[];
  rarity: string;
  totalShows: number;
  hasRarity: boolean;
}

export interface LastPlayed {
  show_date: string;
  show_canonid: number;
  showsAgo: number;
  show_id: string;
}
