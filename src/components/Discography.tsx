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
  releaseDate?: string;
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
            category,
            category_releasedate
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
            releaseDate: album.category_releasedate || undefined,
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
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Discography</h1>
        <div className="relative" ref={dropdownRef}>
          <div className="md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-lg bg-[#f9ae37] text-black hover:bg-[#f9ae37]/90 transition-colors border border-black"
            >
              <Search className="w-6 h-6" />
            </button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Select Album"
            >
              <div className="space-y-0">
                <div className="divide-y divide-black/10">
                  {albums.map((album) => (
                    <button
                      key={album.category}
                      onClick={() => scrollToAlbum(album.category)}
                      className="w-full text-left px-4 py-1 text-sm rounded-lg hover:bg-black/10 transition-colors font-semibold"
                    >
                      <span className="text-black">{album.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 pt-2 pb-1.5 rounded-lg border border-black hover:bg-tertiary transition-colors text-base font-mohr"
            >
              Select Release
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto right-0 w-64 max-h-96">
              {albums.map((album) => (
                <button
                  key={album.category}
                  onClick={() => scrollToAlbum(album.category)}
                  className="w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors"
                >
                  {album.category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading albums...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
          <p className="text-black">No albums found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.title}
              ref={el => albumRefs.current[album.category] = el}
              className="bg-primary border border-black rounded-lg overflow-hidden hover:border-black/70 transition-colors"
            >
              <div className="aspect-square">
                <img
                  src={album.artwork}
                  alt={`${album.title} album cover`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-black">{album.title}</h3>
                <p className="text-black/70 font-semibold text-sm">{album.artist}</p>
                {album.releaseDate && (
                  <p className="text-black/70 text-xs mb-2">
                    {new Date(album.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                {!album.releaseDate && <div className="mb-2" />}

                {album.tracks.length > 0 && (
                  <>
                    <ol className="list-none">
                      {album.tracks.map((track) => (
                        <li
                          key={`${album.title}-${track.name}-${track.id}`}
                          className="text-sm text-black relative pl-8 flex"
                        >
                          <span className="absolute left-0 top-0 text-black/70 w-5 text-right">
                            {Number(track.song_categoryorder)}. {/* Display song_categoryorder */}
                          </span>
                          <button
                            onClick={() => navigate(`/song/${track.id}`)}
                            className="font-bold hover:underline hover:text-[#a9682e] transition-colors text-left"
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