import React from 'react';
import { Star } from 'lucide-react';

interface StarDisplayProps {
    rating: number;
    size?: number;
    isInteractive?: boolean;
    isHovering?: boolean;
    onStarClick?: (rating: number) => void;
    onMouseEnter?: (rating: number) => void;
    onMouseLeave?: () => void;
    className?: string;
    title?: string;
}

const StarDisplay: React.FC<StarDisplayProps> = ({
    rating,
    size = 12,
    isInteractive = false,
    isHovering = false,
    onStarClick,
    onMouseEnter,
    onMouseLeave,
    className = '',
    title
}) => {
    return (
        <div
            className={`flex items-center ${className}`}
            onMouseLeave={onMouseLeave}
        >
            {[1, 2, 3, 4, 5].map((starNumber) => {
                const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

                return (
                    <div
                        key={starNumber}
                        className={`relative ${isInteractive ? 'cursor-pointer' : ''}`}
                        onMouseEnter={isInteractive ? () => onMouseEnter?.(starNumber) : undefined}
                        onClick={isInteractive ? () => onStarClick?.(starNumber) : undefined}
                        title={title}
                    >
                        {/* Background star (empty) */}
                        <Star
                            size={size}
                            className="text-fourth"
                            fill="none"
                            stroke="currentColor"
                        />

                        {/* Foreground star (filled) */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${fillPercentage * 100}%` }}
                        >
                            <Star
                                size={size}
                                className={`${isHovering
                                        ? 'text-tertiary'
                                        : 'text-fourth'
                                    }`}
                                fill="currentColor"
                                stroke="currentColor"
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StarDisplay;
