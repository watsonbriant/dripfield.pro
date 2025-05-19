import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const NotPlayedInTour: React.FC<NotPlayedInTourProps> = ({ tourId, tourName, showIds, songIdMap }) => {
  const navigate = useNavigate();
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotPlayedSongs() {
      if (!tourId || showIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Get the first show date of the tour to filter for songs played before this tour
        const { data: tourFirstShowData, error: firstShowError } = await supabase
          .from('shows')
          .select('show_date')
          .eq('show_tour', tourName)
          .order('show_date', { ascending: true })
          .limit(1)
          .single();

        if (firstShowError) throw firstShowError;
        
        if (!tourFirstShowData || !tourFirstShowData.show_date) {
          setLoading(false);
          return;
        }

        const firstShowDate = tourFirstShowData.show_date;

        // First, get all songs played in this tour
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
        const { data: allTimeData, error: allTimeError } = await supabase
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
          .lt('shows.show_date', firstShowDate);

        if (allTimeError) throw allTimeError;

        // Count overall song frequency by unique shows
        const songShowCounts = allTimeData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songId = entry.songs.song_id;
          const showId = entry.entry_show;
          const uniqueKey = `${songId}-${showId}`;

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

        // Filter to only songs NOT played in this tour
        const notPlayedSongs = Object.values(songShowCounts)
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

        setNotPlayedSongs(notPlayedSongs);
      } catch (error) {
        console.error('Error fetching not played songs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotPlayedSongs();
  }, [tourId, tourName, showIds]);

  return (
    <div className="bg-primary border border-black rounded-lg p-3">
      <h2 className="text-lg font-mohr bg-[#CE1126] text-white inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1.5">
        Most Common Not Played
      </h2>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-2">Loading songs...</p>
        </div>
      ) : notPlayedSongs.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-black/70 text-xs">No historical songs to display.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody className="divide-y divide-white/5">
              {notPlayedSongs.map((song, index) => (
                <tr
                  key={song.song_id}
                  className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-black/10 transition-colors`}
                >
                  <td className="pl-4 text-black text-xs">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/song/${song.song_id}`)}
                        className="font-semibold hover:underline cursor-pointer text-left"
                      >
                        {song.song}
                      </button>
                      {song.category_artwork && (
                        <img
                          src={song.category_artwork}
                          alt={`${song.song} artwork`}
                          className="w-5 h-5 rounded-full object-cover border border-black/20 ml-3"
                          onError={(e) => {
                            // Hide the image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="pr-2 w-[40px] py-0.5 text-center font-semibold text-black text-xs">
                    {song.play_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NotPlayedInTour;