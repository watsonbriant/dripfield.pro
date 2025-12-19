import React from 'react';
import { SetlistEntryData } from '../../types/setlist';
import { formatTimeDisplay, getPlacementColor } from '../../utils/setlistUtils';

interface SetlistTableProps {
  setlistEntries: SetlistEntryData[];
  onEntrySelect: (entry: SetlistEntryData) => void;
}

export const SetlistTable: React.FC<SetlistTableProps> = ({
  setlistEntries,
  onEntrySelect
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-fourth/10">
            <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">S</th>
            <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">#</th>
            <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap">Song</th>
            <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap">Short</th>
            <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap">&gt;</th>
            <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">Placement</th>
            <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap">Length</th>
            <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth whitespace-nowrap">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {setlistEntries.map((entry, index) => (
            <tr 
              key={entry.entry_id} 
              className={`${
                index % 2 === 0 ? 'bg-primary' : 'bg-primary'
              } hover:bg-tertiary/40 transition-colors text-[0.625rem] cursor-pointer`}
              onClick={() => onEntrySelect(entry)}
            >
              <td className="px-2 font-light text-fifth whitespace-nowrap text-center">{entry.entry_set}</td>
              <td className="px-2 font-light text-fifth whitespace-nowrap text-center">{entry.entry_setnum}</td>
              <td className="px-2 text-fifth whitespace-nowrap font-medium">{entry.entry_song}</td>
              <td className="px-2 font-light text-fifth whitespace-nowrap">
                {entry.entry_short || ""}
              </td>
              <td className="px-2 font-light text-fifth whitespace-nowrap">
                {entry.entry_segue || ""}
              </td>
              <td className="px-2 text-fifth whitespace-nowrap">
                <div 
                  className="px-2 rounded-lg text-center font-medium"
                  style={{ 
                    backgroundColor: getPlacementColor(entry.entry_placement || ''),
                    color: getPlacementColor(entry.entry_placement || '') !== 'transparent' ? 'white' : 'black'
                  }}
                >
                  {entry.entry_placement || ""}
                </div>
              </td>
              <td className="px-2 font-light text-fifth text-center whitespace-nowrap">{formatTimeDisplay(entry.entry_length)}</td>
              <td className="px-2 font-light text-fifth whitespace-nowrap">
                {entry.entry_coachnotes || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};