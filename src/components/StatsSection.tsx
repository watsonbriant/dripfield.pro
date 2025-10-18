import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong } from '../types/home';
import { cleanSongName } from '../utils/songUtils';

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
  isAnyStatLoading
}) => {
  const navigate = useNavigate();

  const StatTable: React.FC<{
    title: string;
    bgColor: string;
    items: Array<{ song_id: string; song?: string; song_name?: string; play_count?: number; times_played?: number; category_artwork?: string }>;
    getDisplayName: (item: any) => string;
    getCount: (item: any) => number;
    isLast?: boolean;
  }> = ({ title, bgColor, items, getDisplayName, getCount, isLast = false }) => (
    <div className={isLast ? "mb-0" : "mb-6"}>
      <h3 className={`text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 ${bgColor}`}>
        {title}
      </h3>
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-white/5">
            {items.map((item, index) => (
              <tr
                key={item.song_id}
                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
              >
                <td className="pl-4 text-fifth">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/song/${item.song_id}`)}
                      className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                    >
                      {cleanSongName(getDisplayName(item))}
                    </button>
                    {item.category_artwork && (
                      <img
                        src={item.category_artwork}
                        alt={`${getDisplayName(item)} artwork`}
                        className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </td>
                <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
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
    <div className="bg-primary border border-secondary rounded-lg p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary mb-2">
          {selectedYear === 'all-time' ? 'All-Time' : selectedYear} Stats
        </h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value === 'all-time' ? 'all-time' : Number(e.target.value))}
          className="bg-tertiary text-fifth px-4 py-1.5 rounded-lg border border-secondary hover:bg-primary transition-colors text-base font-semibold appearance-none pr-10 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
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

      <div className={`${isAnyStatLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
        {/* Desktop view - 2 columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-4">
          <div>
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
            {setClosers.length > 0 && (
              <StatTable
                title="Top Set Closers"
                bgColor="bg-[#3b82f6]"
                items={setClosers}
                getDisplayName={(item) => item.song_name}
                getCount={(item) => item.times_played}
                isLast={true}
              />
            )}
          </div>
          
          <div>
            {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
              <StatTable
                title="Most Common Not Played"
                bgColor="bg-fifth"
                items={notPlayedSongs}
                getDisplayName={(item) => item.song}
                getCount={(item) => item.play_count}
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
            {encores.length > 0 && (
              <StatTable
                title="Top Encores"
                bgColor="bg-[#be123c]"
                items={encores}
                getDisplayName={(item) => item.song_name}
                getCount={(item) => item.times_played}
                isLast={true}
              />
            )}
          </div>
        </div>

        {/* Mobile view - single column */}
        <div className="md:hidden space-y-6">
          {topSongs.length > 0 && (
            <StatTable
              title="Top Songs Played"
              bgColor="bg-fourth"
              items={topSongs}
              getDisplayName={(item) => item.song}
              getCount={(item) => item.play_count}
            />
          )}
          {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
            <StatTable
              title="Most Common Not Played"
              bgColor="bg-fifth"
              items={notPlayedSongs}
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
              isLast={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
