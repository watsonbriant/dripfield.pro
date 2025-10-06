import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { MoveRight, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string;
}

interface GuestGroup {
  color: string;
  guests: Guest[];
}

interface SongPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  guests?: Guest[];
}

interface SongTourPerformancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  songName: string;
  tourId: string;
  currentShowId: string;
}

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

const placementColors: Record<string, string> = {
  'Set 1 Opener': '#006400',
  'Set 1 Closer': '#995905',
  'Set 2 Opener': '#019B7A',
  'Set 3 Opener': '#019B7A',
  'Set 4 Opener': '#019B7A',
  'Set 5 Opener': '#019B7A',
  'Set 2 Closer': '#E17401',
  'Set 3 Closer': '#E17401',
  'Set 4 Closer': '#E17401',
  'Set 5 Closer': '#E17401',
  'Encore 1': '#7C2128',
  'Encore 2': '#CE1126',
  'Encore 3': '#AF1E2D'
};

export default function SongTourPerformancesModal({
  isOpen,
  onClose,
  songName,
  tourId,
  currentShowId
}: SongTourPerformancesModalProps) {
  const navigate = useNavigate();
  const [performances, setPerformances] = useState<SongPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [tourName, setTourName] = useState<string>('');
  const [songId, setSongId] = useState<string>('');
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);

  useEffect(() => {
    if (isOpen && songName && tourId) {
      fetchPerformances();
    }
  }, [isOpen, songName, tourId]);

  const fetchPerformances = async () => {
    setLoading(true);
    try {
      // First, fetch the tour name
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('tour')
        .eq('tour_id', tourId)
        .single();
  
      if (tourError) throw tourError;
      if (tourData) {
        setTourName(tourData.tour);
      }

      // Fetch the song_id
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('song_id')
        .eq('song', songName)
        .single();

      if (songError) throw songError;
      if (songData) {
        setSongId(songData.song_id);
      }
  
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            setlist_entry_guests (
            guest_id,
            guests (
                guest_id,
                guest_canonid,
                guest_displayname,
                guest_instrument
            )
            ),
            shows!inner (
            show_id,
            show_date,
            show_tour,
            show_subvenue,
            show_venue_location,
            tours!inner (
                tour_id
            ),
            subvenues (
                subvenue_venue,
                venues (
                venue_id
                )
            )
            )
        `)
        .eq('entry_song', songName)
        .eq('shows.tours.tour_id', tourId)
        .order('show_date', { foreignTable: 'shows', ascending: true });

      if (error) throw error;

      const processedData = data?.map(entry => ({
        show_date: entry.shows.show_date,
        show_id: entry.shows.show_id,
        entry_placement: entry.entry_placement,
        show_tour: entry.shows.show_tour,
        show_subvenue: entry.shows.show_subvenue,
        show_venue_location: entry.shows.show_venue_location,
        show_subvenue_venue: entry.shows.subvenues?.subvenue_venue,
        venue_id: entry.shows.subvenues?.venues?.venue_id,
        entry_length: entry.entry_length,
        entry_short: entry.entry_short,
        entry_coachnotes: entry.entry_coachnotes,
        entry_set: entry.entry_set,
        entry_setnum: entry.entry_setnum,
        entry_song: entry.entry_song,
        entry_segue: entry.entry_segue,
        guests: entry.setlist_entry_guests?.map((seg: any) => seg.guests).filter(Boolean) || []
      })) || [];

      // Sort by show_date, then by entry_set, then by entry_setnum
      processedData.sort((a, b) => {
        // First sort by show_date
        const dateComparison = new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are equal, sort by entry_set
        const setA = a.entry_set || '';
        const setB = b.entry_set || '';
        const setComparison = setA.localeCompare(setB);
        if (setComparison !== 0) return setComparison;
        
        // If sets are equal, sort by entry_setnum
        const setnumA = parseInt(a.entry_setnum) || 0;
        const setnumB = parseInt(b.entry_setnum) || 0;
        return setnumA - setnumB;
      });

      setPerformances(processedData);

      // Group guests by unique combinations
      const groupsByGuests = processedData.reduce((acc: { [key: string]: GuestGroup }, entry) => {
        if (!entry.guests || entry.guests.length === 0) return acc;
        
        const sortedGuests = [...entry.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
        
        const guestKey = sortedGuests
          .map(g => g.guest_canonid)
          .join(',');
        
        if (!acc[guestKey]) {
          const colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#FF6B81', '#F1C40F', '#34495E', '#FFFFFF'];
          const existingColors = Object.values(acc).map(g => g.color);
          const availableColors = colors.filter(color => !existingColors.includes(color));
          const color = availableColors[0] || colors[Object.keys(acc).length % colors.length];

          acc[guestKey] = {
            color,
            guests: sortedGuests
          };
        }
        return acc;
      }, {});

      setGuestGroups(Object.values(groupsByGuests));
    } catch (error) {
      console.error('Error fetching performances:', error);
    } finally {
      setLoading(false);
    }
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

  const navigateToVenue = (perf: SongPerformance) => {
    if (perf.venue_id) {
      navigate(`/venue/${perf.venue_id}`);
    } else if (perf.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(perf.show_subvenue_venue)}`);
    } else {
      const venueSearchTerm = perf.show_subvenue || perf.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  const getGuestColor = (perf: SongPerformance): string => {
    if (!perf.guests || perf.guests.length === 0) return 'transparent';
    
    const sortedGuests = [...perf.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
    const perfGuestKey = sortedGuests
      .map(g => g.guest_canonid)
      .join(',');
    
    const group = guestGroups.find(group => 
      group.guests
        .sort((a, b) => a.guest_canonid - b.guest_canonid)
        .map(g => g.guest_canonid)
        .join(',') === perfGuestKey
    );

    return group?.color || 'transparent';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Custom Modal with 650px max-width on desktop */}
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-secondary bg-primary rounded-t-lg">
            <div className="flex items-center flex-1">
                <h2 className="text-xl font-trad bg-tertiary text-fifth inline-block px-3 pb-0.5 rounded-lg border border-secondary mr-4">{cleanSongName(songName)}</h2>
                {tourName && (
                <span className="text-xs font-medium bg-secondary text-fifth px-3 py-1 rounded-full border border-secondary whitespace-nowrap mr-4">
                    {tourName}
                </span>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors flex-shrink-0"
            >
                <X className="w-5 h-5 text-fifth" />
            </button>
        </div>
        
        <div className="p-4">
            <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
                <p className="text-fifth mt-4">Loading performances...</p>
              </div>
            ) : performances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-fifth">No performances found in this tour.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max">
                    <thead>
                      <tr className="bg-canvas border-y border-secondary">
                        <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
                          Show
                        </th>
                        <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
                          Location
                        </th>
                        <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
                          &nbsp;
                        </th>
                        <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
                          Length
                        </th>
                        <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
                          <User strokeWidth={2} className="text-fifth w-5 h-5 mx-auto" />
                        </th>
                        <th className="px-4 py-2 text-left text-s font-semibold text-fifth whitespace-nowrap">
                          Coach's Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {performances.map((perf, index) => {
                        return (
                          <tr 
                            key={`${perf.show_id}-${index}`}
                            className="bg-primary hover:bg-tertiary/40 transition-colors text-xs"
                          >
                            <td className="px-3 py-1 text-fifth whitespace-nowrap text-center relative">
                              <span className="font-medium">
                                  <button
                                  onClick={() => {
                                      navigate(`/setlist/${perf.show_id}`);
                                      onClose();
                                  }}
                                  className="hover:underline transition-colors table-link"
                                  >
                                  {formatInTimeZone(
                                      new Date(perf.show_date),
                                      'UTC',
                                      'MM.dd.yy'
                                  )}
                                  </button>
                              </span>
                              {placementColors[perf.entry_placement] && (
                                  <span 
                                  className="absolute right-0 top-0 bottom-0 w-1"
                                  style={{ backgroundColor: placementColors[perf.entry_placement] }}
                                  />
                              )}
                              </td>
                            <td 
                              className="px-4 py-1 text-fifth whitespace-nowrap relative"
                            >
                              <button
                                onClick={() => {
                                  navigateToVenue(perf);
                                  onClose();
                                }}
                                className="hover:underline font-light transition-colors"
                              >
                                {perf.show_venue_location}
                              </button>
                            </td>
                            <td className="px-4 py-1 text-fifth">
                              {perf.entry_short && <span className="text-red-600 mr-2 font-medium">[{perf.entry_short}]</span>}
                              {perf.entry_segue && <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />}
                            </td>
                            <td className="px-4 py-1 text-fifth whitespace-nowrap font-light text-center">
                              {perf.entry_length ? formatLength(perf.entry_length) : ''}
                            </td>
                            <td className="px-4 py-1">
                              <div 
                                className="w-4 h-4 rounded mx-auto"
                                style={{ backgroundColor: getGuestColor(perf) }}
                              />
                            </td>
                            <td className="px-4 py-1 text-fifth font-light">
                              {perf.entry_coachnotes ? (
                                <div dangerouslySetInnerHTML={{ __html: perf.entry_coachnotes }} />
                              ) : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {guestGroups.length > 0 && (
                  <div className="bg-canvas border border-secondary rounded-lg p-2 mt-4 mx-8 relative">
                    <User className="w-5 h-5 text-fifth absolute top-2 right-2" />
                    <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-1 pr-8 ml-1 items-center">
                      {guestGroups.map((group, index) => (
                        <React.Fragment key={index}>
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: group.color }}
                          />
                          <div className="text-fifth text-sm flex items-center flex-wrap">
                            {group.guests
                              .sort((a, b) => a.guest_canonid - b.guest_canonid)
                              .map((g, gIndex) => (
                                <React.Fragment key={g.guest_id}>
                                  <span className="inline-block whitespace-nowrap">
                                    <span 
                                      className="cursor-pointer hover:underline transition-colors font-medium"
                                      onClick={() => {
                                        navigate(`/personnel/${g.guest_id}`);
                                        onClose();
                                      }}
                                    >
                                      {g.guest_displayname}
                                    </span>
                                    {gIndex < group.guests.length - 1 && <span>,&nbsp;</span>}
                                  </span>
                                </React.Fragment>
                              ))}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Footer with Song History button */}
        <div className="border-t border-secondary p-4 bg-canvas rounded-b-lg flex justify-center">
          <button
            onClick={() => {
              if (songId) {
                navigate(`/song/${songId}`);
                onClose();
              }
            }}
            className="bg-tertiary hover:bg-primary text-fifth font-medium py-1 px-3 rounded-lg border border-secondary transition-colors"
          >
            Song History
          </button>
        </div>
      </div>
    </>
  );
}