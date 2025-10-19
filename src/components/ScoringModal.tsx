import React, { useState } from 'react';
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
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 inset-y-auto top-1/4 md:inset-x-auto md:left-1/2 md:top-1/3 md:transform md:-translate-x-1/2 z-50 bg-primary rounded-lg border border-secondary shadow-xl md:w-[500px] p-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">Score Setlist Game</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>

        {scoringComplete ? (
          <div className="bg-green-500/20 text-green-700 px-4 py-3 rounded-lg mb-4 border border-green-500/30">
            Scoring completed successfully!
          </div>
        ) : scoringError ? (
          <div className="bg-red-500/20 text-red-700 px-4 py-3 rounded-lg mb-4 border border-red-500/30">
            <p className="font-semibold">Error occurred:</p>
            <p>{scoringError}</p>
          </div>
        ) : (
          <>
            <p className="text-fifth mb-4 font-light">
              Select a show to score all submissions for:
            </p>

            <div className="relative mb-4">
              <select
                value={selectedShowToScore || ''}
                onChange={(e) => setSelectedShowToScore(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-secondary rounded-md text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary appearance-none"
              >
                <option value="">Select a show...</option>
                {gameShows.map((show) => (
                  <option key={show.show_id} value={show.show_id}>
                    {show.show_date.split('-').slice(1).concat(show.show_date.substring(2, 4)).join('.')} - [{show.show_canonid}] - {show.show_subvenue}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-fifth/50" />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-1 bg-red-500 hover:bg-primary text-fifth font-medium rounded-md transition-colors border border-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleScoreSubmissions}
                disabled={!selectedShowToScore || isScoring}
                className="px-4 py-1 bg-green-500 hover:bg-primary text-fifth font-medium rounded-md transition-colors disabled:bg-green-500/50 disabled:cursor-not-allowed flex items-center gap-2 border border-secondary"
              >
                {isScoring ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-secondary/20 border-t-black animate-spin"></div>
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
    </>
  );
}
