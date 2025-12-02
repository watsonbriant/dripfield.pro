import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  category_artwork?: string;
}

const LongestSongs: React.FC<LongestSongsProps> = ({ showIds, songIdMap, tourId = '' }) => {
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
            songs!inner(
              song_category,
              categories!inner(
                category_artwork
              )
            ),
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
          venue_location: entry.shows?.show_venue_location,
          category_artwork: entry.songs?.categories?.category_artwork
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


  return (
    <div className="bg-primary border border-fourth pb-0.5 shadow-xl">
      <div className="text-white px-2 py-0.5 mb-0.5" style={{ backgroundColor: '#3c1e40' }}>
        <h2 className="text-sm font-semibold">
        Longest Songs
      </h2>
      </div>
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
            <tbody>
              {longestSongs.map((song, index) => (
                <tr
                  key={`${song.entry_song}-${index}`}
                  className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                >
                  <td className="pl-3 text-fifth">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-medium text-fifth cursor-pointer hover:underline leading-[0.75rem]"
                        onClick={() => handleSongClick(song.entry_song)}
                      >
                        {song.entry_song}
                      </span>
                      {song.category_artwork && (
                        <img
                          src={song.category_artwork}
                          alt={`${song.entry_song} artwork`}
                          className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                          onError={(e) => {
                            // Hide the image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="w-[50px] text-center font-medium text-fifth">
                    {formatTime(song.entry_length)}
                  </td>
                  <td className="px-2 text-fifth font-light">
                    {song.show_date && (
                      <>
                        {song.show_id ? (
                          <Link
                            to={`/setlist/${song.show_id}`}
                          className="font-medium cursor-pointer hover:underline"
                        >
                          {formatDate(song.show_date)}
                          </Link>
                        ) : (
                          <span className="font-medium">{formatDate(song.show_date)}</span>
                        )}
                        {song.venue_location && <span className="text-fifth/70 font-light">&nbsp;&nbsp;[{song.venue_location.replace(/[\[\]]/g, '')}]</span>}
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