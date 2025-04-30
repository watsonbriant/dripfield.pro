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
    <div className={`flex items-center gap-1 ${className}`}>
      <LayoutList 
        size={16} 
        className={`${!isRight ? 'text-[#ffffff]' : 'text-[#fce7ca]'} mr-1`} 
      />
      <button
        role="switch"
        aria-checked={isRight}
        onClick={() => onToggle(!isRight)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec742e]/50 ${
          isRight ? 'bg-[#fce7ca]' : 'bg-[#fce7ca]'
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-[#172330] transition-transform duration-200 ${
            isRight ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <Columns3 
        size={16} 
        className={`${isRight ? 'text-[#ffffff]' : 'text-[#fce7ca]'} ml-1`} 
      />
    </div>
  );
};

export default UserSongToggleSwitch;