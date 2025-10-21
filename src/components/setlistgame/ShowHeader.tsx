import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { GameShow } from '../../hooks/useSetlistGameShowData';
import { formatDate } from '../../utils/setlistGameUtils';

interface ShowHeaderProps {
  show: GameShow;
  totalPlayers: number;
  userSubmission: string | null;
  user: any;
  onViewSubmission: () => void;
}

export function ShowHeader({ show, totalPlayers, userSubmission, user, onViewSubmission }: ShowHeaderProps) {
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <div className="flex flex-col items-center text-center md:flex-row md:justify-between md:items-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
            {formatDate(show.show_date)}
          </h2>
          <h2 className="text-sm font-medium text-fifth/90">
            {show.show_subvenue}
          </h2>
          <p className="text-fifth font-light text-xs mb-0.5">
            {show.show_venue_location}<br />
          </p>
          <p className="text-fourth text-xs font-medium">
            {show.show_detail && show.show_detail}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end">
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-3 font-light">
            {show.show_scored ? (
              <div className="px-3 py-1.5 bg-blue-500/20 text-blue-700 rounded-md text-sm inline-block border border-blue-500/30">
                Game Completed
              </div>
            ) : show.isSelectionClosed ? (
              <div className="px-3 py-1.5 bg-red-500/20 text-red-700 rounded-md text-sm inline-block border border-red-500/30">
                Picks Closed
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-green-500/20 text-green-700 rounded-md text-sm inline-block border border-green-500/30">
                {show.timeRemaining} left to submit
              </div>
            )}

            {user && userSubmission && (
              <button
                onClick={onViewSubmission}
                className="px-3 py-1.5 bg-tertiary hover:bg-tertiary/40 text-fifth font-medium rounded-md transition-colors text-sm border border-secondary"
              >
                {show.show_scored ? 'View My Results' : 'View My Picks'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center sm:flex-row sm:justify-between gap-3 pt-3 border-t border-secondary">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fifth/60" />
          <span className="text-sm font-light text-fifth/90">
            <span className="font-medium text-fifth">{totalPlayers}</span> {totalPlayers === 1 ? 'user' : 'users'} playing
          </span>
        </div>

        {show.show_tour && (
          <div className="px-3 py-1 bg-secondary text-fifth font-semibold rounded-md text-sm border border-secondary">
            {show.show_tour}
          </div>
        )}
      </div>
    </div>
  );
}
