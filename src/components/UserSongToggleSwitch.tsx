import React from 'react';
import { LayoutList, Columns3 } from 'lucide-react';

interface UserSongToggleSwitchProps {
  isRight: boolean;
  onToggle: (isRight: boolean) => void;
  className?: string;
}

const UserSongToggleSwitch: React.FC<UserSongToggleSwitchProps> = ({
  isRight,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LayoutList 
        size={16} 
        className={`${!isRight ? 'text-black' : 'text-[#756d61]'}`} 
      />
      <button
        role="switch"
        aria-checked={isRight}
        onClick={() => onToggle(!isRight)}
        className="relative inline-flex h-6 w-12 items-center rounded-full border border-black transition-colors bg-[#f9ae37]"
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-black transition-transform duration-200 ${
            isRight ? 'left-7' : 'left-1'
          }`}
        />
      </button>
      <Columns3 
        size={16} 
        className={`${isRight ? 'text-black' : 'text-[#756d61]'}`} 
      />
    </div>
  );
};

export default UserSongToggleSwitch;