import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';

interface SongBasic {
  song: string;
  song_id: string;
}

interface SongSearchProps {
  className?: string;
}

export function SongSearch({ className = '' }: SongSearchProps) {
  const navigate = useNavigate();
  const [allSongs, setAllSongs] = React.useState<SongBasic[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedSong, setSelectedSong] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    async function fetchAllSongs() {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('song, song_id')
          .order('song', { ascending: true });
    
        if (error) throw error;
        setAllSongs(data.map(s => ({ song: s.song, song_id: s.song_id })));
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    }

    fetchAllSongs();
  }, []);

  const filteredSongs = React.useMemo(() => {
    return allSongs.filter(song =>
      song.song.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSongs, searchTerm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="md:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors border border-black"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Song"
        >
          <div className="space-y-0">
            <div className="sticky top-0 bg-primary pb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-4 py-2 rounded-md border border-black bg-canvas text-black placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-[#a9682e]"
              />
            </div>
            <div className="divide-y divide-black/10">
              {filteredSongs.map((song) => (
                <button
                  key={song.song_id}
                  onClick={() => {
                    setSelectedSong(song.song);
                    setIsModalOpen(false);
                    setSearchTerm('');
                    navigate(`/song/${song.song_id}`);
                  }}
                  className="w-full text-left px-4 py-1 text-sm rounded-md hover:bg-black/10 transition-colors font-semibold text-black"
                >
                  {song.song}
                </button>
              ))}
              {filteredSongs.length === 0 && (
                <div className="px-4 py-2 text-sm text-black/60 italic">
                  No songs found
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
      <div className="hidden md:block">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black hover:bg-tertiary transition-colors text-base font-mohr"
        >
          {selectedSong || 'Search Songs'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-64 max-h-96'
        }`}>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-black text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {filteredSongs.map((song) => (
              <button
                key={song.song_id}
                onClick={() => {
                  setSelectedSong(song.song);
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                  navigate(`/song/${song.song_id}`);
                }}
                className="w-full text-left px-4 py-1 text-sm text-black font-semibold hover:bg-canvas transition-colors"
              >
                {song.song}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="px-4 py-2 text-sm text-black/60 italic">
                No songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}