import React from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string;
}

interface GuestGroup {
  color: string;
  guests: Guest[];
}

interface GuestLegendProps {
  guestGroups: GuestGroup[];
  onClose: () => void;
}

const GuestLegend: React.FC<GuestLegendProps> = ({ guestGroups, onClose }) => {
  if (guestGroups.length === 0) {
    return null;
  }

  return (
    <div className="bg-canvas px-6 py-1 relative">
      <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-0.5 items-center">
        {guestGroups.map((group, index) => (
          <React.Fragment key={index}>
            <div 
              className="w-4 h-4 rounded border border-fourth"
              style={{ backgroundColor: group.color }}
            />
            <div className="text-fifth text-[0.625rem] flex items-center flex-wrap">
              {group.guests
                .sort((a, b) => a.guest_canonid - b.guest_canonid)
                .map((g, gIndex) => (
                  <React.Fragment key={g.guest_id}>
                    <span className="inline-block whitespace-nowrap">
                      <Link 
                        to={`/personnel/${g.guest_id}`}
                        onClick={onClose}
                        className="cursor-pointer hover:underline transition-colors font-medium"
                      >
                        {g.guest_displayname}
                      </Link>
                      {gIndex < group.guests.length - 1 && <span>,&nbsp;</span>}
                    </span>
                  </React.Fragment>
                ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GuestLegend;
