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
    <div className={`flex items-center gap-3 ${className} bg-tertiary px-1.5 py-1 rounded-lg border border-secondary`}>
      <LayoutList 
        size={16} 
        className={`${!isRight ? 'text-fifth' : 'text-fifth'}`} 
      />
      <button
        role="switch"
        aria-checked={isRight}
        onClick={() => onToggle(!isRight)}
        className="relative inline-flex h-6 w-[3.125rem] items-center rounded-full border border-fourth transition-colors bg-primary"
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-fourth transition-transform duration-200 ${
            isRight ? 'left-7' : 'left-1'
          }`}
        />
      </button>
      <Columns3 
        size={16} 
        className={`${isRight ? 'text-fifth' : 'text-fifth'}`} 
      />
    </div>
  );
};

export default UserSongToggleSwitch;