import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Search } from 'lucide-react';
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
  const [isSongDropdownOpen, setIsSongDropdownOpen] = useState(false);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const songSearchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSongDropdownOpen(false);
      }
    };
    if (isSongDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSongDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isSongDropdownOpen && songSearchInputRef.current) {
      setTimeout(() => {
        songSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSongDropdownOpen]);

  // Filter and group songs by category
  const filteredSongsByCategory = React.useMemo(() => {
    // Filter songs based on search term and placeholder
    const filtered = songs.filter(song => {
      const matchesSearch = !songSearchTerm || 
        song.song.toLowerCase().includes(songSearchTerm.toLowerCase());
      const notPlaceholder = !(song as any).song_placeholder;
      return matchesSearch && notPlaceholder;
    });

    // Group by category
    const gooseSongs = filtered.filter(song => 
      song.category_type === 'Goose' || song.category_type === 'Goose Misc'
    );
    const tedTapesSongs = filtered.filter(song => 
      song.category_type === 'Ted Tapes'
    );
    const coverSongs = filtered.filter(song => 
      song.category_type === 'Cover Songs'
    );

    return [
      { category: 'Goose', songs: gooseSongs },
      { category: 'Ted Tapes', songs: tedTapesSongs },
      { category: 'Cover Songs', songs: coverSongs }
    ].filter(group => group.songs.length > 0);
  }, [songs, songSearchTerm]);

  const handleSongClick = (songName: string) => {
    setSelectedSong(songName);
    setIsSongDropdownOpen(false);
    setSongSearchTerm('');
  };

  return (
    <>
      {/* Song selection */}
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={dropdownRef}>
          <div
            className="w-full px-2 py-0.5 bg-canvas border border-fourth text-sm text-fifth font-medium focus:outline-none focus:ring-2 focus:ring-tertiary cursor-pointer flex items-center justify-between"
            onClick={() => setIsSongDropdownOpen(!isSongDropdownOpen)}
          >
            <span className={selectedSong ? 'text-fifth' : 'text-fifth/60'}>
              {selectedSong || 'Select a song...'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isSongDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isSongDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-canvas border border-fourth rounded-md shadow-lg">
              <div className="px-2 pt-1 pb-1.5">
                <div className="relative">
                  <input
                    ref={songSearchInputRef}
                    type="text"
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    placeholder="Search songs..."
                    className="w-full px-3 py-0.5 pr-8 rounded-md border border-fourth bg-tertiary/30 text-xs focus:outline-none focus:ring-1 focus:ring-tertiary text-fifth placeholder-black/60"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {filteredSongsByCategory.length > 0 ? (
                  <>
                    {filteredSongsByCategory.map((group) => (
                      <div key={group.category}>
                        <div className="px-3 py-0.5 bg-tertiary text-xs font-medium text-fifth sticky top-0">
                          {group.category}
                        </div>
                        {group.songs.map((song) => (
                          <div
                            key={song.song_id}
                            className={`px-3 hover:bg-tertiary/20 cursor-pointer text-[0.625rem] ${
                              selectedSong === song.song ? 'bg-tertiary/10' : ''
                            }`}
                            onClick={() => handleSongClick(song.song)}
                          >
                            {song.song}
                          </div>
                        ))}
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
