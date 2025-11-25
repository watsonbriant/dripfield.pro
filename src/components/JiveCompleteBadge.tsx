import { useState } from 'react';
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
        <div>
            <div
                className="bg-yellow-500 text-fifth py-0.5 pr-0.5 flex justify-between items-start cursor-pointer hover:bg-yellow-600 transition-colors"
                onClick={handleClick}
            >
                <div className="flex items-center gap-2 pl-1">
                    <img
                        src="https://f4.bcbits.com/img/a2223100564_16.jpg"
                        alt="Jive Suite"
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
                            Jive Suite
                        </span>.
                    </h2>
                </div>
            </div>
        </div>
    );
}