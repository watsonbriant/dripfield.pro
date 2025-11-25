import { useState } from 'react';
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
        <div>
            <div
                className="bg-yellow-500 text-fifth py-0.5 pr-0.5 flex justify-between items-start cursor-pointer hover:bg-yellow-600 transition-colors"
                onClick={handleClick}
            >
                <div className="flex items-center gap-2 pl-1">
                    <img
                        src="https://f4.bcbits.com/img/a0238290447_16.jpg"
                        alt="Dripfield"
                        className="w-5 h-5 rounded object-cover"
                        onMouseEnter={() => setIsNameHovered(true)}
                        onMouseLeave={() => setIsNameHovered(false)}
                    />
                    <h2 className="text-[0.625rem] font-medium leading-[0.75rem] py-0.5">
                        This show featured a full performance of the{' '}
                        <span
                            className={`font-medium text-fifth transition-all ${isNameHovered ? 'underline' : ''}`}
                            onMouseEnter={() => setIsNameHovered(true)}
                            onMouseLeave={() => setIsNameHovered(false)}
                        >
                            Dripfield Suite
                        </span>.
                    </h2>
                </div>
            </div>
        </div>
    );
}