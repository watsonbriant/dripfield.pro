import React from 'react';
import { Link } from 'react-router-dom';
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
}

const SetlistDisplay: React.FC<SetlistDisplayProps> = ({ setlist }) => {
  // Keep track of which songs we've seen
  const skipNumberingShorts = ["fake", "tease", "reprise"];
  // Instead of tracking seen songs with a simple Set, we'll track songs with valid numbers
  const songsWithNumbers = new Set<string>();
  let currentRunningNumber = 1;
  
  return (
    <div className='mx-3'>
      {setlist.map((entry, index) => {
        // Check if this entry has a short value that should skip numbering
        const shouldSkipNumbering = entry.entry_short && 
        skipNumberingShorts.includes(entry.entry_short.toLowerCase());

        // Has this song already received a number?
        const alreadyHasNumber = songsWithNumbers.has(entry.entry_song);

        // Only assign a number if:
        // 1. The song doesn't already have a number elsewhere in the setlist AND
        // 2. This specific entry doesn't have a short value we want to skip
        const displayNumber = (!alreadyHasNumber && !shouldSkipNumbering) ? 
        currentRunningNumber++ : null;

        // If we assigned a number, add this song to our tracking set
        if (displayNumber !== null) {
        songsWithNumbers.add(entry.entry_song);
        }
        // Check if this entry has a different set than the previous entry
        const prevEntry = index > 0 ? setlist[index - 1] : null;
        const isNewSet = prevEntry && prevEntry.entry_set !== entry.entry_set;
        
        return (
          <React.Fragment key={`${entry.entry_song}-${index}`}>
            {isNewSet && (
              <hr className="border-fourth my-1" />
            )}
            <div 
              className="flex items-center text-[#fce7ca]/90 text-xs hover:bg-tertiary/40 transition-colors px-0 py-0"
            >
              <div 
                className={`w-1 text-center rounded font-medium ${
                  entry.entry_placement === 'Set 1 Opener' || 
                  entry.entry_placement === 'Set 1 Closer' || 
                  entry.entry_placement === 'Set 2 Opener' || 
                  entry.entry_placement === 'Set 3 Opener' || 
                  entry.entry_placement === 'Set 4 Opener' || 
                  entry.entry_placement === 'Set 5 Opener' || 
                  entry.entry_placement === 'Set 2 Closer' || 
                  entry.entry_placement === 'Set 3 Closer' || 
                  entry.entry_placement === 'Set 4 Closer' || 
                  entry.entry_placement === 'Set 5 Closer' || 
                  entry.entry_placement === 'Encore 1' || 
                  entry.entry_placement === 'Encore 2' || 
                  entry.entry_placement === 'Encore 3' ? 'text-white' : 'text-fifth'
                }`}
                style={{
                  backgroundColor: 
                    entry.entry_placement === 'Set 1 Opener' ? '#047857' :
                    entry.entry_placement === 'Set 1 Closer' ? '#1e40af' :
                    entry.entry_placement === 'Set 2 Opener' || 
                    entry.entry_placement === 'Set 3 Opener' || 
                    entry.entry_placement === 'Set 4 Opener' || 
                    entry.entry_placement === 'Set 5 Opener' ? '#10b981' :
                    entry.entry_placement === 'Set 2 Closer' || 
                    entry.entry_placement === 'Set 3 Closer' || 
                    entry.entry_placement === 'Set 4 Closer' || 
                    entry.entry_placement === 'Set 5 Closer' ? '#3b82f6' :
                    entry.entry_placement === 'Encore 1' ? '#be123c' :
                    entry.entry_placement === 'Encore 2' ? '#f43f5e' : 
                    entry.entry_placement === 'Encore 3' ? '#f43f5e' :
                    '#e0dcc3'
                }}
              >
                {/* {displayNumber || '\u00A0'} */}&nbsp;
              </div>
              <div className="flex-1 pl-2">
                <span className="font-medium">
                  <Link
                    to={`/song/${entry.songs.song_id}`}
                    className="text-fifth text-[0.625rem] hover:underline cursor-pointer mr-2"
                  >
                    {entry.entry_song}
                  </Link>
                  {entry.entry_short && (
                    <span className="text-red-500 font-sans font-medium text-[0.625rem] leading-[0.5rem] mr-2">[{entry.entry_short}]</span>
                  )}
                  {entry.entry_segue && (
                    <MoveRight className="text-red-500 inline pb-0.5 w-[1rem] h-[1rem]" />
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