import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SongTourPerformancesModal from './SongTourPerformancesModal';

interface SlotItem {
  left: string;
  right: string | number;
  artwork?: string;
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
  isLoading?: boolean;
  tourId?: string; // Added tourId prop
}

const TopSlotsCarousel = ({ 
  slots, 
  isMobile = false, 
  songIdMap = {}, 
  onSongClick,
  isLoading = false,
  tourId = ''
}: TopSlotsCarouselProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  const handleSongClick = (songName: string) => {
    setModalSongData({
      isOpen: true,
      songName: songName
    });
  };
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Define a function to get different background colors based on slot type or index
  const getHeaderBgColor = (title: string, index: number) => {
    // Color palette for different slot types
    const colorMap: Record<string, string> = {
      'Show Openers': '#047857',
      'Set Openers': '#10b981',  
      'Set Closers': '#3b82f6', 
      'Encores': '#be123c',    
      // Fallback colors based on index if title doesn't match
      '0': '#006400',
      '1': '#019B7A',
      '2': '#E17401',
      '3': '#7C2128'    
    };
    
    // Return the color based on title, or fallback to index-based color
    return colorMap[title] || colorMap[index.toString()] || '#8ec1b6'; // Default amber
  };
  
  // Convert hex color to rgba with specified opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
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
  const renderSlotTable = (slot: SlotData, index: number) => {
    // If no data, don't render the table
    if (slot.data.length === 0) {
      return null;
    }
    
    // Get the background color for this header
    const headerBgColor = getHeaderBgColor(slot.title, index);
    
    return (
      <div className="bg-primary border border-fourth pb-0.5">
        <div 
          className="text-white px-2 py-0.5 mb-0.5"
          style={{ backgroundColor: headerBgColor }}
        >
          <h3 className="text-sm font-semibold">
          {`Top ${slot.title}`}
        </h3>
        </div>
        <div className={`${isLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse">
              <tbody>
                {slot.data.map((item, itemIndex) => (
                  <tr
                    key={itemIndex}
                      className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                  >
                    <td className="pl-3 text-fifth">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSongClick(item.left)}
                          className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                        >
                          {item.left}
                        </button>
                        {item.artwork && (
                          <img
                            src={item.artwork}
                            alt={`${item.left} artwork`}
                            className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                            onError={(e) => {
                              console.log(`Failed to load artwork for ${item.left}:`, item.artwork);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="w-[30px] text-center font-medium text-fifth">
                      {typeof item.right === 'number' ? `${item.right}` : item.right}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile view - shown when isMobile is true or screen is smaller than md */}
      <div className={`${!isMobile ? "md:hidden" : ""}`}>
        <div className="bg-primary border border-fourth">
          <div 
            className="text-white py-0.5 flex justify-between items-center"
            style={{ backgroundColor: getHeaderBgColor(currentTitle, safeCurrentIndex) }}
          >
            <h2 className="pl-2 text-sm font-semibold">
              Top Slots
            </h2>
            
            {/* Dropdown selector for mobile */}
            {slotsWithData.length > 1 && (
              <div className="relative pr-1" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center gap-2 text-white px-2 border border-black/30 transition-colors text-sm font-semibold overflow-hidden"
                  style={{ backgroundColor: getHeaderBgColor(currentTitle, safeCurrentIndex) }}
                >
                  <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
                  <span className="relative z-10">{currentTitle}</span>
                  <ChevronDown className="w-3 h-3 relative z-10" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 bg-canvas text-fifth border border-fourth shadow-lg z-50 overflow-y-auto w-36">
                    {slotsWithData.map((slot, index) => {
                      const slotBgColor = getHeaderBgColor(slot.title, index);
                      const isSelected = index === safeCurrentIndex;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentSlideIndex(index);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 text-xs py-1 font-medium transition-colors ${
                            isSelected ? 'text-white' : 'hover:bg-tertiary/40'
                          }`}
                          style={isSelected ? { backgroundColor: slotBgColor } : {}}
                        >
                          {slot.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile content */}
          <div className={`${isLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
            <div className="overflow-y-auto max-h-72">
              <table className="w-full border-collapse">
                <tbody>
                  {currentSlide.data.map((item, itemIndex) => (
                    <tr
                      key={itemIndex}
                      className={`bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]`}
                    >
                      <td className="pl-3 text-fifth">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleSongClick(item.left)}
                            className="font-medium text-fifth hover:underline cursor-pointer leading-[0.75rem] text-left"
                          >
                            {item.left}
                          </button>
                          {item.artwork && (
                            <img
                              src={item.artwork}
                              alt={`${item.left} artwork`}
                              className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                              onError={(e) => {
                                console.log(`Failed to load artwork for ${item.left}:`, item.artwork);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="w-[30px] text-center font-medium text-fifth">
                        {typeof item.right === 'number' ? `${item.right}` : item.right}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop view - hidden when isMobile is true or screen is smaller than md */}
      <div className={`${!isMobile ? "hidden md:grid" : "hidden"} md:grid-cols-2 gap-4`}>
        {slotsWithData.map((slot, index) => (
          <div key={index}>
            {renderSlotTable(slot, index)}
          </div>
        ))}
      </div>
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={tourId}
        currentShowId=""
      />
    </>
  );
};

export default TopSlotsCarousel;