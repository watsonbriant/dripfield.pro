export interface ChartPerformance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_tour: string | null;
  show_subvenue: string;
  show_venue_location: string;
  venue_id: string;
  tour_id: string | null;
}

export interface GuestPerformanceChartProps {
  performances: ChartPerformance[];
  selectedGroup: string | null;
  selectedSong: string | null;
  songShowMap: {
    [songName: string]: string[];
  };
}

export interface PerformanceWithFormattedDate {
  formattedDate: string;
  show_id: string;
  fullData: ChartPerformance;
}

export interface HoveredPerformance {
  formattedDate: string;
  show_id: string;
  fullData: ChartPerformance;
}

export type ViewMode = 'timeline' | 'table';
export type SortDirection = 'asc' | 'desc';
