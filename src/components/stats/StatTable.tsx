import React from 'react';
import { Link } from 'react-router-dom';

interface StatTableProps {
  title: string;
  bgColor: string;
  items: Array<{ song_id: string; song?: string; song_name?: string; play_count?: number; times_played?: number; category_artwork?: string }>;
  getDisplayName: (item: any) => string;
  getCount: (item: any) => number | string;
  isLast?: boolean;
}

export const StatTable: React.FC<StatTableProps> = ({ title, bgColor, items, getDisplayName, getCount, isLast = false }) => (
  <div className={isLast ? "pb-0 border-x-[0.5px] border-y-[0.5px] border-fourth" : "pb-1 border-x-[0.5px] border-y-[0.5px] border-fourth"}>
    <div className={`${bgColor} text-white px-2 py-0.5 mb-0.5`}>
      <h3 className="text-sm font-medium">
        {title}
      </h3>
    </div>
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.song_id}
              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
            >
              <td className="pl-2 text-fifth">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/song/${item.song_id}`}
                    className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                  >
                    {getDisplayName(item)}
                  </Link>
                  {item.category_artwork && (
                    <img
                      src={item.category_artwork}
                      alt={`${getDisplayName(item)} artwork`}
                      className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </td>
              <td className="w-[30px] text-center font-medium text-fifth">
                {getCount(item)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

