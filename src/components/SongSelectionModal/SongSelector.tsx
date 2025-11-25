import React from 'react';
import { Plus } from 'lucide-react';
import { Song } from './types';

interface SongSelectorProps {
  songs: Song[];
  selectedSong: string;
  setSelectedSong: (song: string) => void;
  onAddSong: () => void;
  onAddNewOriginalSong: () => void;
  onAddNewCoverSong: () => void;
  onAddSetBreak: () => void;
  onAddEncoreBreak: () => void;
  canAddSetBreak: boolean;
  canAddEncoreBreak: boolean;
  error: string | null;
}

export const SongSelector: React.FC<SongSelectorProps> = ({
  songs,
  selectedSong,
  setSelectedSong,
  onAddSong,
  onAddNewOriginalSong,
  onAddNewCoverSong,
  onAddSetBreak,
  onAddEncoreBreak,
  canAddSetBreak,
  canAddEncoreBreak,
  error
}) => {
  return (
    <>
      {/* Song selection */}
      <div className="flex gap-2">
        <div className="flex-1">
          <select
            value={selectedSong}
            onChange={(e) => setSelectedSong(e.target.value)}
            className="w-full px-2 py-0.5 bg-canvas border border-fourth text-sm text-fifth font-medium focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none"
          >
            <option value="">Select a song...</option>
            
            {/* Goose Songs Section */}
            <optgroup label="Goose Songs">
              {songs
                .filter(song => song.category_type === 'Goose' && !song.song.includes("[New") && !(song as any).song_placeholder)
                .map((song) => (
                  <option key={song.song_id} value={song.song}>
                    {song.song}
                  </option>
                ))}
            </optgroup>
            
            {/* Cover Songs Section */}
            <optgroup label="Cover Songs">
              {songs
                .filter(song => song.category_type === 'Cover Songs' && !song.song.includes("[New") && !(song as any).song_placeholder)
                .map((song) => (
                  <option key={song.song_id} value={song.song}>
                    {song.song}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        <button
          onClick={onAddSong}
          disabled={!selectedSong}
          className="px-2 py-0.5 bg-tertiary hover:bg-fourth/40 text-fifth font-semibold text-sm transition-colors disabled:bg-tertiary/50 disabled:cursor-not-allowed flex items-center gap-2 border border-fourth"
        >
          <Plus className="w-4 h-4" />
          <span className="md:inline hidden">Add Song</span>
          <span className="md:hidden inline">Add</span>
        </button>
      </div>
      
      {/* Break controls and special song buttons */}
      <div className="flex flex-wrap gap-1 justify-between">
        <div className="flex gap-1">
          <button
            onClick={onAddSetBreak}
            disabled={!canAddSetBreak}
            className="px-2 py-0.5 bg-[#f9ae37] hover:bg-[#f9ae37]/80 text-fifth font-medium rounded-md transition-colors disabled:bg-canvas/50 disabled:text-fifth/50 disabled:cursor-not-allowed text-xs border border-fourth"
          >
            Add Set Break
          </button>
          
          <button
            onClick={onAddEncoreBreak}
            disabled={!canAddEncoreBreak}
            className="px-2 py-0.5 bg-red-400 hover:bg-red-400/80 text-fifth font-medium rounded-md transition-colors disabled:bg-canvas/50 disabled:text-fifth/50 disabled:cursor-not-allowed text-xs border border-fourth"
          >
            Add Encore Break
          </button>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={onAddNewOriginalSong}
            className="px-2 py-0.5 bg-green-400 hover:bg-green-400/80 text-fifth font-medium rounded-md transition-colors border border-fourth text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="md:inline hidden">New Original Song</span>
            <span className="md:hidden inline">New Original Song</span>
          </button>
          
          <button
            onClick={onAddNewCoverSong}
            className="px-2 py-0.5 bg-blue-400 hover:bg-blue-400/80 text-fifth font-medium rounded-md transition-colors border border-fourth text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="md:inline hidden">New Cover Song</span>
            <span className="md:hidden inline">New Cover Song</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500 text-white px-2 py-1 text-xs font-medium border border-fourth/30">
          {error}
        </div>
      )}
    </>
  );
};
