import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (guestGroups.length === 0) {
    return null;
  }

  return (
    <div className="bg-canvas border border-secondary rounded-lg p-2 mt-4 mx-8 relative">
      <User className="w-5 h-5 text-fifth absolute top-2 right-2" />
      <div className="grid grid-cols-[20px_1fr] gap-x-2 gap-y-1 pr-8 ml-1 items-center">
        {guestGroups.map((group, index) => (
          <React.Fragment key={index}>
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: group.color }}
            />
            <div className="text-fifth text-sm flex items-center flex-wrap">
              {group.guests
                .sort((a, b) => a.guest_canonid - b.guest_canonid)
                .map((g, gIndex) => (
                  <React.Fragment key={g.guest_id}>
                    <span className="inline-block whitespace-nowrap">
                      <span 
                        className="cursor-pointer hover:underline transition-colors font-medium"
                        onClick={() => {
                          navigate(`/personnel/${g.guest_id}`);
                          onClose();
                        }}
                      >
                        {g.guest_displayname}
                      </span>
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
