import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Guest } from '../types/guests';

interface GuestTableProps {
  category: string;
  guests: Guest[];
  count: number;
}

const GuestTable: React.FC<GuestTableProps> = ({ category, guests, count }) => {
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
  
  return (
    <div className="bg-primary p-3 rounded-lg border border-fourth" key={category}>
      <h2 className="text-lg font-medium bg-fourth text-white text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth mb-2">{displayName}</h2>
    
      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-canvas border-y border-white/10">
              <th className="px-4 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap w-[40%]">Personnel</th>
              <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap w-[30%]"># of Songs</th>
              <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap w-[30%]"># of Shows</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {guests.map((guest, index) => (
              <tr
                key={guest.guest_id}
                className={`${
                  index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                } hover:bg-tertiary/40 transition-colors text-xs`}
              >
                <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/personnel/${guest.guest_id}`)}
                    className="font-medium hover:underline transition-colors"
                  >
                    {guest.guest}
                  </button>
                </td>
                <td className="px-4 py-0.5 text-center text-fifth font-light whitespace-nowrap">{guest.song_count}</td>
                <td className="px-4 py-0.5 text-center text-fifth font-light whitespace-nowrap">{guest.show_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestTable;
