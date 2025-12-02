import React from 'react';
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
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          Make Picks
        </h2>
      </div>
      <div className="px-2 py-1 text-center">
        {show.isSelectionClosed ? (
          <>
            <p className="text-fifth text-xs font-medium mb-1">
              Picks are closed for this show.
            </p>
            <p className="text-fifth text-[0.625rem] font-light">
              Check back later to see results after the setlist has been scored.
            </p>
          </>
        ) : (
          <>
            <p className="text-fifth text-xs font-medium mb-2">
              Show is open for picks.
            </p>
            {user ? (
              <button
                onClick={onMakePicks}
                className="px-2 py-0.5 bg-tertiary hover:bg-tertiary/40 text-fifth font-medium rounded border border-fourth transition-colors text-xs"
              >
                {userSubmission ? 'Edit Picks' : 'Make Picks'}
              </button>
            ) : (
              <Link
                to="/login"
                className="px-2 py-0.5 bg-tertiary/50 hover:bg-tertiary/60 text-fifth font-medium rounded border border-fourth/60 transition-colors inline-block text-xs"
              >
                Login to Play
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
