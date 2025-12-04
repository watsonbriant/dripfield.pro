import React from 'react';
import { Link } from 'react-router-dom';
import { LongestSong } from '../../types/home';
import { formatTime, formatDate } from '../../utils/statsFormattingUtils';

interface LongestSongsTableProps {
  items: LongestSong[];
  isLast?: boolean;
  showAllTimeBorder?: boolean;
}

export const LongestSongsTable: React.FC<LongestSongsTableProps> = ({ items, isLast = false, showAllTimeBorder = false }) => {
  const baseClasses = isLast ? "pb-0 border-x-[0.5px] border-fourth" : "pb-1 border-x-[0.5px] border-fourth";
  const borderClasses = showAllTimeBorder ? "border-y-[0.5px] border-fourth" : "";
  const className = `${baseClasses} ${borderClasses}`.trim();
  
  return (
  <div className={className}>
    <div className="bg-[#3c1e40] text-white px-2 py-0.5 mb-0.5">
      <h3 className="text-sm font-medium">
        Longest Songs
      </h3>
    </div>
    <div className="overflow-y-auto max-h-64">
      <table className="w-full border-collapse min-w-max">
        <tbody>
          {items.map((song, index) => (
            <tr
              key={`${song.song}-${index}`}
              className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
            >
              <td className="pl-2 text-fifth">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/song/${song.song_id}`}
                    className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem]"
                  >
                    {song.song}
                  </Link>
                  {song.category_artwork && (
                    <img
                      src={song.category_artwork}
                      alt={`${song.song} artwork`}
                      className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </td>
              <td className="w-[50px] text-center font-medium text-fifth">
                {formatTime(song.entry_length)}
              </td>
              <td className="px-2 text-fifth font-light">
                {song.show_date && (
                  <>
                    {song.show_id ? (
                      <Link
                        to={`/setlist/${song.show_id}`}
                        className="font-medium cursor-pointer hover:underline"
                      >
                        {formatDate(song.show_date)}
                      </Link>
                    ) : (
                      <span className="font-medium">{formatDate(song.show_date)}</span>
                    )}
                    {song.venue_location && <span className="text-fifth/70 font-light">&nbsp;&nbsp;[{song.venue_location.replace(/[\[\]]/g, '')}]</span>}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

