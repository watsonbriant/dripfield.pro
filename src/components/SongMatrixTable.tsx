import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getColumnBackgroundColor, groupShowsByYear } from '../utils/songMatrixUtils';

interface SongMatrixTableProps {
  songMatrix: any;
  shows: Array<any>;
  songIdMap: { [songName: string]: string };
  yearIdMap: { [year: string]: string };
}

export const SongMatrixTable: React.FC<SongMatrixTableProps> = ({
  songMatrix,
  shows,
  songIdMap,
  yearIdMap
}) => {
  const navigate = useNavigate();
  const yearGroups = groupShowsByYear(shows);

  return (
    <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
      <table className="w-full border-collapse min-w-max">
        <thead>
          {/* Year headers row */}
          <tr className="bg-canvas border-y border-[#b4b2b2]">
            {/* Song cell that spans both rows */}
            <th 
              className="px-2 py-0.5 text-left text-xs font-medium text-fifth border-l border-r border-fourth"
              rowSpan={2}
              style={{ 
                verticalAlign: 'bottom',
                borderRight: '1px solid rgb(180, 178, 178)',
                borderTop: '1px solid rgb(180, 178, 178)',
                borderLeft: '1px solid rgb(180, 178, 178)'
              }}
            >
              Song
            </th>
            
            {/* Year spans */}
            {yearGroups.map((group, i) => {
              const colSpan = group.shows.length;
              return (
                <th 
                  key={`year-${i}`} 
                  colSpan={colSpan}
                  className="px-1 py-0.5 text-center text-xs font-semibold text-fifth"
                  style={{
                    borderRight: '1px solid rgb(180, 178, 178)',
                    borderTop: '1px solid rgb(180, 178, 178)'
                  }}
                >
                  <button 
                    onClick={() => {
                      const yearId = yearIdMap[group.year];
                      if (yearId) {
                        navigate(`/years/${yearId}`);
                      }
                    }}
                    className="hover:underline transition-colors"
                  >
                    {group.year}
                  </button>
                </th>
              );
            })}
          </tr>
          
          {/* Date headers row */}
          <tr className="bg-canvas border-y border-[#b4b2b2]">
            {songMatrix.showDates.map((date, index) => {
              // Find the corresponding show from the shows array
              const showId = shows[index]?.show_id || "";
              
              return (
                <th 
                  key={index} 
                  className="px-1 py-0.5 text-center text-xs font-medium text-fifth whitespace-nowrap" 
                  style={{ 
                    width: 'min-content',
                    borderRight: '1px solid #b4b2b2'
                  }}
                >
                  <Link 
                    to={`/setlist/${showId}`}
                    className="hover:underline transition-colors"
                  >
                    {date}
                  </Link>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d9c3a5]">
          {songMatrix.songs.map((song, songIndex) => {
            const performances = songMatrix.data[song] || [];
            
            return (
              <tr 
                key={song} 
                className={`${songIndex % 2 === 0 ? 'bg-primary' : 'bg-primary'} hover:bg-tertiary/40`}
              >
                <td 
                  className="text-fifth whitespace-nowrap font-semibold text-xs border"
                  style={{ borderColor: 'rgb(180, 178, 178)' }}
                >
                  <button 
                    onClick={() => {
                      const songId = songIdMap[song];
                      if (songId) {
                        navigate(`/song/${songId}`);
                      }
                    }}
                    className="text-[0.625rem] px-2 font-medium hover:underline transition-colors cursor-pointer"
                  >
                    {song}
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
                          {performance.venueAppearanceCount}
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
