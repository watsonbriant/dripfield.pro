import React from 'react';
import { User } from 'lucide-react';
import { GuestGroup } from '../../types/setlist';

interface GuestLegendProps {
  guestGroups: GuestGroup[];
  isMobile: boolean;
  hoverStates: {
    mousePosition: { x: number; y: number };
    hoveredPersonnel: string | null;
    setMousePosition: (pos: { x: number; y: number }) => void;
    setHoveredPersonnel: (id: string | null) => void;
  };
  onGuestClick: (guestId: string) => void;
}

export const GuestLegend: React.FC<GuestLegendProps> = ({
  guestGroups,
  isMobile,
  hoverStates,
  onGuestClick
}) => {
  const { mousePosition, hoveredPersonnel, setMousePosition, setHoveredPersonnel } = hoverStates;

  if (guestGroups.length === 0) return null;

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 h-fit relative">
      <User className="w-5 h-5 text-fifth absolute top-3 right-3" />
      <div className="grid grid-cols-[20px_1fr] gap-x-4 gap-y-1 pr-8">
        {guestGroups.map((group, index) => (
          <React.Fragment key={index}>
            <div 
              className="w-5 h-5 rounded"
              style={{ backgroundColor: group.color }}
            />
            <div className="text-fifth text-sm flex items-center flex-wrap">
              {group.guests
                .sort((a, b) => a.guest_canonid - b.guest_canonid)
                .map((g, gIndex) => (
                  <React.Fragment key={g.guest_id}>
                    <span className="inline-block whitespace-nowrap">
                      <span 
                        className="cursor-pointer hover:underline transition-colors font-medium relative"
                        onClick={() => onGuestClick(g.guest_id)}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            setHoveredPersonnel(g.guest_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseMove={(e) => {
                          if (!isMobile) {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isMobile) {
                            setHoveredPersonnel(null);
                          }
                        }}
                      >
                        {g.guest_display_name}
                        {!isMobile && hoveredPersonnel === g.guest_id && (
                          <div 
                            className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] whitespace-nowrap"
                            style={{
                              left: `${mousePosition.x + 10}px`,
                              top: `${mousePosition.y - 10}px`
                            }}
                          >
                            {g.guest_instrument}
                          </div>
                        )}
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
