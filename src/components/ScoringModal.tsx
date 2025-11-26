import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useSetlistScoring } from '../hooks/useSetlistScoring';
import { GameShow } from '../hooks/useGameShows';

interface ScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameShows: GameShow[];
  onScoringComplete: () => void;
}

export function ScoringModal({ isOpen, onClose, gameShows, onScoringComplete }: ScoringModalProps) {
  const [selectedShowToScore, setSelectedShowToScore] = useState<string | null>(null);
  const { isScoring, scoringComplete, scoringError, scoreSubmissions } = useSetlistScoring();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleScoreSubmissions = async () => {
    if (!selectedShowToScore) return;
    
    await scoreSubmissions(selectedShowToScore, () => {
      onScoringComplete();
      onClose();
      setSelectedShowToScore(null);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Custom Modal - centered in viewport */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex items-center justify-between px-0.5 py-0.5 bg-tertiary text-fifth">
          <h3 className="text-sm font-semibold ml-1.5 mr-4">Score Setlist Game</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-fifth" />
          </button>
        </div>

        <div className="p-2">
          {scoringComplete ? (
            <div className="bg-green-500/20 text-green-700 px-2 py-1 rounded-lg mb-2 border border-green-500/30 text-xs">
              Scoring completed successfully!
            </div>
          ) : scoringError ? (
            <div className="bg-red-500/20 text-red-700 px-2 py-1 rounded-lg mb-2 border border-red-500/30 text-xs">
              <p className="font-semibold">Error occurred:</p>
              <p>{scoringError}</p>
            </div>
          ) : (
            <>
              <p className="text-fifth mb-2 font-light text-xs">
                Select a show to score all submissions for:
              </p>

              <div className="relative mb-2">
                <select
                  value={selectedShowToScore || ''}
                  onChange={(e) => setSelectedShowToScore(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-fourth rounded-md text-fifth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none"
                >
                  <option value="">Select a show...</option>
                  {gameShows.map((show) => (
                    <option key={show.show_id} value={show.show_id}>
                      {show.show_date.split('-').slice(1).concat(show.show_date.substring(2, 4)).join('.')} - [{show.show_canonid}] - {show.show_subvenue}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-fifth/50" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-2 py-0.5 bg-red-500 hover:bg-primary text-fifth font-medium rounded-md transition-colors border border-fourth text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmissions}
                  disabled={!selectedShowToScore || isScoring}
                  className="px-2 py-0.5 bg-green-500 hover:bg-primary text-fifth font-medium rounded-md transition-colors disabled:bg-green-500/50 disabled:cursor-not-allowed flex items-center gap-2 border border-fourth text-xs"
                >
                  {isScoring ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-2 border-fourth/20 border-t-black animate-spin"></div>
                      <span>Scoring...</span>
                    </>
                  ) : (
                    <span>Score Submissions</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
