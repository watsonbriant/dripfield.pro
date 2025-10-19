import React from 'react';
import { SetOptions, SetnumOptions, PlacementOptions, SetlistEntryData } from '../../types/setlist';

interface BasicInfoSectionProps {
  sets: SetOptions[];
  setnums: SetnumOptions[];
  placements: PlacementOptions[];
  editedEntry: SetlistEntryData | null;
  isEditing: boolean;
  isNewEntry: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  sets,
  setnums,
  placements,
  editedEntry,
  isEditing,
  isNewEntry,
  handleInputChange
}) => {
  return (
    <>
      {/* Set */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Set</label>
        {isEditing || isNewEntry ? (
          <select
            name="entry_set"
            value={editedEntry?.entry_set === null ? "--" : editedEntry?.entry_set || "--"}
            onChange={handleInputChange}
            className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
            required
          >
            <option value="--">--</option>
            {sets.map((set) => (
              <option key={set.set} value={set.set}>
                {set.set}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedEntry?.entry_set || ''}
            readOnly
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          />
        )}
      </div>
      
      {/* Set Number */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Set Number</label>
        {isEditing || isNewEntry ? (
          <select
            name="entry_setnum"
            value={editedEntry?.entry_setnum === null ? "--" : editedEntry?.entry_setnum?.toString() || "--"}
            onChange={handleInputChange}
            className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
            required
          >
            <option value="--">--</option>
            {setnums.map((setnum) => (
              <option key={setnum.setnums} value={setnum.setnums}>
                {setnum.setnums}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedEntry?.entry_setnum || ''}
            readOnly
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          />
        )}
      </div>

      {/* Placement */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Placement</label>
        {isEditing || isNewEntry ? (
          <select
            name="entry_placement"
            value={editedEntry?.entry_placement === null ? "--" : editedEntry?.entry_placement || "--"}
            onChange={handleInputChange}
            className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          >
            <option value="--">--</option>
            {placements.map((placement) => (
              <option key={placement.placements} value={placement.placements}>
                {placement.placements}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedEntry?.entry_placement || ''}
            readOnly
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          />
        )}
      </div>
    </>
  );
};
