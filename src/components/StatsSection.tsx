import React from 'react';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong, LongestSong, LiberatedSong, ShowStat } from '../types/home';
import { StatsDesktopView } from './stats/StatsDesktopView';
import { StatsMobileView } from './stats/StatsMobileView';

interface StatsSectionProps {
  selectedYear: number | string;
  setSelectedYear: (year: number | string) => void;
  topSongs: TopSong[];
  showOpeners: ShowOpener[];
  setOpeners: SetOpener[];
  setClosers: SetCloser[];
  encores: Encore[];
  notPlayedSongs: NotPlayedSong[];
  longestSongs: LongestSong[];
  liberatedSongs: LiberatedSong[];
  longestShows: ShowStat[];
  lowestRarityShows: ShowStat[];
  highestGapShows: ShowStat[];
  highestAttendedShows: ShowStat[];
  highestRatedShows: ShowStat[];
  isAnyStatLoading: boolean;
  showYearSelector?: boolean;
  hideHeader?: boolean;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  selectedYear,
  setSelectedYear,
  topSongs,
  showOpeners,
  setOpeners,
  setClosers,
  encores,
  notPlayedSongs,
  longestSongs,
  liberatedSongs,
  longestShows,
  lowestRarityShows,
  highestGapShows,
  highestAttendedShows,
  highestRatedShows,
  isAnyStatLoading,
  showYearSelector = true,
  hideHeader = false
}) => {
  return (
    <div className="bg-primary relative">
      {!hideHeader && (
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">
            {selectedYear === 'all-time' ? 'All-Time' : selectedYear} Stats
          </h2>
        </div>
      )}
      {showYearSelector && (
        <div className="px-2 pb-0.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all-time' ? 'all-time' : Number(e.target.value))}
            className="bg-fourth text-white px-4 border border-fourth hover:bg-tertiary hover:text-fifth transition-colors text-sm font-semibold appearance-none pr-10 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="all-time">All-Time</option>
            {Array.from({ length: 12 }, (_, i) => 2025 - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      <div className={`${isAnyStatLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
        <StatsDesktopView
          selectedYear={selectedYear}
          topSongs={topSongs}
          showOpeners={showOpeners}
          setOpeners={setOpeners}
          setClosers={setClosers}
          encores={encores}
          notPlayedSongs={notPlayedSongs}
          longestSongs={longestSongs}
          liberatedSongs={liberatedSongs}
          longestShows={longestShows}
          lowestRarityShows={lowestRarityShows}
          highestGapShows={highestGapShows}
          highestAttendedShows={highestAttendedShows}
          highestRatedShows={highestRatedShows}
        />
        <StatsMobileView
          selectedYear={selectedYear}
          topSongs={topSongs}
          showOpeners={showOpeners}
          setOpeners={setOpeners}
          setClosers={setClosers}
          encores={encores}
          notPlayedSongs={notPlayedSongs}
          longestSongs={longestSongs}
          liberatedSongs={liberatedSongs}
          longestShows={longestShows}
          lowestRarityShows={lowestRarityShows}
          highestGapShows={highestGapShows}
          highestAttendedShows={highestAttendedShows}
          highestRatedShows={highestRatedShows}
        />
      </div>
    </div>
  );
};
