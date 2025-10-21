import React from 'react';
import { List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GameShow } from '../../hooks/useSetlistGameShowData';

interface PicksSectionProps {
  show: GameShow;
  user: any;
  userSubmission: string | null;
  onMakePicks: () => void;
}

export function PicksSection({ show, user, userSubmission, onMakePicks }: PicksSectionProps) {
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 text-center">
      <div className="flex items-center justify-center mb-2">
        <List className="w-8 h-8 text-[#a9682e]" />
      </div>

      {show.isSelectionClosed ? (
        <>
          <h2 className="text-base font-medium text-fifth mb-1">
            Picks are closed for this show.
          </h2>
          <p className="text-fifth text-xs font-light max-w-lg mx-auto">
            Check back later to see results after the setlist has been scored.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-base font-medium text-fifth mb-2">
            Show is open for picks.
          </h2>
          {user ? (
            <button
              onClick={onMakePicks}
              className="px-4 py-1 bg-tertiary hover:bg-tertiary/40 text-fifth font-medium rounded-md transition-colors border border-secondary"
            >
              {userSubmission ? 'Edit Picks' : 'Make Picks'}
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-tertiary/50 hover:bg-tertiary/60 text-fifth font-medium rounded-md transition-colors inline-block border border-secondary/60"
            >
              Login to Play
            </Link>
          )}
        </>
      )}
    </div>
  );
}
