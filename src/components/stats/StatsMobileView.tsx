import React from 'react';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong, LongestSong, LiberatedSong, ShowStat } from '../../types/home';
import { StatTable } from './StatTable';
import { LongestSongsTable } from './LongestSongsTable';
import { LiberatedSongsTable } from './LiberatedSongsTable';
import { ShowStatTable } from './ShowStatTable';
import { getRarityColor, getGapColor } from '../../utils/tourUtils';

interface StatsMobileViewProps {
  selectedYear: number | string;
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
}

export const StatsMobileView: React.FC<StatsMobileViewProps> = ({
  selectedYear,
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
  highestRatedShows
}) => {
  const showEmptyState = selectedYear !== 'all-time';

  return (
    <div className="md:hidden">
      <StatTable
        title="Top Songs Played"
        bgColor="bg-fourth"
        items={topSongs}
        getDisplayName={(item) => item.song}
        getCount={(item) => item.play_count}
        showEmptyState={showEmptyState}
      />
      <StatTable
        title="Top Show Openers"
        bgColor="bg-[#047857]"
        items={showOpeners}
        getDisplayName={(item) => item.song_name}
        getCount={(item) => item.times_played}
        showEmptyState={showEmptyState}
      />
      <StatTable
        title="Top Set Openers"
        bgColor="bg-[#10b981]"
        items={setOpeners}
        getDisplayName={(item) => item.song_name}
        getCount={(item) => item.times_played}
        showEmptyState={showEmptyState}
      />
      <StatTable
        title="Top Set Closers"
        bgColor="bg-[#3b82f6]"
        items={setClosers}
        getDisplayName={(item) => item.song_name}
        getCount={(item) => item.times_played}
        showEmptyState={showEmptyState}
      />
      <StatTable
        title="Top Encores"
        bgColor="bg-[#be123c]"
        items={encores}
        getDisplayName={(item) => item.song_name}
        getCount={(item) => item.times_played}
        showEmptyState={showEmptyState}
      />
      {selectedYear !== 'all-time' && (
        <StatTable
          title="Most Common Not Played"
          bgColor="bg-fifth"
          items={notPlayedSongs}
          getDisplayName={(item) => item.song}
          getCount={(item) => item.play_count}
          showEmptyState={showEmptyState}
        />
      )}
      <LongestSongsTable items={longestSongs} showEmptyState={showEmptyState} />
      <LiberatedSongsTable items={liberatedSongs} showEmptyState={showEmptyState} />
      <ShowStatTable
        title="Longest Shows"
        bgColor="bg-tertiary text-fifth"
        items={longestShows}
        showLengthRank={true}
        showEmptyState={showEmptyState}
      />
      <ShowStatTable
        title="Shows With Rarest Setlist"
        bgColor="bg-tertiary text-fifth"
        items={lowestRarityShows}
        valueFormatter={(value) => (
          <span
            className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
            style={{ backgroundColor: getRarityColor(value as string) }}
          >
            {value}
          </span>
        )}
        showEmptyState={showEmptyState}
      />
      <ShowStatTable
        title="Shows With Longest Average Show Gap"
        bgColor="bg-tertiary text-fifth"
        items={highestGapShows}
        valueFormatter={(value) => (
          <span
            className="text-white font-normal px-1.5 py-[1px] rounded-md inline-block"
            style={{ backgroundColor: getGapColor(value as string) }}
          >
            {value}
          </span>
        )}
        showEmptyState={showEmptyState}
      />
      <ShowStatTable
        title="Most Attended Shows"
        bgColor="bg-tertiary text-fifth"
        items={highestAttendedShows}
        showEmptyState={showEmptyState}
      />
      <ShowStatTable
        title="Highest Rated Shows"
        bgColor="bg-tertiary text-fifth"
        items={highestRatedShows}
        isLast={true}
        showEmptyState={showEmptyState}
      />
    </div>
  );
};

