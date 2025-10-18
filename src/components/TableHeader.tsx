import React from 'react';
import { ArrowUp, ArrowDown, Check, FileMusic, Users, Star, AudioLines } from 'lucide-react';
import wlImage from '../img/WL.png';
import { useAuth } from '../context/AuthContext';

interface TableHeaderProps {
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function TableHeader({ sortColumn, sortDirection, onSort }: TableHeaderProps) {
  const { user } = useAuth();

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  return (
    <thead>
      <tr className="bg-canvas border-y border-white/10">
        <th className="w-1 px-0 py-1"></th>
        <th 
          className="px-3 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_date')}
        >
          <div className="flex items-center justify-center gap-1">
            Date
          </div>
        </th>
        {user && (
          <th className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth">
            <Check size={16} className="text-fifth" strokeWidth={4} />
          </th>
        )}
        <th 
          className="px-2 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_group')}
        >
          <div className="flex items-center gap-1">
            Group
          </div>
        </th>
        <th 
          className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_subvenue')}
        >
          <div className="flex items-center gap-1">
            Venue
          </div>
        </th>
        <th 
          className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_venue_location')}
        >
          <div className="flex items-center gap-1">
            Location
          </div>
        </th>
        <th 
          className="px-2 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('rating')}
        >
          <div className="flex items-center justify-center gap-1">
            Rating
          </div>
        </th>
        <th className="w-8 px-1 py-0.5 text-center align-middle text-s font-semibold text-fifth">
          <div className="flex justify-center items-center">
            <div className="text-primary bg-[#006400] rounded p-1">
              <FileMusic size={16} strokeWidth={2} />
            </div>
          </div>
        </th>
        <th className="w-8 px-1 py-0.5 text-center align-middle text-s font-semibold text-fifth">
          <div className="flex justify-center items-center">
            <div className="text-primary bg-[#7c2128] rounded p-1">
              <AudioLines size={16} strokeWidth={2} />
            </div>
          </div>
        </th>
        <th 
          className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth cursor-pointer hover:bg-black/10"
          onClick={() => onSort('attendee_count')}
        >
          <div className="flex justify-center items-center">
            <Users size={16} className="text-fifth" strokeWidth={2} />
          </div>
        </th>
        <th className="w-8 px-1 py-1 text-center text-s font-semibold text-fifth">
          <div className="flex justify-center items-center">
            <img src={wlImage} alt="WysteriaLane" className="w-4 h-4" />
          </div>
        </th>
        <th 
          className="px-2 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_detail')}
        >
          <div className="flex items-center gap-1">
            Detail
          </div>
        </th>
      </tr>
    </thead>
  );
}
