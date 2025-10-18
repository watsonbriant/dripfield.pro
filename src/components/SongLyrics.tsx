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
      <div className="bg-primary rounded-lg p-3 border border-secondary w-full">
        <div className="text-fifth text-base font-medium mb-1">Lyrics</div>
        <div 
          className="text-fifth font-light text-xs lyrics-container pr-2"
          dangerouslySetInnerHTML={{ 
            __html: lyrics.replace(
              /\[(.*?)\]/g, 
              '<span class="font-medium">[$1]</span>'
            ) 
          }}
        />
      </div>
    </div>
  );
}
