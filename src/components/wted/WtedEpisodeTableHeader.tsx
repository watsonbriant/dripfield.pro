import React from 'react';
import { User } from 'lucide-react';

export const WtedEpisodeTableHeader: React.FC = () => {
  return (
    <thead>
      <tr className="text-white text-xs bg-fourth">
        <th className="font-semibold px-1.5 py-0.5 text-center whitespace-nowrap">#</th>
        <th className="font-semibold px-2 py-0.5 text-left">Song</th>
        <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">Date</th>
        <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">
          <span className="block text-center">Location</span>
        </th>
        <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">Time</th>
        <th className="font-semibold px-2 py-0.5 text-center whitespace-nowrap">
          <User strokeWidth={2} className="text-white w-3.5 h-3.5 inline" />
        </th>
        <th className="font-semibold px-2 py-0.5 text-left max-w-[500px]">Coach's Notes</th>
      </tr>
    </thead>
  );
};

