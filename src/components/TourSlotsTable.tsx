import React from 'react';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { SlotShowData, SongEntryWithId } from '../types/tourTypes';
import { getColumnBackgroundColor } from '../utils/tourUtils';

interface TourSlotsTableProps {
  slots: SlotShowData[];
  activeColumns: string[];
  onSongClick: (songName: string) => void;
}

export function TourSlotsTable({
  slots,
  activeColumns,
  onSongClick
}: TourSlotsTableProps) {

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
              onClick={() => onSongClick(song.song)}
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
    <div className="mt-4">
      <div className="bg-primary border border-fourth">
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
                    {column.split('_').map(word =>
                      word === 'Op' ? 'Opener' :
                        word === 'Cl' ? 'Closer' :
                          word
                    ).join(' ')}
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
    </div>
  );
}
