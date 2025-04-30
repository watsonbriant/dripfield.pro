import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SlotItem {
  left: string;
  right: string | number;
}

interface SlotData {
  title: string;
  headerLeft: string;
  headerRight: string;
  data: SlotItem[];
}

interface TopSlotsCarouselProps {
  slots: SlotData[];
  isMobile?: boolean;
  songIdMap?: { [songName: string]: string };
  onSongClick?: (songId: string) => void;
}

const TopSlotsCarousel = ({ 
  slots, 
  isMobile = false, 
  songIdMap = {}, 
  onSongClick 
}: TopSlotsCarouselProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSongClick = (songName: string) => {
    if (onSongClick && songIdMap && songIdMap[songName]) {
      onSongClick(songIdMap[songName]);
    }
  };
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Return null if no slots or no data within slots
  if (!slots || slots.length === 0 || slots.every(slot => slot.data.length === 0)) {
    return null;
  }

  // Filter slots to only include ones with data
  const slotsWithData = slots.filter(slot => slot.data.length > 0);
  
  // If after filtering we have no slots with data, return null
  if (slotsWithData.length === 0) {
    return null;
  }

  // Ensure currentSlideIndex is valid
  const safeCurrentIndex = Math.min(currentSlideIndex, slotsWithData.length - 1);
  const currentSlide = slotsWithData[safeCurrentIndex];
  const currentTitle = currentSlide.title;

  // Function to render a single slot table
  const renderSlotTable = (slot: SlotData) => {
    // If no data, don't render the table
    if (slot.data.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-[#172330] border border-white/10 rounded-lg p-4 h-full">
        <h2 className="text-xl font-semibold text-white/90 mb-4">{`Top ${slot.title}`}</h2>
        <div className="overflow-y-auto max-h-64">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-4 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">{slot.headerLeft || 'Song'}</th>
                <th className="px-4 py-1 text-right text-s font-semibold text-white/90 whitespace-nowrap">{slot.headerRight || 'Count'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slot.data.map((item, itemIndex) => (
                <tr
                  key={itemIndex}
                  className={`${itemIndex % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'} hover:bg-white/10 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 font-semibold">
                    <span 
                      className="text-[#fce7ca]/90 cursor-pointer hover:text-white hover:underline"
                      onClick={() => handleSongClick(item.left)}
                    >
                      {item.left}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 text-right text-[#fce7ca]/90 font-semibold">
                    {typeof item.right === 'number' ? `${item.right}` : item.right}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile view - shown when isMobile is true or screen is smaller than md */}
      <div className={`${!isMobile ? "md:hidden" : ""}`}>
        <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white/90">Top Slots</h2>
            
            {/* Dropdown selector for mobile */}
            {slotsWithData.length > 1 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-1 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors text-sm whitespace-nowrap"
                >
                  {currentTitle}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 py-1 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 overflow-y-auto w-48">
                    {slotsWithData.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentSlideIndex(index);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors ${
                          index === safeCurrentIndex ? 'bg-surface-secondary' : ''
                        }`}
                      >
                        {slot.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile content */}
          <div className="overflow-y-auto max-h-72">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0e151b] border-y border-white/10">
                  <th className="px-4 py-1 text-left text-s font-semibold text-white/90 whitespace-nowrap">{currentSlide.headerLeft || 'Song'}</th>
                  <th className="px-4 py-1 text-right text-s font-semibold text-white/90 whitespace-nowrap">{currentSlide.headerRight || 'Count'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentSlide.data.map((item, itemIndex) => (
                  <tr
                    key={itemIndex}
                    className={`${itemIndex % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'} hover:bg-white/10 transition-colors text-xs`}
                  >
                    <td className="px-4 py-0.5 font-semibold">
                      <span 
                        className="text-[#fce7ca]/90 cursor-pointer hover:text-white hover:underline"
                        onClick={() => handleSongClick(item.left)}
                      >
                        {item.left}
                      </span>
                    </td>
                    <td className="px-4 py-0.5 text-right text-[#fce7ca]/90 font-semibold">
                      {typeof item.right === 'number' ? `${item.right}` : item.right}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Desktop view - hidden when isMobile is true or screen is smaller than md */}
      <div className={`${!isMobile ? "hidden md:grid" : "hidden"} md:grid-cols-2 gap-4`}>
        {slotsWithData.map((slot, index) => (
          <div key={index}>
            {renderSlotTable(slot)}
          </div>
        ))}
      </div>
    </>
  );
};

export default TopSlotsCarousel;