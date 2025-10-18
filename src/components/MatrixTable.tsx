import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanSongName, getColumnBackgroundColor } from '../utils/songMatrixUtils';

interface MatrixTableProps {
  songMatrix: {
    songs: string[];
    showDates: string[];
    data: Record<string, Array<{ 
      showId: string, 
      placement: string | null,
      count: number,
      tourAppearanceCount: number
    }>>;
    songMetadata: Record<string, {
      totalCount: number,
      firstPlayedShowIndex: number,
      lastMaxPlayedShowIndex: number,
      categoryCanonId: number
    }>;
  };
  sortedSongs: string[];
  shows: Array<any>;
  onSongClick: (songName: string) => void;
}

const MatrixTable: React.FC<MatrixTableProps> = ({ 
  songMatrix, 
  sortedSongs, 
  shows, 
  onSongClick 
}) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-secondary">
            <th className="px-2 py-1 text-left text-xs font-medium text-fifth border-l border-r border-secondary">
              Song
            </th>
            {songMatrix.showDates.map((date, index) => {
              // Find the corresponding show from the shows array
              const showId = shows[index]?.show_id || "";
              
              return (
                <th 
                  key={index} 
                  className="px-1 py-1 text-center text-xs font-medium text-fifth whitespace-nowrap border-l border-r border-secondary" 
                  style={{ width: 'min-content' }}
                >
                  <button 
                    onClick={() => navigate(`/setlist/${showId}`)}
                    className="hover:text-[#a9682e] transition-colors"
                  >
                    {date}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d9c3a5]">
          {sortedSongs.map((song, songIndex) => {
            const performances = songMatrix.data[song] || [];
            
            return (
              <tr 
                key={song} 
                className={`${songIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-tertiary/40`}
              >
                <td className="font-trad text-fifth text-[.875rem] leading-[1rem] pb-1 px-2 whitespace-nowrap font-trad border"
                  style={{ borderColor: 'rgb(180, 178, 178)' }}>
                  <button 
                    onClick={() => onSongClick(song)}
                    className="hover:underline transition-colors cursor-pointer"
                  >
                    {cleanSongName(song)}
                  </button>
                </td>
                
                {shows.map((show) => {
                  const performance = performances.find(p => p.showId === show.show_id);
                  const bgColor = performance ? getColumnBackgroundColor(performance.placement) : '';
                  
                  return (
                    <td 
                      key={`${song}-${show.show_id}`} 
                      className="text-center border"
                      style={{ backgroundColor: bgColor, borderColor: 'rgb(180, 178, 178)' }}
                    >
                      {performance && (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                          {performance.tourAppearanceCount}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MatrixTable;
