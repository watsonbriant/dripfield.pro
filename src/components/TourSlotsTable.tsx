import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { SlotShowData, SongEntryWithId } from '../types/tourTypes';
import { cleanSongName, getColumnBackgroundColor } from '../utils/tourUtils';

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
              <MoveRight className="text-red-500 inline w-[1rem] h-[1rem] mr-1" />
            )}
            <a
              onClick={() => onSongClick(song.song)}
              className={`text-fifth text-[0.875rem] leading-[0.75rem] font-trad transition-colors text-fifth table-link cursor-pointer inline ${
                index < songs.length - 1 ? 'mr-1' : ''
              }`}
            >
              {cleanSongName(song.song)}
            </a>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 rounded-lg border border-secondary mb-2">
          Slots
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                <th
                  className="w-[85px] min-w-[85px] pr-2 py-1 text-center text-s font-semibold text-fifth">
                  Date
                </th>
                {activeColumns.map(column => (
                  <th
                    key={column}
                    className="px-2 py-1 text-left text-s font-semibold text-primary"
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
            <tbody className="divide-y divide-white/5">
              {slots.map((slot, index) => (
                <tr
                  key={`slot-${slot.show_id}`}
                  className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="w-[85px] min-w-[85px] pr-2 py-1 text-center whitespace-nowrap">
                    <span className="font-medium text-fifth">
                      <button
                        onClick={() => navigate(`/setlist/${slot.show_id}`)}
                        className="transition-colors table-link"
                      >
                        {slot.Show_Date
                          .split('-')
                          .slice(1)
                          .concat(slot.Show_Date.substring(2, 4))
                          .join('.')}
                      </button>
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
