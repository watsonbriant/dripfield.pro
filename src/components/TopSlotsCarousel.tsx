import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import SongTourPerformancesModal from './SongTourPerformancesModal';

interface SlotItem {
  left: string;
  right: string | number;
  artwork?: string; // Added artwork property
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
      'Show Openers': '#006400',
      'Set Openers': '#019B7A',  
      'Set Closers': '#E17401', 
      'Encores': '#7C2128',    
      // Fallback colors based on index if title doesn't match
      '0': '#006400',
      '1': '#019B7A',
      '2': '#E17401',
      '3': '#7C2128'    
    };
    
    // Return the color based on title, or fallback to index-based color
    return colorMap[title] || colorMap[index.toString()] || '#f9ae37'; // Default amber
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
      <div className="bg-primary border border-black rounded-lg p-3">
        <h2 
          className="text-lg font-mohr text-white inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1.5"
          style={{ backgroundColor: headerBgColor }}
        >
          {`Top ${slot.title}`}
        </h2>
        <div className={`${isLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-white/5">
                {slot.data.map((item, itemIndex) => (
                  <tr
                    key={itemIndex}
                    className={`${itemIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-black/10 transition-colors text-xs`}
                  >
                    <td className="pl-4 text-black">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-black cursor-pointer hover:text-[#a9682e] hover:underline font-semibold"
                          onClick={() => handleSongClick(item.left)}
                        >
                          {item.left}
                        </span>
                        {item.artwork && (
                          <img
                            src={item.artwork}
                            alt={`${item.left} artwork`}
                            className="w-5 h-5 rounded-full object-cover border border-black/20 ml-3"
                            onError={(e) => {
                              // Hide the image if it fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="pr-2 w-[40px] py-0.5 text-center font-semibold text-black">
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
        <div className="bg-primary border border-black rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5">
            <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
              Top Slots
            </h2>
            
            {/* Dropdown selector for mobile */}
            {slotsWithData.length > 1 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-white px-4 pt-2 pb-1.5 rounded-lg border border-black hover:opacity-90 transition-colors text-base font-mohr"
                  style={{ backgroundColor: getHeaderBgColor(currentTitle, safeCurrentIndex) }}
                >
                  {currentTitle}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 overflow-y-auto w-48">
                    {slotsWithData.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentSlideIndex(index);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-1 text-sm font-semibold hover:bg-black/10 transition-colors ${
                          index === safeCurrentIndex ? 'bg-[#f9ae37]' : ''
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
          <div className={`${isLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
            <div className="overflow-y-auto max-h-72">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-white/5">
                  {currentSlide.data.map((item, itemIndex) => (
                    <tr
                      key={itemIndex}
                      className={`${itemIndex % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-black/10 transition-colors text-xs`}
                    >
                      <td className="pl-4 text-black">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-black cursor-pointer hover:text-[#a9682e] hover:underline font-semibold"
                            onClick={() => handleSongClick(item.left)}
                          >
                            {item.left}
                          </span>
                          {item.artwork && (
                            <img
                              src={item.artwork}
                              alt={`${item.left} artwork`}
                              className="w-5 h-5 rounded-full object-cover border border-black/20 ml-3"
                              onError={(e) => {
                                // Hide the image if it fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="pr-2 w-[40px] py-0.5 text-center font-semibold text-black">
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