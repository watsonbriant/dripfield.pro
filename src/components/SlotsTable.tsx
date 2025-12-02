import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SlotData, SongEntryWithId } from '../types/userSlots';
import { getColumnBackgroundColor, formatColumnHeader, formatShowDate } from '../utils/userSlotsUtils';
import SongList from './SongList';

interface SlotsTableProps {
  slots: SlotData[];
  activeColumns: string[];
  songIdMap: { [songName: string]: string };
}

const SlotsTable: React.FC<SlotsTableProps> = ({ slots, activeColumns, songIdMap }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-white/10">
            <th 
              className="w-[85px] min-w-[85px] px-4 py-1 text-left text-s font-semibold text-fifth">
              Date
            </th>
            {activeColumns.map(column => (
              <th 
                key={column} 
                className="px-4 py-1 text-left text-s font-semibold text-white"
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
        <tbody className="divide-y divide-white/5">
          {slots.map((slot, index) => (
            <tr
              key={`slot-${slot.show_id}`}
              className={`${
                index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
              } hover:bg-tertiary/40 transition-colors text-xs`}
            >
              <td className="w-[85px] min-w-[85px] px-4 py-1 text-left text-s font-semibold text-fifth">
                <span className="font-medium">
                  <Link
                    to={`/setlist/${slot.show_id}`}
                    className="hover:underline transition-colors table-link"
                  >
                    {formatShowDate(slot.Show_Date)}
                  </Link>
                </span>
              </td>
              {activeColumns.map(column => (
                <td 
                  key={`${slot.show_id}-${column}`} 
                  className="px-4 py-1 text-left font-trad text-[0.875rem] leading-[0.75rem] align-middle"
                  style={{ 
                    width: '190px',
                    minWidth: '190px',
                    maxWidth: '190px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'left'
                  }}
                >
                  <SongList 
                    songs={slot[column] as SongEntryWithId[] | null}
                    songIdMap={songIdMap}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SlotsTable;
