import React from 'react';
import { Save, Edit } from 'lucide-react';

interface SongData {
  song: string;
  song_id: string;
  song_category: string | null;
  song_originalartist: string | null;
  song_categoryorder: number | null;
  song_coachnotes: string | null;
}

interface CategoryData {
  category: string;
}

interface ArtistData {
  artist: string;
}

interface SongDetailsFormProps {
  selectedSong: SongData;
  editedSong: SongData | null;
  isEditing: boolean;
  isSubmitting: boolean;
  categories: CategoryData[];
  artists: ArtistData[];
  onToggleEdit: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SongDetailsForm: React.FC<SongDetailsFormProps> = ({
  selectedSong,
  editedSong,
  isEditing,
  isSubmitting,
  categories,
  artists,
  onToggleEdit,
  onInputChange
}) => {
  return (
    <div className='px-2'>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm text-fifth font-medium">{selectedSong.song}</h4>
        <button
          onClick={onToggleEdit}
          disabled={isSubmitting}
          className="px-2 py-0.5 font-medium transition-colors text-xs flex items-center justify-center border bg-fourth text-white border-fourth hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4" />
              Save
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Edit
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-fifth mb-0.5">Song Title</label>
          <input
            type="text"
            name="song"
            value={editedSong?.song || ''}
            onChange={onInputChange}
            readOnly={!isEditing}
            className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-fifth mb-0.5">Category</label>
          {isEditing ? (
            <select
              name="song_category"
              value={editedSong?.song_category || ''}
              onChange={onInputChange}
              className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editedSong?.song_category || ''}
              readOnly
              className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
            />
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-fifth mb-0.5">Original Artist</label>
          {isEditing ? (
            <select
              name="song_originalartist"
              value={editedSong?.song_originalartist || ''}
              onChange={onInputChange}
              className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
            >
              <option value="">-- Select Artist --</option>
              {artists.map((artist) => (
                <option key={artist.artist} value={artist.artist}>
                  {artist.artist}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editedSong?.song_originalartist || ''}
              readOnly
              className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
            />
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-fifth mb-0.5">Category Order</label>
          <input
            type="number"
            name="song_categoryorder"
            value={editedSong?.song_categoryorder === null ? '' : editedSong?.song_categoryorder}
            onChange={onInputChange}
            readOnly={!isEditing}
            className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-fifth mb-0.5">Coach's Notes</label>
          <textarea
            name="song_coachnotes"
            value={editedSong?.song_coachnotes || ''}
            onChange={onInputChange}
            readOnly={!isEditing}
            rows={4}
            className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
          />
        </div>
      </div>
    </div>
  );
};
