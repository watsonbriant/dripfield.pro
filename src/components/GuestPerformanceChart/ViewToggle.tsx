import React from 'react';
import { ViewMode } from './types';

interface ViewToggleProps {
  viewMode: ViewMode;
  onToggle: () => void;
}

export default function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-3">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`lucide lucide-columns-3 ${viewMode === 'timeline' ? 'text-fifth' : 'text-secondary'}`}
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
        
        <button
          role="switch"
          aria-checked={viewMode === 'table'}
          onClick={onToggle}
          className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary bg-canvas border border-secondary"
        >
          <span
            className={`absolute h-4 w-4 rounded-full bg-tertiary transition-transform duration-200 ${
              viewMode === 'table' ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`lucide lucide-rows-3 ${viewMode === 'table' ? 'text-fifth' : 'text-secondary'}`}
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
        </svg>
      </div>
    </div>
  );
}
