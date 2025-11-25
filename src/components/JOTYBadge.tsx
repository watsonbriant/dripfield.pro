import React from 'react';

interface JOTYBadgeProps {
  round: string;
  compact?: boolean;
  onClick?: () => void;
}

export default function JOTYBadge({ round, compact = false, onClick }: JOTYBadgeProps) {
  const getBadgeStyles = () => {
    const baseStyles = `inline-flex items-center justify-center font-medium rounded-full ${
      compact ? 'w-8 h-4 text-[10px]' : 'w-12 h-7 text-[11px]'
    } shadow-sm ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`;

    switch (round) {
      case 'JOTY':
        return `${baseStyles} bg-gradient-to-br from-[#FFD700] to-[#FFC700] text-fifth`;
      case '2nd':
        return `${baseStyles} bg-gradient-to-br from-[#6B7280] to-[#6B7280] text-white`;
      case 'F4':
        return `${baseStyles} bg-gradient-to-br from-[#CD7F32] to-[#CD7F32] text-white`;
      case 'E8':
        return `${baseStyles} bg-[#8B5CF6] text-white`;
      case 'S16':
        return `${baseStyles} bg-[#3B82F6] text-white`;
      case 'R32':
        return `${baseStyles} bg-[#10B981] text-white`;
      case 'R64':
        return `${baseStyles} bg-gray-300 text-gray-800`;
      default:
        return `${baseStyles} bg-gray-400 text-white`;
    }
  };

  return (
    <span 
      className={getBadgeStyles()}
      onClick={onClick ? (e) => {
        e.stopPropagation();
        onClick();
      } : undefined}
    >
      {round}
    </span>
  );
}