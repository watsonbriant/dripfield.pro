import React from 'react';
import { HelpCircle } from 'lucide-react';

interface SetlistGameHeaderProps {
  isAdminUser: boolean;
  onShowRules: () => void;
  onShowScoring: () => void;
}

export function SetlistGameHeader({ isAdminUser, onShowRules, onShowScoring }: SetlistGameHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
      <div className="flex flex-col items-center lg:flex-row lg:items-center lg:space-x-2 mb-4 lg:mb-0">
        <div className="flex items-center space-x-2 mb-1 lg:mb-0">
          <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">Echo of a Show</h1>
          <div className="hidden lg:block bg-secondary text-fifth text-xs font-medium px-2 py-1 rounded-lg border border-secondary">
            A Setlist Game for Goose the Band
          </div>
        </div>
        {/* Mobile version - show below the main heading */}
        <div className="lg:hidden">
          <div className="bg-secondary text-fifth text-xs font-medium px-2 py-1 rounded-lg border border-secondary inline-block">
            A Setlist Game for Goose the Band
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center lg:justify-start">
        {/* How to Play Button - visible to everyone */}
        <button
          onClick={onShowRules}
          className="px-3 py-1.5 bg-tertiary hover:bg-primary text-fifth font-medium rounded-lg transition-colors flex items-center gap-1 text-sm border border-secondary"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How to Play</span>
        </button>

        {/* Admin Score Button */}
        {isAdminUser && (
          <button
            onClick={onShowScoring}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-primary font-medium rounded-lg transition-colors text-sm border border-secondary"
          >
            Score Show
          </button>
        )}
      </div>
    </div>
  );
}