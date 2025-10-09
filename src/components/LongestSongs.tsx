import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SongTourPerformancesModal from './SongTourPerformancesModal';

interface LongestSongsProps {
  showIds: string[];
  songIdMap: { [songName: string]: string };
  tourId?: string;
}

interface LongestSong {
  entry_song: string;
  entry_length: string;
  song_id?: string;
  show_date?: string;
  show_id?: string;
  venue_location?: string;
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

const LongestSongs: React.FC<LongestSongsProps> = ({ showIds, songIdMap, tourId = '' }) => {
  const navigate = useNavigate();
  const [longestSongs, setLongestSongs] = useState<LongestSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

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

  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };

  const handleShowClick = (showId: string) => {
    if (showId) {
      navigate(`/setlist/${showId}`);
    }
  };

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <h2 className="text-lg font-semibold bg-fourth text-primary inline-block px-3 rounded-lg border border-secondary mb-2">
        Longest Songs
      </h2>
      {loading ? (
        <div className="text-center py-4">
          <p className="text-fifth/70">Loading...</p>
        </div>
      ) : longestSongs.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-fifth/70 text-xs">Song times for this tour are unknown.</p>
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
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-4 pt-0.5 pb-1 text-[1rem] leading-[1rem] font-trad">
                    <span
                      className="text-fifth cursor-pointer hover:underline"
                      onClick={() => handleSongClick(song.entry_song)}
                    >
                      {cleanSongName(song.entry_song)}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 text-fifth text-center font-medium">
                    {formatTime(song.entry_length)}
                  </td>
                  <td className="px-4 py-0.5 text-fifth">
                    {song.show_date && (
                      <>
                        <span
                          onClick={() => handleShowClick(song.show_id || '')}
                          className="font-medium cursor-pointer hover:underline"
                        >
                          {formatDate(song.show_date)}
                        </span>
                        {song.venue_location && <span className="text-fifth/70">&nbsp;&nbsp;[{song.venue_location}]</span>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
    {/* Song Tour Performances Modal */}
    <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={tourId}
        currentShowId=""
      />
    </div>
  );
};

export default LongestSongs;