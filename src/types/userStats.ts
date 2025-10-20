export interface TopSong {
  song: string;
  song_id: string;
  play_count: number;
  category_artwork?: string;
}

export interface LongestPerformance {
  song: string;
  song_id: string;
  show_date: string;
  show_id: string;
  length: string;
  length_seconds: number;
  venue_location?: string;
  category_artwork?: string;
}

export interface SlotSong {
  song_name: string;
  song_id: string;
  times_played: number;
  category_artwork?: string;
}

export interface NotSeenSong {
  song: string;
  song_id: string;
  play_count: number;
  category_artwork?: string;
}

export interface StatData {
  type: 'topSongs' | 'longestPerformances' | 'showOpeners' | 'setOpeners' | 'setClosers' | 'encoreSongs' | 'notSeenSongs';
  title: string;
  data: any[];
  loading: boolean;
  countKey?: string;
  showDate?: boolean;
  showLength?: boolean;
  songNameKey?: string;
  songIdKey?: string;
  bgColor?: string;
}

export interface UserStatsProps {
  userId?: string;
  showCopyButton?: boolean;
}
