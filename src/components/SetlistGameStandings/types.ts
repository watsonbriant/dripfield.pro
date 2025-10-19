export interface PlayerStats {
  username: string;
  userId: string;
  totalPoints: number;
  showsPlayed: number;
  avgPointsPerShow: number;
  songsPicked: number;
  setsPicked: number;
  showOpenersPicked: number;
  showClosersPicked: number;
}

export interface SetlistGameStandingsProps {
  activeLeague: string;
  user?: { id: string } | null;
}

export type SortField = keyof PlayerStats;
export type SortDirection = 'asc' | 'desc';
