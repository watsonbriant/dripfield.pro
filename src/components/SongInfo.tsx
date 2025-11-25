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
    } gap-2`}>
      <div className="h-full">
        <div className="bg-primary border border-fourth w-full h-full">
          <div className="bg-tertiary text-fifth px-2 py-0.5">
            <h3 className="text-sm font-semibold">Song Info</h3>
          </div>
          <div className="py-1 px-2">
            {song.categories?.category_artwork && (
              <img 
                src={song.categories.category_artwork}
                alt={`${song.song_category} artwork`}
                className="float-right ml-3 mb-2 w-20 h-20 rounded object-cover border border-fourth"
              />
            )}
            <div className="space-y-1">
              <div>
                <div className="text-fifth text-xs font-medium">Category</div>
                <div className="text-fifth text-[0.625rem] font-light">{song.song_category}</div>
              </div>
              {song.song_originalartist && (
                <div>
                  <div className="text-fifth text-xs font-medium">Original Artist</div>
                  <div className="text-fifth text-[0.625rem] font-light">{song.song_originalartist}</div>
                </div>
              )}
              {lastPlayed && (
                <div>
                  <div className="text-fifth text-xs font-medium">Last Time Played</div>
                  <div className="text-fifth text-[0.625rem] font-light">
                    <button
                      onClick={() => navigate(`/setlist/${lastPlayed.show_id}`)}
                      className="hover:underline cursor-pointer font-medium pr-2"
                    >
                      {formatInTimeZone(new Date(lastPlayed.show_date), 'UTC', 'MM.dd.yy')}
                    </button> ({lastPlayed.showsAgo === 1 ? 'most recent show' : `${lastPlayed.showsAgo} shows ago`})
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    
      {stats.groupCounts.length > 0 && (
        <div className="h-full">
          <div className="bg-primary border border-fourth w-full h-full">
            <div className="bg-tertiary text-fifth px-2 py-0.5">
              <h3 className="text-sm font-semibold">Stats</h3>
            </div>
            <div className="px-2 py-1 space-y-2">
              {stats.hasRarity && (
                <>
                  <div className="flex items-center">
                    <div className="text-fifth text-xs font-medium">Song Rarity</div>
                    <span 
                      className="text-white text-[0.625rem] font-normal border border-fourth px-1 rounded inline-block ml-6"
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
                <div className="text-fifth text-xs font-medium">Performances by Group</div>
                <div>
                  {stats.groupCounts.map(({ group, count }) => (
                    <div 
                      key={group} 
                      className={`px-2 text-fifth text-[0.625rem] flex justify-between font-medium cursor-pointer ${
                        selectedGroup === group ? 'bg-fourth/80 text-white' : 'hover:bg-tertiary/40'
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
        </div>
      )}
    
      {song.song_coachnotes && (
        <div className="h-full">
          <div className="bg-primary border border-fourth w-full h-full">
            <div className="bg-tertiary text-fifth px-2 py-0.5">
              <h3 className="text-sm font-semibold">Song Notes</h3>
            </div>
            <div className="px-2 py-1">
              <div 
                className="text-fifth font-light text-[0.625rem] leading-[0.75rem] [&_a]:font-medium"
                dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
