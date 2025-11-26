import React, { useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});


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
      setSearchTerm('');
    }
  };

  const filteredAlbums = React.useMemo(() => {
    return albums.filter(album =>
      album.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [albums, searchTerm]);

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
    <div className="max-w-[1280px]">
      <div className="mb-4">
        <div className="bg-primary border border-fourth">
          <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
            <h1 className="text-sm font-semibold pl-2">
              Discography
            </h1>
            <div className="relative" ref={dropdownRef}>
              <div className="md:hidden">
                <div className="relative">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-1.5 py-0.5 pr-8 rounded-md border border-fourth bg-canvas font-semibold text-fifth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary text-left flex items-center"
                  >
                    Search
                  </button>
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-fifth pointer-events-none" />
                </div>
                <Modal
                  isOpen={isModalOpen}
                  onClose={() => {
                    setIsModalOpen(false);
                    setSearchTerm('');
                  }}
                  title="Select Album"
                >
                  <div className="space-y-0">
                    <div className="sticky bg-primary py-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search albums..."
                        className="w-full px-1.5 py-0.5 text-sm rounded-md border border-fourth bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary"
                      />
                    </div>
                    <div>
                      {filteredAlbums.map((album) => (
                        <button
                          key={album.category}
                          onClick={() => scrollToAlbum(album.category)}
                          className="w-full text-left px-2 py-1 text-xs leading-[0.875rem] hover:bg-black/10 transition-colors font-medium text-fifth"
                        >
                          {album.category}
                        </button>
                      ))}
                      {filteredAlbums.length === 0 && (
                        <div className="px-2 py-1 text-xs text-fifth italic">
                          No albums found
                        </div>
                      )}
                    </div>
                  </div>
                </Modal>
              </div>
              <div className="hidden md:block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-canvas text-fifth px-1.5 py-0.5 rounded-lg border border-fourth hover:bg-primary transition-colors text-xs font-semibold"
                >
                  Search
                  <Search className="w-3 h-3" />
                </button>
              </div>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-canvas border border-fourth shadow-lg z-50 overflow-y-auto right-0 w-64 max-h-96">
                  <div className="p-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search albums..."
                        className="w-full px-1.5 py-0.5 pr-8 rounded-md border border-fourth bg-primary text-fifth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-fifth" />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredAlbums.map((album) => (
                      <button
                        key={album.category}
                        onClick={() => scrollToAlbum(album.category)}
                        className="w-full text-left px-2 py-1 text-xs leading-[0.875rem] text-fifth font-medium hover:bg-primary transition-colors"
                      >
                        {album.category}
                      </button>
                    ))}
                    {filteredAlbums.length === 0 && (
                      <div className="px-2 py-1 text-xs text-fifth italic">
                        No albums found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading albums...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">No albums found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategoryTypes.map((categoryTypeDisplay) => (
            <div key={categoryTypeDisplay}>
              {/* Category Type Header */}
              <div className="mb-4">
                <div className="bg-primary border border-fourth">
                  <div className="bg-fourth text-white px-2 py-0.5">
                    <h2 className="text-sm font-semibold">
                      {categoryTypeDisplay}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Albums Grid for this Category Type */}
              <div className={`grid gap-4 ${
                categoryTypeDisplay === 'Goose Miscellaneous' || categoryTypeDisplay === 'Goose-adjacent'
                  ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
                  : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {groupedAlbums[categoryTypeDisplay].map((album) => (
                  <div
                    key={album.title}
                    ref={el => albumRefs.current[album.category] = el}
                    className="bg-primary border border-fourth overflow-hidden hover:border-fourth/70 transition-colors"
                  >
                    <div className="aspect-square">
                      <img
                        src={album.artwork}
                        alt={`${album.title} album cover`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="text-xs leading-[0.875rem] font-semibold text-fifth">{album.title}</h3>
                      <p className="text-fifth/70 font-medium text-[0.625rem] leading-[0.625rem]">{album.artist}</p>
                      {album.releaseDate && (
                        <p className="text-fifth/70 text-[0.625rem] mb-1">
                          {(() => {
                            // Parse the date string to avoid timezone issues
                            const [year, month, day] = album.releaseDate.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          })()}
                        </p>
                      )}
                      {!album.releaseDate && <div className="mb-1" />}

                      {album.tracks.length > 0 && (
                        <>
                          <ol className="list-none">
                            {album.tracks.map((track) => (
                              <li
                                key={`${album.title}-${track.name}-${track.id}`}
                                className="text-[0.625rem] leading-[0.75rem] text-fifth relative pl-6 flex"
                              >
                                <span className="absolute left-0 top-0 text-fifth/70 w-4 text-right">
                                  {Number(track.song_categoryorder)}.
                                </span>
                                <button
                                  onClick={() => navigate(`/song/${track.id}`)}
                                  className="font-medium hover:underline transition-colors text-left"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discography;