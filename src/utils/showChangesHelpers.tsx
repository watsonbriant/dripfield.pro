import React from 'react';
import { MoveVertical, RefreshCw, Plus, ArrowDownUp, MoveRight, Minus, SquareCheckBig } from 'lucide-react';
import { ShowChange } from '../types/showChanges';

export const getChangeIcon = (changeType: string) => {
    const strokeWidth = 2.5;
    
    switch (changeType) {
        case 'move':
            return { icon: <MoveVertical className="w-3 h-3 text-yellow-600" strokeWidth={strokeWidth} /> };
        case 'replace':
            return { icon: <RefreshCw className="w-3 h-3 text-orange-600" strokeWidth={strokeWidth} /> };
        case 'add':
            return { icon: <Plus className="w-3 h-3 text-green-600" strokeWidth={strokeWidth} /> };
        case 'swap':
            return { icon: <ArrowDownUp className="w-3 h-3 text-yellow-600" strokeWidth={strokeWidth} /> };
        case 'cut':
            return { icon: <Minus className="w-3 h-3 text-red-600" strokeWidth={strokeWidth} /> };
        case 'pick':
            return { icon: <SquareCheckBig className="w-3 h-3 text-green-600" strokeWidth={strokeWidth} /> };
        default:
            return { icon: null };
    }
};

// Helper function to render change text with arrow replacement
export const renderChangeText = (changeHtml: string) => {
    // First, we need to parse the HTML string to handle any existing HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = changeHtml;
    const textContent = tempDiv.innerHTML;
    
    // Split by arrow and reconstruct with React components
    if (textContent.includes('→')) {
        const parts = textContent.split('→');
        return (
            <>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span dangerouslySetInnerHTML={{ __html: part.trim() }} />
                        {index < parts.length - 1 && (
                            <MoveRight className="inline-block mx-1 text-red-600" size={11} />
                        )}
                    </React.Fragment>
                ))}
            </>
        );
    }
    
    // If no arrows, return the original HTML
    return <span dangerouslySetInnerHTML={{ __html: changeHtml }} />;
};
