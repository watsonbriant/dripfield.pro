import React from 'react';

interface JOTYBadgeProps {
  round: string;
  compact?: boolean;
  onClick?: () => void;
}

export default function JOTYBadge({ round, compact = false, onClick }: JOTYBadgeProps) {
  const getBadgeStyles = () => {
    const baseStyles = `inline-flex items-center justify-center font-medium text-xs rounded-full ${
      compact ? 'w-9 h-5 text-[10px]' : 'w-12 h-7 text-[11px]'
    } shadow-sm ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`;

    switch (round) {
      case 'JOTY':
        return `${baseStyles} bg-gradient-to-br from-[#FFD700] to-[#FFC700] text-gray-800`;
      case '2nd':
        return `${baseStyles} bg-gradient-to-br from-[#6B7280] to-[#6B7280] text-primary`;
      case 'F4':
        return `${baseStyles} bg-gradient-to-br from-[#CD7F32] to-[#CD7F32] text-primary`;
      case 'E8':
        return `${baseStyles} bg-[#8B5CF6] text-primary`;
      case 'S16':
        return `${baseStyles} bg-[#3B82F6] text-primary`;
      case 'R32':
        return `${baseStyles} bg-[#10B981] text-primary`;
      case 'R64':
        return `${baseStyles} bg-gray-300 text-gray-800`;
      default:
        return `${baseStyles} bg-gray-400 text-primary`;
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