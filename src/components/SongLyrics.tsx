import React from 'react';

interface SongLyricsProps {
  lyrics: string | null;
}

export function SongLyrics({ lyrics }: SongLyricsProps) {
  if (!lyrics) {
    return null;
  }

  return (
    <div className="h-fit xl:sticky xl:top-3">
      <div className="bg-primary border border-fourth w-full shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h3 className="text-sm font-semibold">Lyrics</h3>
        </div>
        <div className="px-2 py-1">
          <div 
            className="text-fifth font-light text-[0.625rem] leading-[0.75rem] lyrics-container pr-2"
            dangerouslySetInnerHTML={{ 
              __html: lyrics.replace(
                /\[(.*?)\]/g, 
                '<span class="font-medium">[$1]</span>'
              ) 
            }}
          />
        </div>
      </div>
    </div>
  );
}
