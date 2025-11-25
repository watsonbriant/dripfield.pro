import React from 'react';
import { Link } from 'react-router-dom';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong } from '../types/home';

interface StatsSectionProps {
  selectedYear: number | string;
  setSelectedYear: (year: number | string) => void;
  topSongs: TopSong[];
  showOpeners: ShowOpener[];
  setOpeners: SetOpener[];
  setClosers: SetCloser[];
  encores: Encore[];
  notPlayedSongs: NotPlayedSong[];
  isAnyStatLoading: boolean;
  showYearSelector?: boolean;
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
  isAnyStatLoading,
  showYearSelector = true
}) => {

  const StatTable: React.FC<{
    title: string;
    bgColor: string;
    items: Array<{ song_id: string; song?: string; song_name?: string; play_count?: number; times_played?: number; category_artwork?: string }>;
    getDisplayName: (item: any) => string;
    getCount: (item: any) => number;
    isLast?: boolean;
  }> = ({ title, bgColor, items, getDisplayName, getCount, isLast = false }) => (
    <div className={isLast ? "mb-0" : "mb-1"}>
      <div className={`${bgColor} text-white px-2 py-0.5 mb-0.5`}>
        <h3 className="text-sm font-medium">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.song_id}
                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                  } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
              >
                <td className="pl-3 text-fifth">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/song/${item.song_id}`}
                      className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                    >
                      {getDisplayName(item)}
                    </Link>
                    {item.category_artwork && (
                      <img
                        src={item.category_artwork}
                        alt={`${getDisplayName(item)} artwork`}
                        className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </td>
                <td className="w-[30px] text-center font-medium text-fifth">
                  {getCount(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-primary pb-0.5 relative">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          {selectedYear === 'all-time' ? 'All-Time' : selectedYear} Stats
        </h2>
      </div>
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
        {/* Desktop view - vertical list */}
        <div className="hidden md:block">
          {topSongs.length > 0 && (
            <StatTable
              title="Top Songs Played"
              bgColor="bg-fourth"
              items={topSongs}
              getDisplayName={(item) => item.song}
              getCount={(item) => item.play_count}
            />
          )}
          {showOpeners.length > 0 && (
            <StatTable
              title="Top Show Openers"
              bgColor="bg-[#047857]"
              items={showOpeners}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {setOpeners.length > 0 && (
            <StatTable
              title="Top Set Openers"
              bgColor="bg-[#10b981]"
              items={setOpeners}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {setClosers.length > 0 && (
            <StatTable
              title="Top Set Closers"
              bgColor="bg-[#3b82f6]"
              items={setClosers}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {encores.length > 0 && (
            <StatTable
              title="Top Encores"
              bgColor="bg-[#be123c]"
              items={encores}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
            <StatTable
              title="Most Common Not Played"
              bgColor="bg-fifth"
              items={notPlayedSongs}
              getDisplayName={(item) => item.song}
              getCount={(item) => item.play_count}
              isLast={true}
            />
          )}
        </div>

        {/* Mobile view - single column */}
        <div className="md:hidden">
          {topSongs.length > 0 && (
            <StatTable
              title="Top Songs Played"
              bgColor="bg-fourth"
              items={topSongs}
              getDisplayName={(item) => item.song}
              getCount={(item) => item.play_count}
            />
          )}
          {showOpeners.length > 0 && (
            <StatTable
              title="Top Show Openers"
              bgColor="bg-[#047857]"
              items={showOpeners}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {setOpeners.length > 0 && (
            <StatTable
              title="Top Set Openers"
              bgColor="bg-[#10b981]"
              items={setOpeners}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {setClosers.length > 0 && (
            <StatTable
              title="Top Set Closers"
              bgColor="bg-[#3b82f6]"
              items={setClosers}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {encores.length > 0 && (
            <StatTable
              title="Top Encores"
              bgColor="bg-[#be123c]"
              items={encores}
              getDisplayName={(item) => item.song_name}
              getCount={(item) => item.times_played}
            />
          )}
          {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
            <StatTable
              title="Most Common Not Played"
              bgColor="bg-fifth"
              items={notPlayedSongs}
              getDisplayName={(item) => item.song}
              getCount={(item) => item.play_count}
              isLast={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
