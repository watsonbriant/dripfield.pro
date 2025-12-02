import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Guest } from '../types/guests';

interface GuestTableProps {
  category: string;
  guests: Guest[];
  count: number;
  isLast?: boolean;
}

const GuestTable: React.FC<GuestTableProps> = ({ category, guests, count, isLast = false }) => {
  const navigate = useNavigate();
  
  // Map database category names to display names
  const categoryDisplayNames: Record<string, string> = {
    'Goose (current)': 'Current Goose Members',
    'Goose (former)': 'Former Goose Members',
    'Guest': 'Guests',
    'Group': 'Groups'
  };
  
  // Use the mapped display name or fallback to the original category name
  const displayName = categoryDisplayNames[category] || category;
  
  // Get background color for category header (matching StatsSection pattern)
  const getCategoryBgColor = (cat: string): string => {
    const colorMap: Record<string, string> = {
      'Goose (current)': '#047857',
      'Goose (former)': '#1e40af',
      'Guest': '#10b981',
      'Group': '#3b82f6'
    };
    return colorMap[cat] || '#047857';
  };
  
  return (
    <div className={isLast ? "" : "border-r border-fourth"}>
      <div className={`bg-fourth text-white px-2 py-0.5`}>
        <h3 className="text-sm font-medium">
          {displayName}
        </h3>
      </div>
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-canvas">
              <th className="pl-2 py-0.5 text-left text-xs font-medium text-fifth">Personnel</th>
              <th className="w-[80px] py-0.5 text-center text-xs font-medium text-fifth"># of Songs</th>
              <th className="w-[80px] py-0.5 text-center text-xs font-medium text-fifth"># of Shows</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => (
              <tr
                key={guest.guest_id}
                className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                  } hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
              >
                <td className="pl-2 text-fifth">
                  <Link
                    to={`/personnel/${guest.guest_id}`}
                    className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                  >
                    {guest.guest}
                  </Link>
                </td>
                <td className="text-center font-medium text-fifth">
                  {guest.song_count}
                </td>
                <td className="text-center font-medium text-fifth text-[0.625rem]">
                  {guest.show_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestTable;
