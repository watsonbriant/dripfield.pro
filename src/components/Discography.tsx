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
  categoryType: string;
  releaseDate?: string;
  tracks: {
    name: string;
    id: string;
    song_categoryorder: number | string | null;
  }[];
}

interface GroupedAlbums {
  [key: string]: Album[];
}

export function Discography() {
  const navigate = useNavigate();
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Add the cleanSongName function from Tours component
  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

  // Function to get display name for category type groups
  const getCategoryTypeDisplayName = (categoryType: string): string => {
    if (categoryType === 'Goose Misc' || categoryType === 'Ted Tapes') {
      return 'Goose Miscellaneous';
    }
    return categoryType;
  };

  // Function to get the sort order for category types
  const getCategoryTypeSortOrder = (categoryType: string): number => {
    switch (categoryType) {
      case 'Goose':
        return 1;
      case 'Goose Misc':
      case 'Ted Tapes':
        return 2;
      case 'Goose-adjacent':
        return 3;
      default:
        return 999; // Put unknown types at the end
    }
  };

  // Group albums by category type with proper ordering
  const groupAlbumsByCategoryType = (albums: Album[]): GroupedAlbums => {
    const grouped = albums.reduce((acc: GroupedAlbums, album) => {
      const displayKey = getCategoryTypeDisplayName(album.categoryType);
      if (!acc[displayKey]) {
        acc[displayKey] = [];
      }
      acc[displayKey].push(album);
      return acc;
    }, {});

    // Sort albums within each group by their original order (category_canonid)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        // Assuming albums are already sorted by category_canonid from the query
        return albums.indexOf(a) - albums.indexOf(b);
      });
    });

    return grouped;
  };

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
            category_releasedate,
            category_type
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
              categoryType: album.category_type || '',
              tracks: []
            };
          }

          return {
            title: album.category_display_name || '',
            artist: album.category_release_artist || '',
            artwork: album.category_artwork || '',
            category: album.category || '',
            categoryType: album.category_type || '',
            releaseDate: album.category_releasedate || undefined,
            tracks: songData?.map(song => ({
              name: song.song,
              id: song.song_id,
              song_categoryorder: song.song_categoryorder,
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

  // Get grouped albums sorted by category type
  const groupedAlbums = groupAlbumsByCategoryType(albums);
  const sortedCategoryTypes = Object.keys(groupedAlbums).sort((a, b) => {
    // Get the first album from each group to determine the original category type for sorting
    const firstAlbumA = groupedAlbums[a][0];
    const firstAlbumB = groupedAlbums[b][0];
    return getCategoryTypeSortOrder(firstAlbumA.categoryType) - getCategoryTypeSortOrder(firstAlbumB.categoryType);
  });

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Discography</h1>
        <div className="relative" ref={dropdownRef}>
          <div className="md:hidden">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-lg bg-tertiary text-fifth hover:bg-tertiary/70 transition-colors border border-secondary"
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
                      <span className="text-fifth">{album.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
            >
              Select Release
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto right-0 w-64 max-h-96">
              {albums.map((album) => (
                <button
                  key={album.category}
                  onClick={() => scrollToAlbum(album.category)}
                  className="w-full text-left px-4 py-1 text-sm font-medium hover:bg-secondary transition-colors "
                >
                  {album.category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading albums...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth">No albums found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCategoryTypes.map((categoryTypeDisplay, groupIndex) => (
            <div key={categoryTypeDisplay}>
              {/* Category Type Header with Divider */}
              <div className="mb-6">
                <div className="flex items-center">
                  <div className="flex-grow h-px bg-secondary"></div>
                  <h2 className="mx-4 text-xl font-semibold text-fifth bg-tertiary border border-secondary rounded-lg px-3">
                    {categoryTypeDisplay}
                  </h2>
                  <div className="flex-grow h-px bg-secondary"></div>
                </div>
              </div>

              {/* Albums Grid for this Category Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groupedAlbums[categoryTypeDisplay].map((album) => (
                  <div
                    key={album.title}
                    ref={el => albumRefs.current[album.category] = el}
                    className="bg-primary border border-secondary rounded-lg overflow-hidden hover:border-secondary/70 transition-colors"
                  >
                    <div className="aspect-square">
                      <img
                        src={album.artwork}
                        alt={`${album.title} album cover`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-fifth">{album.title}</h3>
                      <p className="text-fifth/70 font-medium text-sm">{album.artist}</p>
                      {album.releaseDate && (
                        <p className="text-fifth/70 text-xs mb-2">
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
                                className="text-sm text-fifth relative pl-8 flex"
                              >
                                <span className="absolute left-0 top-0 text-fifth/70 w-5 text-right">
                                  {Number(track.song_categoryorder)}.
                                </span>
                                <button
                                  onClick={() => navigate(`/song/${track.id}`)}
                                  className="font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors text-left"
                                >
                                  {cleanSongName(track.name)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discography;