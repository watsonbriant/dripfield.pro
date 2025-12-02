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
        className={!isRight ? 'text-fifth' : 'text-secondary'} 
      />
      <button
        role="switch"
        aria-checked={isRight}
        onClick={() => onToggle(!isRight)}
        className="relative inline-flex h-4 w-[47px] items-center rounded-full border border-fourth transition-colors bg-primary"
      >
        <span
          className={`absolute h-[10px] w-[10px] rounded-lg bg-black transition-transform duration-200 ${
            isRight ? 'left-[33px]' : 'left-[2px]'
          }`}
        />
      </button>
      <Columns3 
        size={16} 
        className={isRight ? 'text-fifth' : 'text-secondary'} 
      />
    </div>
  );
};

export default UserSongToggleSwitch;