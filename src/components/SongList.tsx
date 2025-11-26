import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { SongEntryWithId } from '../types/userSlots';

interface SongListProps {
  songs: SongEntryWithId[] | null;
  songIdMap: { [songName: string]: string };
}

const SongList: React.FC<SongListProps> = ({ songs, songIdMap }) => {
  const navigate = useNavigate();

  if (!songs || songs.length === 0) return null;
  
  return (
    <div 
      className="w-full text-left"
      style={{
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'normal',
        whiteSpace: 'normal',
        hyphens: 'none'
      }}
    >
      {songs.map((song, index) => (
        <React.Fragment key={`${song.song}-${index}`}>
          {index > 0 && (
            <MoveRight className="text-red-500 inline w-[1rem] h-[1rem] mx-1" />
          )}
          <a 
            onClick={() => {
              const songId = songIdMap[song.song];
              if (songId) {
                navigate(`/song/${songId}`);
              }
            }}
            className="font-semibold hover:underline transition-colors text-fifth table-link cursor-pointer inline"
          >
            {song.song}
          </a>
        </React.Fragment>
      ))}
    </div>
  );
};

export default SongList;
