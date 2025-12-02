import { HelpCircle } from 'lucide-react';

interface SetlistGameHeaderProps {
  isAdminUser: boolean;
  onShowRules: () => void;
  onShowScoring: () => void;
}

export function SetlistGameHeader({ isAdminUser, onShowRules, onShowScoring }: SetlistGameHeaderProps) {
  return (
    <div className="flex flex-row justify-between items-center mb-6 bg-tertiary border border-fourth shadow-xl">
      <h1 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5">
        Echo of a Show
      </h1>
      <div className="flex gap-3 justify-start pr-1">
        {/* How to Play Button - visible to everyone */}
        <button
          onClick={onShowRules}
          className="px-2 py-0.5 bg-canvas hover:bg-primary text-fifth font-medium rounded-lg transition-colors flex items-center gap-1 text-sm border border-fourth"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How to Play</span>
        </button>

        {/* Admin Score Button */}
        {isAdminUser && (
          <button
            onClick={onShowScoring}
            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm border border-fourth"
          >
            Score Show
          </button>
        )}
      </div>
    </div>
  );
}