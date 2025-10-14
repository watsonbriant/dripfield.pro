import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DripfieldCompleteBadgeProps {
    showDripfieldComplete: boolean;
}

export function DripfieldCompleteBadge({ showDripfieldComplete }: DripfieldCompleteBadgeProps) {
    const navigate = useNavigate();
    const [isNameHovered, setIsNameHovered] = useState(false);

    if (!showDripfieldComplete) {
        return null;
    }

    const handleClick = () => {
        navigate('/lists/6b47d70f-202b-45fe-a5b1-203c031c6aad'); // Replace with actual list ID
    };

    return (
        <div
            className="bg-yellow-500 border border-secondary rounded-lg p-3 cursor-pointer hover:bg-yellow-400 transition-colors"
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <img
                    src="https://f4.bcbits.com/img/a0238290447_16.jpg" // Replace with actual image URL
                    alt="Dripfield"
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
                        Dripfield Suite
                    </span>.
                </div>
            </div>
        </div>
    );
}