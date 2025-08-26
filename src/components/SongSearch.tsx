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
        // First get the total count
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('song_placeholder', false);
        
        if (countError) {
          console.error('Error fetching count:', countError);
          throw countError;
        }
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select('song, song_id')
            .eq('song_placeholder', false)
            .order('song', { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`Error fetching batch ${i + 1}:`, error);
            throw error;
          }
          
          if (data) {
            allData = [...allData, ...data];
          }
        }
        
        if (allData.length > 0) {
          const mappedSongs = allData.map(s => ({ song: s.song, song_id: s.song_id }));
          setAllSongs(mappedSongs);
        } else {
          console.warn('❌ No data returned from query');
          setAllSongs([]);
        }
      } catch (error) {
        console.error('❌ Error in fetchAllSongs:', error);
        setAllSongs([]);
      }
    }

    fetchAllSongs();
  }, []);

  const filteredSongs = React.useMemo(() => {
    const filtered = allSongs.filter(song =>
      song.song.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
  }, [allSongs, searchTerm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="md:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-md bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Song"
        >
          <div className="space-y-0">
            <div className="sticky -top-4 bg-primary py-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-4 py-2 rounded-md border border-secondary bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary"
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
                  className="w-full text-left px-4 py-1 text-sm rounded-md hover:bg-black/10 transition-colors font-medium text-fifth"
                >
                  {song.song}
                </button>
              ))}
              {filteredSongs.length === 0 && (
                <div className="px-4 py-2 text-sm text-fifth/60 italic">
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
          className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
        >
          {selectedSong || 'Search'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-64 max-h-96'
        }`}>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-fifth text-sm focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
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
                className="w-full text-left px-4 py-1 text-sm text-fifth font-medium leading-[1rem] hover:bg-canvas transition-colors"
              >
                {song.song}
              </button>
            ))}
            {filteredSongs.length === 0 && (
              <div className="px-4 py-2 text-sm text-fifth/60 italic">
                No songs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}