import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { MoveRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SeguePerformance {
  show_date: string;
  show_id: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  first_song_length: string | null;
  second_song_length: string | null;
  combined_length: string | null;
}

interface SeguePerformancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceSongName: string;
  destinationSongName: string;
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

export default function SeguePerformancesModal({
  isOpen,
  onClose,
  sourceSongName,
  destinationSongName
}: SeguePerformancesModalProps) {
  const navigate = useNavigate();
  const [performances, setPerformances] = useState<SeguePerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sourceSongName && destinationSongName) {
      fetchSeguePerformances();
    }
  }, [isOpen, sourceSongName, destinationSongName]);

  const fetchSeguePerformances = async () => {
    setLoading(true);
    try {
      // First, get count of all setlist entries
      const { count, error: countError } = await supabase
        .from('setlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('entry_song', sourceSongName)
        .like('entry_segue', '%>%');

      if (countError) throw countError;

      // Fetch all entries in batches
      const batchSize = 1000;
      const totalBatches = Math.ceil((count || 0) / batchSize);
      let allEntries: any[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize - 1, (count || 0) - 1);

        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_id,
            entry_song,
            entry_segue,
            entry_show,
            entry_set,
            entry_setnum,
            entry_length,
            shows!inner (
              show_id,
              show_date,
              show_canonid,
              show_venue_location,
              subvenues (
                subvenue_venue,
                venues (
                  venue_id
                )
              )
            )
          `)
          .eq('entry_song', sourceSongName)
          .like('entry_segue', '%>%')
          .not('shows.show_canonid', 'is', null)
          .range(start, end);

        if (error) throw error;
        if (data) allEntries = [...allEntries, ...data];
      }

      // Get all unique show IDs
      const showIds = [...new Set(allEntries.map(e => e.entry_show))];

      // Fetch all setlist entries for these shows
      const showBatchSize = 50;
      const showBatches = [];
      for (let i = 0; i < showIds.length; i += showBatchSize) {
        showBatches.push(showIds.slice(i, i + showBatchSize));
      }

      let allShowEntries: any[] = [];
      for (const showBatch of showBatches) {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select('entry_id, entry_show, entry_set, entry_setnum, entry_song, entry_length')
          .in('entry_show', showBatch)
          .order('entry_show')
          .order('entry_set')
          .order('entry_setnum');

        if (error) throw error;
        if (data) allShowEntries = [...allShowEntries, ...data];
      }

      // Group entries by show
      const entriesByShow = new Map<string, any[]>();
      allShowEntries.forEach(entry => {
        if (!entriesByShow.has(entry.entry_show)) {
          entriesByShow.set(entry.entry_show, []);
        }
        entriesByShow.get(entry.entry_show)!.push(entry);
      });

      // Find valid segues
      const validSegues: SeguePerformance[] = [];
      allEntries.forEach(sourceEntry => {
        const showEntries = entriesByShow.get(sourceEntry.entry_show);
        if (!showEntries) return;

        const currentIndex = showEntries.findIndex(e => e.entry_id === sourceEntry.entry_id);
        if (currentIndex === -1 || currentIndex === showEntries.length - 1) return;

        const nextEntry = showEntries[currentIndex + 1];
        if (nextEntry.entry_song === destinationSongName) {
          validSegues.push({
            show_date: sourceEntry.shows.show_date,
            show_id: sourceEntry.shows.show_id,
            show_venue_location: sourceEntry.shows.show_venue_location,
            show_subvenue_venue: sourceEntry.shows.subvenues?.subvenue_venue,
            venue_id: sourceEntry.shows.subvenues?.venues?.venue_id,
            first_song_length: sourceEntry.entry_length,
            second_song_length: nextEntry.entry_length,
            combined_length: calculateCombinedLength(sourceEntry.entry_length, nextEntry.entry_length)
          });
        }
      });

      // Sort by show_date
      validSegues.sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());

      setPerformances(validSegues);
    } catch (error) {
      console.error('Error fetching segue performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCombinedLength = (length1: string | null, length2: string | null): string | null => {
    if (!length1 || !length2) return null;

    const parseTime = (time: string): number => {
      const parts = time.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      return 0;
    };

    const totalSeconds = parseTime(length1) + parseTime(length2);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  const navigateToVenue = (perf: SeguePerformance) => {
    if (perf.venue_id) {
      navigate(`/venue/${perf.venue_id}`);
    } else if (perf.show_subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(perf.show_subvenue_venue)}`);
    } else {
      const venueSearchTerm = perf.show_venue_location;
      if (venueSearchTerm) {
        navigate(`/venue/${encodeURIComponent(venueSearchTerm)}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-secondary bg-primary rounded-t-lg">
          <div className="flex items-center flex-1">
            <h2 className="text-xl font-trad bg-tertiary text-fifth inline-block px-3 pb-0.5 rounded-lg border border-secondary mr-4">
              Segue Lookup
            </h2>
            <span className="text-xs font-medium bg-secondary text-fifth px-3 py-1 rounded-full border border-secondary whitespace-nowrap mr-4 flex items-center gap-2">
              <span>{cleanSongName(sourceSongName)}</span>
              <MoveRight className="text-red-500 w-3 h-3" />
              <span>{cleanSongName(destinationSongName)}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
              </div>
              <p className="text-fifth mt-4">Loading segue performances...</p>
            </div>
          ) : performances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-fifth">No performances found for this segue.</p>
            </div>
          ) : (
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
                    <th className="px-4 py-2 text-center text-s font-semibold text-fifth whitespace-nowrap">
                      Length
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {performances.map((perf, index) => (
                    <tr 
                      key={`${perf.show_id}-${index}`}
                      className="bg-primary hover:bg-tertiary/40 transition-colors text-xs"
                    >
                      <td className="px-3 py-1 text-fifth whitespace-nowrap text-center">
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
                      </td>
                      <td className="px-4 py-1 text-fifth whitespace-nowrap">
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
                      <td className="px-4 py-1 text-fifth whitespace-nowrap font-light text-center">
                        {perf.combined_length ? formatLength(perf.combined_length) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}