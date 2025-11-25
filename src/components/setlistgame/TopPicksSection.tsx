import React from 'react';
import { Link } from 'react-router-dom';
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
        <div className="text-center py-4">
          <p className="text-fifth text-[0.625rem]">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {songs.map((song, index) => (
          <div
            key={song.song}
            className="flex items-center justify-between rounded-md bg-primary hover:bg-tertiary/40 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[0.625rem] text-fifth px-1.5 font-medium min-w-[20px] text-center">
                {index + 1}
              </span>
              {song.category_artwork && (
                <img
                  src={song.category_artwork}
                  alt={`${song.song} artwork`}
                  className="w-4 h-4 rounded object-cover border border-fourth"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <Link
                to={`/song/${song.song_id}`}
                className="text-fifth font-medium text-[0.625rem] hover:underline transition-colors truncate"
              >
                {cleanSongName(song.song)}
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-[0.625rem] text-fifth bg-canvas px-1.5 rounded font-medium border border-fourth min-w-[24px] text-center">
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
        <div className="bg-primary border border-fourth">
          <div className="bg-tertiary text-fifth px-2 py-0.5 flex justify-between items-center">
            <h2 className="text-sm font-medium">
              Top Picks
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => onPillChange('songs')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors border ${activePill === 'songs'
                    ? 'bg-fourth text-white border-fourth'
                    : 'bg-canvas text-fifth border-fourth hover:bg-primary'
                  }`}
              >
                Songs
              </button>
              <button
                onClick={() => onPillChange('openers')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors border ${activePill === 'openers'
                    ? 'bg-[#006400] text-white border-fourth'
                    : 'bg-canvas text-fifth border-fourth hover:bg-primary'
                  }`}
              >
                Openers
              </button>
              <button
                onClick={() => onPillChange('closers')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors border ${activePill === 'closers'
                    ? 'bg-[#E17401] text-white border-fourth'
                    : 'bg-canvas text-fifth border-fourth hover:bg-primary'
                  }`}
              >
                Closers
              </button>
            </div>
          </div>

          <div className="px-2 py-1">
            {activePill === 'songs' && renderSongList(topSongs, 'No song data available yet.')}
            {activePill === 'openers' && renderSongList(topOpeners, 'No opener data available yet.')}
            {activePill === 'closers' && renderSongList(topClosers, 'No closer data available yet.')}
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Top Songs Picked */}
        <div className="bg-primary border border-fourth">
          <div className="bg-fourth text-white px-2 py-0.5">
            <h3 className="text-sm font-medium">
              Top Songs Picked
            </h3>
          </div>
          <div className="px-2 py-1">
            {renderSongList(topSongs, 'No song data available yet.')}
          </div>
        </div>

        {/* Top Show Openers Picked */}
        <div className="bg-primary border border-fourth">
          <div className="bg-[#047857] text-white px-2 py-0.5">
            <h3 className="text-sm font-medium">
              Top Show Openers
            </h3>
          </div>
          <div className="px-2 py-1">
            {renderSongList(topOpeners, 'No opener data available yet.')}
          </div>
        </div>

        {/* Top Show Closers Picked */}
        <div className="bg-primary border border-fourth">
          <div className="bg-[#3b82f6] text-white px-2 py-0.5">
            <h3 className="text-sm font-medium">
              Top Show Closers
            </h3>
          </div>
          <div className="px-2 py-1">
            {renderSongList(topClosers, 'No closer data available yet.')}
          </div>
        </div>
      </div>
    </div>
  );
}
