interface TourCount {
  tour: string;
  count: number;
  tour_canonid: number;
  tour_id: string;
}

interface AttendanceStatsData {
  showsCount: number;
  venuesCount: number;
  songsCount: number;
  tourCounts: TourCount[];
}

export type { TourCount, AttendanceStatsData };
