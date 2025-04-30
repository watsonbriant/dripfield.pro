import React from 'react';
import { MoveRight } from 'lucide-react';

interface SetlistEntry {
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_placement: string;
  entry_setorder: number;
  entry_set: string;
  entry_setnum: number;
  songs: {
    song_id: string;
  };
}

interface SetlistDisplayProps {
  setlist: SetlistEntry[];
  navigate: (path: string) => void;
}

const SetlistDisplay: React.FC<SetlistDisplayProps> = ({ setlist, navigate }) => {
  // Keep track of which songs we've seen
  const seenSongs = new Set<string>();
  let currentRunningNumber = 1;
  
  return (
    <div className="space-y-1">
      {setlist.map((entry, index) => {
        // Check if this is a duplicate song
        const isDuplicate = seenSongs.has(entry.entry_song);
        // Add the song to our seen set
        seenSongs.add(entry.entry_song);
        
        // Increment running number only if not a duplicate
        const displayNumber = !isDuplicate ? currentRunningNumber++ : null;
        // Check if this entry has a different set than the previous entry
        const prevEntry = index > 0 ? setlist[index - 1] : null;
        const isNewSet = prevEntry && prevEntry.entry_set !== entry.entry_set;
        
        return (
          <React.Fragment key={`${entry.entry_song}-${index}`}>
            {isNewSet && (
              <hr className="border-white/10 my-2" />
            )}
            <div 
              className="flex items-center text-[#fce7ca]/90 text-xs hover:bg-white/10 transition-colors rounded px-0 py-0"
            >
              <div 
                className="w-6 text-white text-center rounded font-semibold"
                style={{
                  backgroundColor: 
                    entry.entry_placement === 'Set 1 Opener' ? '#006400' :
                    entry.entry_placement === 'Set 1 Closer' ? '#995905' :
                    entry.entry_placement === 'Set 2 Opener' || 
                    entry.entry_placement === 'Set 3 Opener' || 
                    entry.entry_placement === 'Set 4 Opener' || 
                    entry.entry_placement === 'Set 5 Opener' ? '#019B7A' :
                    entry.entry_placement === 'Set 2 Closer' || 
                    entry.entry_placement === 'Set 3 Closer' || 
                    entry.entry_placement === 'Set 4 Closer' || 
                    entry.entry_placement === 'Set 5 Closer' ? '#E17401' :
                    entry.entry_placement === 'Encore 1' ? '#7C2128' :
                    entry.entry_placement === 'Encore 2' ? '#CE1126' : 
                    entry.entry_placement === 'Encore 3' ? '#AF1E2D' :
                    '#172330'
                }}
              >
                {displayNumber || '\u00A0'}
              </div>
              <div className="flex-1 pl-2">
                <span className="font-semibold">
                  <button
                    onClick={() => navigate(`/song/${entry.songs.song_id}`)}
                    className="text-white hover:underline cursor-pointer mr-2"
                  >
                    {entry.entry_song}
                  </button>
                  {entry.entry_short && (
                    <span className="text-red-400 mr-2">[{entry.entry_short}]</span>
                  )}
                  {entry.entry_segue && (
                    <MoveRight className="text-red-400 inline w-[1rem] h-[1rem]" />
                  )}
                </span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SetlistDisplay;