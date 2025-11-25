import { Link } from 'react-router-dom';
import { ChevronRight, Users, ArrowLeft } from 'lucide-react';
import { GameShow } from '../../hooks/useSetlistGameShowData';
import { formatDate } from '../../utils/setlistGameUtils';

interface ShowHeaderProps {
  show: GameShow;
  totalPlayers: number;
  userSubmission: string | null;
  user: any;
  onViewSubmission: () => void;
  tours?: { tour_id: string } | null;
}

export function ShowHeader({ show, totalPlayers, userSubmission, user, onViewSubmission, tours }: ShowHeaderProps) {
  return (
    <div className="bg-primary border border-fourth">
      <div className="bg-fourth text-white px-2 py-0.5 flex justify-between items-center">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Link to="/setlistgame" className="hover:underline transition-colors flex items-center bg-canvas border border-fourth text-fifth px-2 rounded">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Echo of a Show</span>
          </Link>
          {show.show_tour && tours?.tour_id && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/setlistgame/tour/${tours.tour_id}`} className="hover:underline transition-colors bg-primary border border-fourth text-fifth px-2 rounded">
                {show.show_tour}
              </Link>
            </>
          )}
        </h2>
      </div>
      <div className="px-2 py-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-center md:text-left">
        {/* Left column: Show date, location, detail */}
        <div>
          <p className="text-fifth font-medium text-sm leading-[1.5rem]">
            {formatDate(show.show_date)}
          </p>
          <p className="text-fifth font-medium text-xs leading-[0.75rem]">
            {show.show_subvenue}
          </p>
          <p className="text-fifth font-light text-[0.625rem] leading-[0.75rem]">
            {show.show_venue_location}
          </p>
          {show.show_detail && (
            <p className="text-fourth text-[0.625rem] font-medium leading-[1.125rem]">
              {show.show_detail}
            </p>
          )}
        </div>
        
        {/* Right column: Users, game status, view results */}
        <div className="flex flex-col items-center md:items-end">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-fifth" />
            <span className="text-[0.625rem] font-light text-fifth">
              <span className="font-medium">{totalPlayers}</span> {totalPlayers === 1 ? 'user' : 'users'} playing
            </span>
          </div>
          <div className="mt-0.5">
            {show.show_scored ? (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-700 rounded text-xs border border-blue-500/30">
                Game Completed
              </span>
            ) : show.isSelectionClosed ? (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-700 rounded text-xs border border-red-500/30">
                Picks Closed
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-700 rounded text-xs border border-green-500/30">
                {show.timeRemaining} left to submit
              </span>
            )}
          </div>
          {user && userSubmission && (
            <button
              onClick={onViewSubmission}
              className="px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth font-medium rounded border border-fourth transition-colors text-xs mt-1"
            >
              {show.show_scored ? 'View My Results' : 'View My Picks'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
