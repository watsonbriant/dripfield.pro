import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { SlotData, SongEntryWithId } from '../types/userSlots';
import { getColumnBackgroundColor, formatColumnHeader, formatShowDate } from '../utils/userSlotsUtils';

interface SlotsTableProps {
  slots: SlotData[];
  activeColumns: string[];
  songIdMap: { [songName: string]: string };
}

const SlotsTable: React.FC<SlotsTableProps> = ({ slots, activeColumns, songIdMap }) => {
  const navigate = useNavigate();

  const renderSongList = (songs: SongEntryWithId[] | null) => {
    if (!songs || songs.length === 0) return null;

    return (
      <div
        className="w-full text-left"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
          whiteSpace: 'normal',
          hyphens: 'none'
        }}
      >
        {songs.map((song, index) => (
          <React.Fragment key={`${song.song}-${index}`}>
            {index > 0 && (
              <MoveRight className="text-red-500 inline w-[1rem] h-[0.75rem] leading-[0.75rem] mr-1" />
            )}
            <span
              onClick={() => {
                const songId = songIdMap[song.song];
                if (songId) {
                  navigate(`/song/${songId}`);
                }
              }}
              className={`text-fifth text-[0.625rem] leading-[0.75rem] font-medium transition-colors text-fifth table-link cursor-pointer inline ${
                index < songs.length - 1 ? 'mr-1' : ''
              }`}
            >
              {song.song}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          Slots
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-canvas">
              <th
                className="w-[65px] min-w-[65px] py-0.5 text-center text-sm font-medium text-fifth">
                Date
              </th>
              {activeColumns.map(column => (
                <th
                  key={column}
                  className="px-2 py-0.5 text-left text-sm font-medium text-white"
                  style={{
                    width: '190px',
                    minWidth: '190px',
                    backgroundColor: getColumnBackgroundColor(column)
                  }}
                >
                  {formatColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => (
              <tr
                key={`slot-${slot.show_id}`}
                className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
              >
                <td className="w-[65px] min-w-[65px] py-0.5 text-center whitespace-nowrap">
                  <span className="font-medium text-fifth">
                    <Link
                      to={`/setlist/${slot.show_id}`}
                      className="transition-colors table-link"
                    >
                      {slot.Show_Date
                        .split('-')
                        .slice(1)
                        .concat(slot.Show_Date.substring(2, 4))
                        .join('.')}
                    </Link>
                  </span>
                </td>
                {activeColumns.map(column => (
                  <td
                    key={`${slot.show_id}-${column}`}
                    className="px-2 py-0.5 text-left align-middle"
                    style={{
                      width: '190px',
                      minWidth: '190px',
                      maxWidth: '190px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'left'
                    }}
                  >
                    {renderSongList(slot[column] as SongEntryWithId[] | null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SlotsTable;
