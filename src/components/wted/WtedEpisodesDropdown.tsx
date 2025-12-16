import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { WtedEpisode } from '../../hooks/useWtedEpisodeData';

interface WtedEpisodesDropdownProps {
  episodes: WtedEpisode[];
  currentEpisodeId?: string;
  onEpisodeSelect: (episodeId: string) => void;
}

export const WtedEpisodesDropdown: React.FC<WtedEpisodesDropdownProps> = ({
  episodes,
  currentEpisodeId,
  onEpisodeSelect
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        dropdownListRef.current &&
        !dropdownListRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const dropdownWidth = 256;
          const viewportWidth = window.innerWidth;
          
          let left = rect.left;
          if (left + dropdownWidth > viewportWidth) {
            left = Math.max(0, viewportWidth - dropdownWidth);
          }
          
          setDropdownPosition({
            top: rect.bottom + 8,
            left: left
          });
        }
      };

      updatePosition();
      
      if (dropdownListRef.current && currentEpisodeId) {
        const buttons = dropdownListRef.current.querySelectorAll('button');
        for (const button of buttons) {
          if (button.getAttribute('data-episode-id') === currentEpisodeId) {
            button.scrollIntoView({ block: 'center' });
            break;
          }
        }
      }

      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isDropdownOpen, currentEpisodeId]);

  const handleEpisodeSelect = (episodeId: string) => {
    onEpisodeSelect(episodeId);
    setIsDropdownOpen(false);
  };

  const currentEpisode = episodes.find(e => e.uuid === currentEpisodeId);
  const currentEpisodeName = currentEpisode?.episode || 'Episodes';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="md:block">
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-fourth text-white pl-2 pr-1 py-0.5 border border-fourth hover:bg-tertiary hover:text-fifth transition-colors text-sm font-semibold"
        >
          {currentEpisodeName}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div 
          ref={dropdownListRef}
          className="fixed bg-canvas border border-fourth shadow-lg z-[200] lg:z-[10000] overflow-y-auto w-64 max-h-96 space-y-0 -mt-[9px] gap-0"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {episodes.map((episode) => (
            <button
              key={episode.uuid}
              data-episode-id={episode.uuid}
              onClick={() => handleEpisodeSelect(episode.uuid)}
              className={`w-full text-left px-2 py-0.5 text-xs font-semibold hover:bg-black/10 transition-colors ${
                currentEpisodeId === episode.uuid ? 'bg-tertiary' : ''
              }`}
            >
              <div className="truncate text-fifth">
                <span className="font-medium">{episode.episode}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

