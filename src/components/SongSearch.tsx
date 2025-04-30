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
          className="p-2 rounded-lg bg-[#fce7ca] text-primary hover:bg-[#fce7ca]/90 transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Search Songs"
        >
          <div className="space-y-0">
            <div className="sticky top-0 bg-primary pb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
            <div className="divide-y divide-white/10">
              {filteredSongs.map((song) => (
                <button
                  key={song.song_id}
                  onClick={() => {
                    setSelectedSong(song.song);
                    setIsModalOpen(false);
                    setSearchTerm('');
                    navigate(`/song/${song.song_id}`);
                  }}
                  className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors font-semibold"
                >
                  <span className="text-[#fce7ca]">{song.song}</span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </div>
      <div className="hidden md:block">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-1.5 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors text-sm whitespace-nowrap font-semibold"
        >
          {selectedSong || 'Search Songs'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 py-1 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed inset-x-4 top-[72px]' : 'w-64 max-h-96'
        }`}>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-border-primary bg-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border-primary/20">
            {filteredSongs.map((song) => (
              <button
                key={song.song_id}
                onClick={() => {
                  setSelectedSong(song.song);
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                  navigate(`/song/${song.song_id}`);
                }}
                className="w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors"
              >
                {song.song}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500 italic">
                No songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}