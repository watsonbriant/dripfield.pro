import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JiveCompleteBadgeProps {
    showJiveComplete: boolean;
}

export function JiveCompleteBadge({ showJiveComplete }: JiveCompleteBadgeProps) {
    const navigate = useNavigate();
    const [isNameHovered, setIsNameHovered] = useState(false);

    if (!showJiveComplete) {
        return null;
    }

    const handleClick = () => {
        navigate('/lists/c66cfb55-12a8-4cfe-9147-547d9e6c1736');
    };

    return (
        <div
            className="bg-yellow-500 border border-secondary rounded-lg p-3 cursor-pointer hover:bg-yellow-400 transition-colors"
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <img
                    src="https://f4.bcbits.com/img/a2223100564_16.jpg"
                    alt="Jive Suite"
                    className="w-8 h-8 rounded object-cover"
                    onMouseEnter={() => setIsNameHovered(true)}
                    onMouseLeave={() => setIsNameHovered(false)}
                />
                <div className="text-[1rem] leading-[1rem] font-light text-fifth">
                    This show featured a full performance of the{' '}
                    <span
                        className={`text-[1rem] leading-[1rem] font-medium text-fifth transition-all ${isNameHovered ? 'underline' : ''}`}
                        onMouseEnter={() => setIsNameHovered(true)}
                        onMouseLeave={() => setIsNameHovered(false)}
                    >
                        Jive Suite
                    </span>.
                </div>
            </div>
        </div>
    );
}