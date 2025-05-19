import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LongestSongsProps {
  showIds: string[];
  songIdMap: { [songName: string]: string };
}

interface LongestSong {
  entry_song: string;
  entry_length: string;
  song_id?: string;
  show_date?: string;
  show_id?: string;
  venue_location?: string;
}

const LongestSongs: React.FC<LongestSongsProps> = ({ showIds, songIdMap }) => {
  const navigate = useNavigate();
  const [longestSongs, setLongestSongs] = useState<LongestSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLongestSongs = async () => {
      if (!showIds || showIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch entries with length information
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            entry_length,
            entry_show,
            shows (
              show_date,
              show_venue_location
            )
          `)
          .in('entry_show', showIds)
          .not('entry_length', 'is', null)
          .order('entry_length', { ascending: false })
          .limit(8);

        if (error) throw error;

        // Process and format data
        const formattedData: LongestSong[] = data?.map(entry => ({
          entry_song: entry.entry_song,
          entry_length: entry.entry_length,
          song_id: songIdMap[entry.entry_song] || '',
          show_date: entry.shows?.show_date,
          show_id: entry.entry_show,
          venue_location: entry.shows?.show_venue_location
        })) || [];

        setLongestSongs(formattedData);
      } catch (error) {
        console.error('Error fetching longest songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLongestSongs();
  }, [showIds, songIdMap]);

  // Format time for display
  const formatTime = (timeStr: string): string => {
    const parts = timeStr.split(':').map(Number);
    
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    } else if (parts.length === 2) {
      return `${parts[0]}:${parts[1].toString().padStart(2, '0')}`;
    }
    
    return timeStr;
  };

  // Format date for display
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    
    return dateStr
      .split('-')
      .slice(1)
      .concat(dateStr.substring(2, 4))
      .join('.');
  };

  const handleSongClick = (songId: string) => {
    if (songId) {
      navigate(`/song/${songId}`);
    }
  };

  const handleShowClick = (showId: string) => {
    if (showId) {
      navigate(`/setlist/${showId}`);
    }
  };

  return (
    <div className="bg-primary border border-black rounded-lg p-3">
      <h2 className="text-lg font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1.5">
        Longest Songs
      </h2>
      {loading ? (
        <div className="text-center py-4">
          <p className="text-black/70">Loading...</p>
        </div>
      ) : longestSongs.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-black/70 text-xs">Song times for this tour are unknown.</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-64">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {longestSongs.map((song, index) => (
                <tr
                  key={`${song.entry_song}-${index}`}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-black/10 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 font-semibold">
                    <span
                      className="text-black cursor-pointer hover:text-[#a9682e] hover:underline"
                      onClick={() => handleSongClick(song.song_id || '')}
                    >
                      {song.entry_song}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 text-black text-center font-semibold">
                    {formatTime(song.entry_length)}
                  </td>
                  <td className="px-4 py-0.5 text-black">
                    {song.show_date && (
                      <>
                        <span
                          onClick={() => handleShowClick(song.show_id || '')}
                          className="font-semibold cursor-pointer hover:text-[#a9682e] hover:underline"
                        >
                          {formatDate(song.show_date)}
                        </span>
                        {song.venue_location && <span className="text-black/70">&nbsp;[{song.venue_location}]</span>}
                      </>
                    )}
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

export default LongestSongs;