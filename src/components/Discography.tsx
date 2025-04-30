import React, { useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { useNavigate } from 'react-router-dom';

interface Album {
  title: string;
  artist: string;
  artwork: string;
  category: string;
  tracks: {
    name: string;
    id: string;
    song_categoryorder: number | string | null; // Updated type
  }[];
}

export function Discography() {
  const navigate = useNavigate();
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToAlbum = (category: string) => {
    const albumRef = albumRefs.current[category];
    if (albumRef) {
      albumRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsDropdownOpen(false);
      setIsModalOpen(false);
    }
  };

  React.useEffect(() => {
    async function fetchAlbums() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            category_display_name,
            category_release_artist,
            category_artwork,
            category_canonid,
            category
          `)
          .order('category_canonid', { ascending: true })
          .not('category', 'ilike', '%Unreleased%')
          .not('category', 'eq', 'Cover Songs')
          .not('category', 'eq', 'Live Collaborations');

        if (error) {
          console.error('Error fetching albums:', error);
          setLoading(false);
          return;
        }

        if (!data) {
          setLoading(false);
          return;
        }

        const albumsWithTracks = await Promise.all(data.map(async (album) => {
          const { data: songData, error: songError } = await supabase
            .from('songs')
            .select(`
              song,
              song_id,
              song_categoryorder
            `)
            .eq('song_category', album.category)
            .order('song_categoryorder', { ascending: true });

          if (songError) {
            console.error('Error fetching songs:', songError);
            return {
              title: album.category_display_name || '',
              artist: album.category_release_artist || '',
              artwork: album.category_artwork || '',
              category: album.category || '',
              tracks: []
            };
          }

          return {
            title: album.category_display_name || '',
            artist: album.category_release_artist || '',
            artwork: album.category_artwork || '',
            category: album.category || '',
            tracks: songData?.map(song => ({
              name: song.song,
              id: song.song_id,
              song_categoryorder: song.song_categoryorder, // Keep the value
            })) || []
          };
        }));

        setAlbums(albumsWithTracks);
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Discography</h1>
        <div className="relative" ref={dropdownRef}>
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
              title="Select Album"
            >
              <div className="space-y-0">
                <div className="divide-y divide-white/10">
                  {albums.map((album) => (
                    <button
                      key={album.category}
                      onClick={() => scrollToAlbum(album.category)}
                      className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors font-semibold"
                    >
                      <span className="text-[#fce7ca]">{album.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-2 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors text-sm whitespace-nowrap"
            >
              Select Release
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-2 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 w-64 max-h-96 overflow-y-auto">
              {albums.map((album) => (
                <button
                  key={album.category}
                  onClick={() => scrollToAlbum(album.category)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors"
                >
                  {album.category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-[#fce7ca]/70">Loading albums...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#fce7ca]/70">No albums found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.title}
              ref={el => albumRefs.current[album.category] = el}
              className="bg-[#172330] border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
            >
              <div className="aspect-square">
                <img
                  src={album.artwork}
                  alt={`${album.title} album cover`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">{album.title}</h3>
                <p className="text-[#fce7ca]/70 text-sm mb-4">{album.artist}</p>

                {album.tracks.length > 0 && (
                  <>
                    <ol className="list-none space-y-1">
                      {album.tracks.map((track) => (
                        <li
                          key={`${album.title}-${track.name}-${track.id}`}
                          className="text-sm text-[#fce7ca]/90 relative pl-8 flex"
                        >
                          <span className="absolute left-0 top-0 text-[#fce7ca]/70 w-5 text-right">
                            {Number(track.song_categoryorder)}. {/* Display song_categoryorder */}
                          </span>
                          <button
                            onClick={() => navigate(`/song/${track.id}`)}
                            className="font-bold hover:text-white hover:underline transition-colors text-left"
                          >
                            {track.name}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discography;