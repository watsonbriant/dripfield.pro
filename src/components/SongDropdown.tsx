import React, { useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SongData {
  song: string;
  song_id: string;
  song_category: string | null;
  song_originalartist: string | null;
  song_categoryorder: number | null;
  song_coachnotes: string | null;
}

interface SongDropdownProps {
  songs: SongData[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSongSelect: (song: SongData) => void;
  selectedSong?: SongData | null;
}

export const SongDropdown: React.FC<SongDropdownProps> = ({
  songs,
  searchTerm,
  setSearchTerm,
  isOpen,
  setIsOpen,
  onSongSelect,
  selectedSong
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedSongRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Scroll to selected song when dropdown opens
  useEffect(() => {
    if (isOpen && selectedSong && selectedSongRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        if (selectedSongRef.current && scrollContainerRef.current) {
          selectedSongRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [isOpen, selectedSong]);

  const filteredSongs = songs.filter(song =>
    song.song.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
      >
        Song
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bg-primary border border-fourth shadow-xl z-50 w-64 max-h-96 overflow-y-auto">
          <div className="p-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-2 py-0.5 pr-8 border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
            </div>
          </div>
          <div ref={scrollContainerRef} className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {filteredSongs.map((song) => (
              <button
                key={song.song_id}
                ref={selectedSong && song.song_id === selectedSong.song_id ? selectedSongRef : null}
                onClick={() => onSongSelect(song)}
                className={`w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors ${
                  selectedSong && song.song_id === selectedSong.song_id ? 'bg-tertiary/40' : ''
                }`}
              >
                {song.song}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="px-2 py-0.5 text-xs text-fifth text-center">
                No songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
