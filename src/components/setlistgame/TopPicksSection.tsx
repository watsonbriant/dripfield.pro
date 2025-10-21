import React from 'react';
import { Link } from 'react-router-dom';
import { MusicIcon } from 'lucide-react';
import { SongStat } from '../../hooks/useSetlistGameShowData';
import { cleanSongName } from '../../utils/setlistGameUtils';

interface TopPicksSectionProps {
  topSongs: SongStat[];
  topOpeners: SongStat[];
  topClosers: SongStat[];
  activePill: 'songs' | 'openers' | 'closers';
  onPillChange: (pill: 'songs' | 'openers' | 'closers') => void;
}

export function TopPicksSection({ topSongs, topOpeners, topClosers, activePill, onPillChange }: TopPicksSectionProps) {
  const renderSongList = (songs: SongStat[], emptyMessage: string) => {
    if (songs.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-fifth">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {songs.map((song, index) => (
          <div
            key={song.song}
            className="flex items-center justify-between rounded-md bg-canvas"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm text-fifth bg-black/10 px-2 rounded font-medium border border-secondary/10 min-w-[24px] text-center">
                {index + 1}
              </span>
              {song.category_artwork && (
                <img
                  src={song.category_artwork}
                  alt={`${song.song} artwork`}
                  className="w-6 h-6 rounded-full object-cover border border-secondary/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <Link
                to={`/song/${song.song_id}`}
                className="text-fifth font-trad text-[1rem] leading-[1rem] pb-1 hover:underline transition-colors truncate"
              >
                {cleanSongName(song.song)}
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-fifth bg-primary px-2 rounded font-medium border border-secondary/10 min-w-[28px] text-center">
                {song.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Mobile view */}
      <div className="mb-6 lg:hidden">
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap gap-2">
              <MusicIcon className="w-5 h-5 text-fifth mb-0.5" />
              <span>Top Picks</span>
            </h2>

            <div className="flex space-x-2">
              <button
                onClick={() => onPillChange('songs')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'songs'
                    ? 'bg-fourth text-primary border-secondary'
                    : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                  }`}
              >
                Songs
              </button>
              <button
                onClick={() => onPillChange('openers')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'openers'
                    ? 'bg-[#006400] text-primary border-secondary'
                    : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                  }`}
              >
                Openers
              </button>
              <button
                onClick={() => onPillChange('closers')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activePill === 'closers'
                    ? 'bg-[#E17401] text-primary border-secondary'
                    : 'bg-black/10 text-fifth border-secondary/30 hover:bg-black/20'
                  }`}
              >
                Closers
              </button>
            </div>
          </div>

          <div className="rounded-lg">
            {activePill === 'songs' && renderSongList(topSongs, 'No song data available yet.')}
            {activePill === 'openers' && renderSongList(topOpeners, 'No opener data available yet.')}
            {activePill === 'closers' && renderSongList(topClosers, 'No closer data available yet.')}
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Top Songs Picked */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <h3 className="text-lg font-semibold bg-fourth text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
            <MusicIcon className="w-4 h-4 text-primary" />
            <span>Top Songs Picked</span>
          </h3>
          {renderSongList(topSongs, 'No song data available yet.')}
        </div>

        {/* Top Show Openers Picked */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <h3 className="text-lg font-semibold bg-[#006400] text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
            <MusicIcon className="w-4 h-4 text-primary" />
            <span>Top Show Openers</span>
          </h3>
          {renderSongList(topOpeners, 'No opener data available yet.')}
        </div>

        {/* Top Show Closers Picked */}
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <h3 className="text-lg font-semibold bg-[#E17401] text-primary inline-flex px-3 py-0.5 rounded-lg border border-secondary mb-3 flex items-center gap-2">
            <MusicIcon className="w-4 h-4 text-primary" />
            <span>Top Show Closers</span>
          </h3>
          {renderSongList(topClosers, 'No closer data available yet.')}
        </div>
      </div>
    </div>
  );
}
