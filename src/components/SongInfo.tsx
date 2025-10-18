import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { getRarityColor } from '../utils/songUtils';
import { SongData, Stats, LastPlayed } from '../types/song';

interface SongInfoProps {
  song: SongData;
  stats: Stats;
  lastPlayed: LastPlayed | null;
  selectedGroup: string | null;
  onGroupClick: (group: string) => void;
}

export function SongInfo({ song, stats, lastPlayed, selectedGroup, onGroupClick }: SongInfoProps) {
  const navigate = useNavigate();

  return (
    <div className={`grid grid-cols-1 ${
      !stats.groupCounts.length && !song.song_coachnotes
        ? 'md:grid-cols-1'
        : (!stats.groupCounts.length || !song.song_coachnotes)
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3'
    } gap-4`}>
      <div className="h-full">
        <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full">
          {song.categories?.category_artwork && (
            <img 
              src={song.categories.category_artwork}
              alt={`${song.song_category} artwork`}
              className="float-right ml-3 mb-2 w-20 h-20 rounded-md object-cover border border-secondary"
            />
          )}
          <div className="space-y-2">
            <div>
              <div className="text-fifth text-base font-medium">Category</div>
              <div className="text-fifth text-sm font-light mb-1">{song.song_category}</div>
            </div>
            {song.song_originalartist && (
              <div>
                <div className="text-fifth text-base font-medium">Original Artist</div>
                <div className="text-fifth text-sm font-light">{song.song_originalartist}</div>
              </div>
            )}
            {lastPlayed && (
              <div>
                <div className="text-fifth text-base font-medium">Last Time Played</div>
                <div className="text-fifth text-sm font-light">
                  <button
                    onClick={() => navigate(`/setlist/${lastPlayed.show_id}`)}
                    className="hover:underline cursor-pointer font-medium"
                  >
                    {formatInTimeZone(new Date(lastPlayed.show_date), 'UTC', 'MM.dd.yy')}
                  </button> ({lastPlayed.showsAgo === 1 ? 'most recent show' : `${lastPlayed.showsAgo} shows ago`})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
      {stats.groupCounts.length > 0 && (
        <div className="h-full">
          <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full space-y-2">
            {stats.hasRarity && (
              <>
                <div className="flex items-center mb-1">
                  <div className="text-fifth text-base font-medium">Song Rarity</div>
                  <span 
                    className="text-primary text-sm font-normal border border-secondary px-2 py-0.5 rounded-md inline-block ml-6"
                    style={{ 
                      backgroundColor: getRarityColor(stats.rarity) 
                    }}
                  >
                    {stats.rarity}
                  </span>
                </div>
              </>
            )}
            <div className={!stats.hasRarity ? "mt-0" : ""}>
              <div className="text-fifth text-base font-medium mb-1">Performances by Group</div>
              <div>
                {stats.groupCounts.map(({ group, count }) => (
                  <div 
                    key={group} 
                    className={`pl-2 pr-2 text-fifth text-sm flex justify-between font-medium cursor-pointer ${
                      selectedGroup === group ? 'bg-tertiary/80' : 'hover:bg-tertiary/40'
                    }`}
                    onClick={() => onGroupClick(group)}
                  >
                    <span className='font-light'>{group}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    
      {song.song_coachnotes && (
        <div className="h-full">
          <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full">
            <div className="text-fifth text-base font-medium mb-1">Song Notes</div>
            <div 
              className="text-fifth font-light text-xs [&_a]:font-medium"
              dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
