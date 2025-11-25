import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart3 } from 'lucide-react';

interface NotPlayedSong {
  song: string;
  song_id: string;
  play_count: number;
  category_canonid: number;
  category_artwork?: string;
}

interface NotPlayedInTourProps {
  tourId: string;
  tourName: string;
  showIds: string[];
  songIdMap: { [songName: string]: string };
}

// const cleanSongName = (songName: string): string => {
//   return songName
//     .replace(/\[/g, '(')
//     .replace(/\]/g, ')')
//     .replace(/ñ/g, 'n')
//     .replace(/ü/g, 'u')
//     .replace(/–/g, '-')
//     .replace(/…/g, '...')
//     .replace(/∆/g, 'a');
// };

const NotPlayedInTour: React.FC<NotPlayedInTourProps> = ({ tourId, tourName, showIds, songIdMap }) => {
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotPlayedSongs() {
      if (!tourId || showIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Get the first show date of the tour (only canonical shows)
        const { data: tourFirstShowData, error: firstShowError } = await supabase
          .from('shows')
          .select('show_date')
          .eq('show_tour', tourName)
          .eq('show_group', 'Goose')
          .not('show_canonid', 'is', null)
          .order('show_date', { ascending: true })
          .limit(1)
          .single();

        if (firstShowError) throw firstShowError;
        
        if (!tourFirstShowData || !tourFirstShowData.show_date) {
          setLoading(false);
          return;
        }

        const firstShowDate = tourFirstShowData.show_date;

        // First, get all unique songs played in this tour
        const { data: playedInTourData, error: playedError } = await supabase
          .from('setlist_entries')
          .select(`
            songs!inner(song_id)
          `)
          .in('entry_show', showIds);

        if (playedError) throw playedError;

        // Create a Set of song IDs played in this tour
        const songsPlayedInTour = new Set(
          playedInTourData.map((entry: any) => entry.songs.song_id)
        );

        // Now get all songs from canonical Goose shows before this tour
        // We'll do this in batches like the Home component does
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show,
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null)
            .lt('shows.show_date', firstShowDate)
            .range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        // Count song frequency by unique shows (same logic as Home component)
        const songShowCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songId = entry.songs.song_id;
          const showId = entry.entry_show;

          if (!acc[songId]) {
            acc[songId] = {
              song: entry.entry_song,
              song_id: songId,
              shows: new Set([showId]),
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songId].shows.add(showId);
          }
          return acc;
        }, {});

        // Filter to only songs NOT played in this tour and convert to array
        const processedSongs = Object.values(songShowCounts)
          .filter((item: any) => !songsPlayedInTour.has(item.song_id))
          .map((item: any) => ({
            song: item.song,
            song_id: item.song_id,
            play_count: item.shows.size,
            category_canonid: item.category_canonid,
            category_artwork: item.category_artwork
          }))
          .sort((a: any, b: any) => {
            // Sort by play count (descending)
            if (b.play_count !== a.play_count) {
              return b.play_count - a.play_count;
            }
            // Then by category (ascending)
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            // Then alphabetically
            return a.song.localeCompare(b.song);
          })
          .slice(0, 8); // Get top 8

        setNotPlayedSongs(processedSongs);
      } catch (error) {
        console.error('Error fetching not played songs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotPlayedSongs();
  }, [tourId, tourName, showIds]);

  return (
    <div className="bg-primary border border-fourth pb-0.5">
      <div className="text-white px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#181818' }}>
        <h2 className="text-sm font-semibold">
        Most Common Not Played
      </h2>
      </div>
      
      <div className={`${loading ? 'opacity-20' : ''} transition-opacity duration-300`}>
        {notPlayedSongs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-fifth/70 text-xs">No historical songs to display.</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse">
              <tbody>
                {notPlayedSongs.map((song, index) => (
                  <tr
                    key={song.song_id}
                    className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                  >
                    <td className="pl-3 text-fifth">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/song/${song.song_id}`}
                          className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                        >
                          {song.song}
                        </Link>
                        {song.category_artwork && (
                          <img
                            src={song.category_artwork}
                            alt={`${song.song} artwork`}
                            className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                            onError={(e) => {
                              // Hide the image if it fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="w-[30px] text-center font-medium text-fifth">
                      {song.play_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotPlayedInTour;