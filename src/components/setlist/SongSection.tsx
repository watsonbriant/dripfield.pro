import React, { useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { SongOptions, SetlistEntryData } from '../../types/setlist';

interface SongSectionProps {
  songs: SongOptions[];
  songSearchTerm: string;
  setSongSearchTerm: (term: string) => void;
  isSongDropdownOpen: boolean;
  setIsSongDropdownOpen: (open: boolean) => void;
  selectedSongName: string;
  editedEntry: SetlistEntryData | null;
  isEditing: boolean;
  isNewEntry: boolean;
  handleSongSelection: (songName: string) => void;
}

export const SongSection: React.FC<SongSectionProps> = ({
  songs,
  songSearchTerm,
  setSongSearchTerm,
  isSongDropdownOpen,
  setIsSongDropdownOpen,
  selectedSongName,
  editedEntry,
  isEditing,
  isNewEntry,
  handleSongSelection
}) => {
  const songSearchInputRef = useRef<HTMLInputElement>(null);

  // Filtered songs based on search term
  const filteredSongs = React.useMemo(() => {
    if (!songSearchTerm) return songs;
    return songs.filter(song => 
      song.song.toLowerCase().includes(songSearchTerm.toLowerCase())
    );
  }, [songs, songSearchTerm]);

  useEffect(() => {
    if (isSongDropdownOpen && songSearchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        songSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSongDropdownOpen]);

  return (
    <div className="space-y-2 md:col-span-6">
      <label className="block text-sm font-medium text-fifth">Song</label>
      {isEditing || isNewEntry ? (
        <div className="relative">
          <div
            className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light cursor-pointer flex items-center justify-between"
            onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
          >
            <span className={selectedSongName ? 'text-fifth' : 'text-fifth/60'}>
              {selectedSongName || 'Select a song...'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isSongDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isSongDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-canvas border border-secondary rounded-md shadow-lg">
              <div className="p-2">
                <div className="relative">
                  <input
                    ref={songSearchInputRef}
                    type="text"
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    placeholder="Search songs..."
                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-xs focus:outline-none focus:ring-1 focus:ring-tertiary text-fifth placeholder-black/60"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {filteredSongs.length > 0 ? (
                  <>
                    {filteredSongs.map((song) => (
                      <div
                        key={song.song_id}
                        className={`px-3 py-0.5 hover:bg-tertiary/20 cursor-pointer text-xs ${
                          selectedSongName === song.song ? 'bg-tertiary/10' : ''
                        }`}
                        onClick={() => handleSongSelection(song.song)}
                      >
                        {song.song}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-fifth/60">
                    {songSearchTerm ? 'No songs found matching your search' : 'No songs available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={editedEntry?.entry_song || ''}
          readOnly
          className="w-full px-2 py-2 rounded-md border border-secondary bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-light"
        />
      )}
    </div>
  );
};
