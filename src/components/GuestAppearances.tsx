import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, MoveRight } from 'lucide-react';

interface GuestAppearancesProps {
  showIds: string[];
  tourId?: string;
  onDataLoaded?: (hasData: boolean) => void;
}

interface GuestCount {
  guest_id: string;
  guest: string;
  count: number;
}

interface SongWithGuest {
  entry_song: string;
  show_date: string;
  show_id: string;
  show_venue_location: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_segue: string | null;
}

const GuestAppearances: React.FC<GuestAppearancesProps> = ({
  showIds,
  tourId = '',
  onDataLoaded
}) => {
  const navigate = useNavigate();
  const [guestCounts, setGuestCounts] = useState<GuestCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    guestId: string;
    guestName: string;
    songs: SongWithGuest[];
    tourName: string;
  }>({
    isOpen: false,
    guestId: '',
    guestName: '',
    songs: [],
    tourName: ''
  });

  useEffect(() => {
    const fetchGuestAppearances = async () => {
      if (!showIds || showIds.length === 0) {
        setLoading(false);
        onDataLoaded?.(false);
        return;
      }

      try {
        // Fetch all setlist entries for the tour with their guests
        const { data: entriesData, error: entriesError } = await supabase
          .from('setlist_entries')
          .select(`
            entry_id,
            entry_show,
            setlist_entry_guests (
              guest_id,
              guests (
                guest_id,
                guest,
                guest_category
              )
            )
          `)
          .in('entry_show', showIds);

        if (entriesError) throw entriesError;

        // Count appearances for each non-Goose guest
        const guestCountMap: { [guestId: string]: { guest: string; count: number } } = {};

        entriesData?.forEach(entry => {
          const guests = entry.setlist_entry_guests || [];
          
          // Filter out Goose current/former members
          const nonGooseGuests = guests.filter((seg: any) => {
            const category = seg.guests?.guest_category;
            return category !== 'Goose (current)' && category !== 'Goose (former)';
          });

          // Only count if there are non-Goose guests
          if (nonGooseGuests.length > 0) {
            nonGooseGuests.forEach((seg: any) => {
              const guest = seg.guests;
              if (guest) {
                if (!guestCountMap[guest.guest_id]) {
                  guestCountMap[guest.guest_id] = {
                    guest: guest.guest,
                    count: 0
                  };
                }
                guestCountMap[guest.guest_id].count++;
              }
            });
          }
        });

        // Convert to array and sort
        const sortedGuests = Object.entries(guestCountMap)
          .map(([guest_id, { guest, count }]) => ({
            guest_id,
            guest,
            count
          }))
          .sort((a, b) => {
            // First by count descending
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            // Then alphabetically by guest name
            return a.guest.localeCompare(b.guest);
          });

        setGuestCounts(sortedGuests);
        onDataLoaded?.(sortedGuests.length > 0);
      } catch (error) {
        console.error('Error fetching guest appearances:', error);
        onDataLoaded?.(false);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestAppearances();
  }, [showIds, onDataLoaded]);

  const handleGuestClick = async (guestId: string, guestName: string) => {
    try {
      // Fetch tour name if tourId is provided
      let fetchedTourName = '';
      if (tourId) {
        const { data: tourData } = await supabase
          .from('tours')
          .select('tour')
          .eq('tour_id', tourId)
          .single();
        
        if (tourData) {
          fetchedTourName = tourData.tour;
        }
      }

      // Fetch all songs this guest appeared on during the tour
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
          entry_song,
          entry_length,
          entry_short,
          entry_segue,
          entry_show,
          entry_set,
          entry_setnum,
          setlist_entry_guests!inner (
            guest_id
          ),
          shows (
            show_date,
            show_venue_location,
            show_canonid
          )
        `)
        .in('entry_show', showIds)
        .eq('setlist_entry_guests.guest_id', guestId)
        .order('shows(show_canonid)', { ascending: true })
        .order('entry_set', { ascending: true })
        .order('entry_setnum', { ascending: true });

      if (error) throw error;

      const songs: SongWithGuest[] = data?.map(entry => {
        const show = Array.isArray(entry.shows) ? entry.shows[0] : entry.shows;
        return {
        entry_song: entry.entry_song,
          show_date: show?.show_date || '',
        show_id: entry.entry_show,
          show_venue_location: show?.show_venue_location || '',
        entry_length: entry.entry_length,
        entry_short: entry.entry_short,
        entry_segue: entry.entry_segue
        };
      }) || [];

      setModalData({
        isOpen: true,
        guestId,
        guestName,
        songs,
        tourName: fetchedTourName // Add this
      });
    } catch (error) {
      console.error('Error fetching guest songs:', error);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return dateStr
      .split('-')
      .slice(1)
      .concat(dateStr.substring(2, 4))
      .join('.');
  };

  const formatLength = (length: string | null): string => {
    if (!length) return '';
    const parts = length.split(':').map(part => parseInt(part));
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      if (hours === 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return length;
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalData.isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [modalData.isOpen]);

  // Don't render if no guests
  if (!loading && guestCounts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-primary border border-fourth pb-0.5 shadow-xl">
        <div className="text-white px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#3498db' }}>
          <h2 className="text-sm font-semibold">
          Guest Appearances
        </h2>
        </div>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-fifth/70">Loading...</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse min-w-max">
              <tbody>
                {guestCounts.map((guest) => (
                  <tr
                    key={guest.guest_id}
                    className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                  >
                    <td className="pl-3 text-fifth">
                      <span
                        className="font-medium text-fifth cursor-pointer hover:underline leading-[0.75rem]"
                        onClick={() => handleGuestClick(guest.guest_id, guest.guest)}
                      >
                        {guest.guest}
                      </span>
                    </td>
                    <td className="w-[30px] text-center font-medium text-fifth">
                      {guest.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest Songs Modal */}
      {modalData.isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setModalData({ ...modalData, isOpen: false })}
          />
          
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="flex items-center justify-between px-0.5 py-0.5 bg-tertiary text-fifth">
              <div className="flex items-center flex-1">
                <h2 className="text-sm font-semibold ml-1.5 mr-4">
                  {modalData.guestName}
                </h2>
                {modalData.tourName && (
                  <span className="text-xs font-medium bg-canvas text-fifth px-2 py-0.5 rounded border border-fourth whitespace-nowrap mr-4">
                    {modalData.tourName}
                  </span>
                )}
              </div>
              <button
                onClick={() => setModalData({ ...modalData, isOpen: false })}
                className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-fifth" />
              </button>
            </div>
            
            <div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max">
                  <thead>
                    <tr className="bg-canvas text-fifth">
                      <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
                        Song
                      </th>
                      <th className="px-2 py-0.5 text-center text-[0.75rem] font-medium text-fifth whitespace-nowrap">
                        Show
                      </th>
                      <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
                        Location
                      </th>
                      <th className="px-2 py-0.5 text-left text-[0.75rem] font-medium text-fifth whitespace-nowrap">
                        &nbsp;
                      </th>
                      <th className="px-2 py-0.5 text-center text-[0.75rem] font-medium text-fifth whitespace-nowrap">
                        Length
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.songs.map((song) => (
                      <tr 
                        key={`${song.show_id}-${song.entry_song}`}
                        className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
                      >
                        <td className="px-2 text-fifth font-medium">
                          {song.entry_song}
                        </td>
                        <td className="px-2 text-fifth whitespace-nowrap text-center">
                          <span className="font-medium">
                            <Link
                              to={`/setlist/${song.show_id}`}
                              onClick={() => setModalData({ ...modalData, isOpen: false })}
                              className="hover:underline transition-colors table-link"
                            >
                              {formatDate(song.show_date)}
                            </Link>
                          </span>
                        </td>
                        <td className="px-2 text-fifth whitespace-nowrap font-light">
                          {song.show_venue_location}
                        </td>
                        <td className="px-2 text-fifth">
                          {song.entry_short && <span className="text-red-600 mr-2 font-medium">[{song.entry_short}]</span>}
                          {song.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                        </td>
                        <td className="px-2 text-fifth whitespace-nowrap font-light text-center">
                          {song.entry_length ? formatLength(song.entry_length) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="border-t border-fourth px-2 py-0.5 bg-tertiary text-fifth flex justify-center">
              <button
                onClick={() => {
                  navigate(`/personnel/${modalData.guestId}`);
                  setModalData({ ...modalData, isOpen: false });
                }}
                className="bg-canvas hover:bg-primary text-fifth font-medium py-0.5 px-2 rounded border border-fourth transition-colors text-sm"
              >
                Guest Profile
              </button>
            </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GuestAppearances;