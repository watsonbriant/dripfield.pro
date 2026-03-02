import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, ArrowDown, Check, FileMusic, Users, Star, AudioLines } from 'lucide-react';
import wlImage from '../img/WL.png';
import wtedImage from '../img/WTED.png';
import { useAuth } from '../context/AuthContext';

interface TableHeaderProps {
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function TableHeader({ sortColumn, sortDirection, onSort }: TableHeaderProps) {
  const { user } = useAuth();
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    text: string;
    position: { x: number; y: number } | null;
  }>({
    isVisible: false,
    text: '',
    position: null
  });

  const updateTooltip = (text: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTooltipState({
      isVisible: true,
      text,
      position: { x: rect.left + rect.width / 2, y: rect.top - 5 }
    });
  };

  const hideTooltip = () => {
    setTooltipState({ isVisible: false, text: '', position: null });
  };

  // Update tooltip position on scroll/resize
  useEffect(() => {
    if (!tooltipState.isVisible || !tooltipState.position) return;

    const updatePosition = () => {
      hideTooltip();
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [tooltipState.isVisible, tooltipState.position]);

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline-block ml-1 text-fifth" /> : 
      <ArrowDown className="w-4 h-4 inline-block ml-1 text-fifth" />;
  };

  return (
    <>
    <thead>
      <tr className="bg-canvas border-y border-white/10">
        <th className="w-1 px-0"></th>
        <th 
          className="px-2 text-center text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_date')}
        >
          <div className="flex items-center justify-center gap-1">
            Date
          </div>
        </th>
        {user && (
          <th className="px-1 text-center text-sm font-medium text-fifth">
            <div className="flex justify-center items-center">
              <Check size={12} className="text-fifth" strokeWidth={4} />
            </div>
          </th>
        )}
        <th 
          className="px-2 text-center text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_group')}
        >
          <div className="flex items-center gap-1">
            Group
          </div>
        </th>
        <th 
          className="px-2 text-left text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_subvenue')}
        >
          <div className="flex items-center gap-1">
            Venue
          </div>
        </th>
        <th 
          className="px-2 text-left text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_venue_location')}
        >
          <div className="flex items-center gap-1">
            Location
          </div>
        </th>
        <th 
          className="px-2 text-center text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('rating')}
        >
          <div className="flex items-center justify-center gap-1">
            Rating
          </div>
        </th>
        <th className="px-1 text-center align-middle text-sm font-medium text-fifth">
          <div 
            className="flex justify-center items-center"
            onMouseEnter={(e) => updateTooltip('Setlist Scan', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <div className="text-white bg-[#006400] rounded p-0.5">
              <FileMusic size={12} strokeWidth={2} />
            </div>
          </div>
        </th>
        <th className="px-1 text-center align-middle text-sm font-medium text-fifth">
          <div 
            className="flex justify-center items-center"
            onMouseEnter={(e) => updateTooltip('Media Available', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <div className="text-white bg-[#7c2128] rounded p-0.5">
              <AudioLines size={12} strokeWidth={2} />
            </div>
          </div>
        </th>
        <th 
          className="px-1 text-center text-sm font-medium text-fifth cursor-pointer hover:bg-black/10"
          onClick={() => onSort('attendee_count')}
        >
          <div 
            className="flex justify-center items-center"
            onMouseEnter={(e) => updateTooltip('Show Attendees', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <Users size={12} className="text-fifth" strokeWidth={2} />
          </div>
        </th>
        <th className="px-1 text-center text-sm font-medium text-fifth">
          <div 
            className="flex justify-center items-center"
            onMouseEnter={(e) => updateTooltip('Chat on WysteriaLane.org', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <img src={wlImage} alt="WysteriaLane" className="w-[12px] h-[12px]" />
          </div>
        </th>
        <th className="px-1 text-center text-sm font-medium text-fifth">
          <div 
            className="flex justify-center items-center"
            onMouseEnter={(e) => updateTooltip('WTED Goose Radio', e.currentTarget)}
            onMouseLeave={hideTooltip}
          >
            <img src={wtedImage} alt="WTED" className="w-[12px] h-[12px]" />
          </div>
        </th>
        <th 
          className="px-2 text-left text-sm font-medium text-fifth whitespace-nowrap cursor-pointer hover:bg-black/10"
          onClick={() => onSort('show_detail')}
        >
          <div className="flex items-center gap-1">
            Detail
          </div>
        </th>
      </tr>
    </thead>
    {/* Tooltip Portal */}
    {tooltipState.isVisible && tooltipState.position && createPortal(
      <div 
        className="fixed text-[0.625rem] leading-[0.75rem] font-normal bg-canvas text-fifth px-1.5 py-1 rounded border border-fourth shadow-lg whitespace-nowrap pointer-events-none z-[99999]"
        style={{ 
          left: `${tooltipState.position.x}px`,
          top: `${tooltipState.position.y}px`,
          transform: 'translate(-50%, -100%)',
          marginTop: '-4px'
        }}
      >
        {tooltipState.text}
      </div>,
      document.body
    )}
    </>
  );
}
