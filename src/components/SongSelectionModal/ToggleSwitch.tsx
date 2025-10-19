import React from 'react';

interface ToggleSwitchProps {
  showActualSetlist: boolean;
  setShowActualSetlist: (show: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  showActualSetlist,
  setShowActualSetlist
}) => {
  return (
    <div className="flex items-center justify-center my-3">
      <div className="inline-flex border border-secondary rounded-lg overflow-hidden">
        <span 
          className={`px-4 py-1.5 transition-colors font-semibold hover:bg-tertiary/40 text-base ${!showActualSetlist ? 'bg-tertiary text-fifth' : 'bg-canvas text-fifth'}`}
          onClick={() => setShowActualSetlist(false)}
        >
          My Picks
        </span>
        <span 
          className={`px-4 py-1.5 transition-colors font-semibold hover:bg-tertiary/40 text-base ${showActualSetlist ? 'bg-tertiary text-fifth' : 'bg-canvas text-fifth'}`}
          onClick={() => setShowActualSetlist(true)}
        >
          Actual Setlist
        </span>
      </div>
    </div>
  );
};
