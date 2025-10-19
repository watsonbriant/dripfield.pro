import React from 'react';
import { SegueOptions, ShortOptions, SetlistEntryData } from '../../types/setlist';

interface SongDetailsSectionProps {
  segues: SegueOptions[];
  shorts: ShortOptions[];
  editedEntry: SetlistEntryData | null;
  isEditing: boolean;
  isNewEntry: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SongDetailsSection: React.FC<SongDetailsSectionProps> = ({
  segues,
  shorts,
  editedEntry,
  isEditing,
  isNewEntry,
  handleInputChange
}) => {
  return (
    <>
      {/* Short */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Short</label>
        {isEditing || isNewEntry ? (
          <select
            name="entry_short"
            value={editedEntry?.entry_short === null ? "--" : editedEntry?.entry_short || "--"}
            onChange={handleInputChange}
            className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          >
            <option value="--">--</option>
            {shorts.map((short) => (
              <option key={short.song_shorts} value={short.song_shorts}>
                {short.song_shorts}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedEntry?.entry_short || ''}
            readOnly
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          />
        )}
      </div>
      
      {/* Segue */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Segue</label>
        {isEditing || isNewEntry ? (
          <select
            name="entry_segue"
            value={editedEntry?.entry_segue === null ? "--" : editedEntry?.entry_segue || "--"}
            onChange={handleInputChange}
            className="font-light w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          >
            <option value="--">--</option>
            {segues.map((segue) => (
              <option key={segue.segues} value={segue.segues}>
                {segue.segues}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedEntry?.entry_segue || ''}
            readOnly
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
          />
        )}
      </div>
      
      {/* Length */}
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-medium text-fifth">Length (hh:mm:ss)</label>
        <input
          type="text"
          name="entry_length"
          value={editedEntry?.entry_length || ''}
          onChange={handleInputChange}
          readOnly={!isEditing && !isNewEntry}
          placeholder="00:00:00"
          className={`w-full px-2 py-2 rounded-md border ${isEditing || isNewEntry ? 'border-secondary bg-canvas' : 'border-secondary bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
        />
      </div>
    </>
  );
};
