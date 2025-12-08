import React from 'react';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong, LongestSong, LiberatedSong, ShowStat } from '../../types/home';
import { StatTable } from './StatTable';
import { LongestSongsTable } from './LongestSongsTable';
import { LiberatedSongsTable } from './LiberatedSongsTable';
import { ShowStatTable } from './ShowStatTable';
import { getRarityColor, getGapColor } from '../../utils/tourUtils';
import logo7HeaderImage from '../../img/Logo7-2_Header.jpg';

interface StatsDesktopViewProps {
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

export const StatsDesktopView: React.FC<StatsDesktopViewProps> = ({
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
    <div className="hidden md:block">
      <div className="grid grid-cols-3">
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
        {selectedYear === 'all-time' ? (
          <LongestSongsTable items={longestSongs} showAllTimeBorder={true} showEmptyState={false} />
        ) : (
          <StatTable
            title="Most Common Not Played"
            bgColor="bg-fifth"
            items={notPlayedSongs}
            getDisplayName={(item) => item.song}
            getCount={(item) => item.play_count}
            showEmptyState={showEmptyState}
          />
        )}
      </div>
      {selectedYear !== 'all-time' && (
        <div className="grid" style={{ gridTemplateColumns: '40% 60%' }}>
          <LongestSongsTable items={longestSongs} showEmptyState={showEmptyState} />
          <LiberatedSongsTable items={liberatedSongs} isLast={true} showEmptyState={showEmptyState} />
        </div>
      )}
      {selectedYear === 'all-time' && (
        <div className="grid" style={{ gridTemplateColumns: '100%' }}>
          <LiberatedSongsTable items={liberatedSongs} isLast={true} showEmptyState={false} />
        </div>
      )}
      <div className="grid grid-cols-3 border-t-[1px] border-fifth">
        <ShowStatTable
          title="Longest Shows"
          bgColor="bg-tertiary text-fifth"
          items={longestShows}
          showLengthRank={true}
          showEmptyState={showEmptyState}
        />
        <ShowStatTable
          title="Shows with Rarest Setlist"
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
          title="Shows with Longest Average Show Gap"
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
          showEmptyState={showEmptyState}
        />
        <div className="pb-1 border-x-[0.5px] bg-canvas border-y-[0.5px] border-fourth">
          <div className="p-2 flex items-center justify-center min-h-full">
            <img 
              src={logo7HeaderImage} 
              alt="Dripfield.pro Logo" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

