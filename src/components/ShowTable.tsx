import React from 'react';
import { Link } from 'react-router-dom';
import { GameShow } from '../hooks/useGameShows';

interface ShowTableProps {
  gameShows: GameShow[];
  user: any;
  onSelectSongs: (show: GameShow) => void;
  onViewSubmission: (show: GameShow) => void;
}

export function ShowTable({ gameShows, user, onSelectSongs, onViewSubmission }: ShowTableProps) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  if (gameShows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-fifth">No active games found in this league.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr className="bg-canvas border-y border-secondary/10">
            <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap">Date</th>
            <th className="px-4 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap">Venue</th>
            <th className="px-4 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap">Location</th>
            <th className="px-4 py-1 text-left text-s font-semibold text-fifth whitespace-nowrap">Detail</th>
            <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap">Status</th>
            <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap">Players</th>
            {user && (
              <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap">Score</th>
            )}
            <th className="px-4 py-1 text-center text-s font-semibold text-fifth whitespace-nowrap">Picks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {gameShows.map((show) => {
            // Sort shows to determine the next upcoming show
            const sortedShows = [...gameShows].sort((a, b) => {
              const dateA = new Date(a.show_date);
              const dateB = new Date(b.show_date);
              if (dateA < dateB) return -1;
              if (dateA > dateB) return 1;

              const timeA = new Date(a.show_time);
              const timeB = new Date(b.show_time);
              return timeA - timeB;
            });

            // Find the next upcoming show that hasn't been closed yet
            const nextUpcomingShow = sortedShows.find(s => !s.isSelectionClosed && !s.show_scored);

            // Determine background color based on show status
            let bgColor;
            if (show.show_scored) {
              bgColor = 'bg-canvas';
            } else if (nextUpcomingShow && show.show_id === nextUpcomingShow.show_id) {
              bgColor = 'bg-primary';
            } else {
              bgColor = 'bg-canvas';
            }

            return (
              <tr
                key={show.show_id}
                className={`${bgColor} hover:bg-tertiary/40 transition-colors text-xs`}
              >
                <td className="px-4 py-0.5 text-fifth whitespace-nowrap text-center">
                  <span className="font-medium">
                    {user ? (
                      <Link
                        to={`/setlistgame/${show.show_id}`}
                        className="hover:underline transition-colors table-link"
                      >
                        {show.show_date
                          .split('-')
                          .slice(1)
                          .concat(show.show_date.substring(2, 4))
                          .join('.')}
                      </Link>
                    ) : (
                      <span className="cursor-default">
                        {show.show_date
                          .split('-')
                          .slice(1)
                          .concat(show.show_date.substring(2, 4))
                          .join('.')}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-0.5 text-fifth font-light whitespace-nowrap">
                  {show.show_subvenue}
                </td>
                <td className="px-4 py-0.5 text-fifth/70 font-light whitespace-nowrap">
                  {show.show_venue_location}
                </td>
                <td className="px-4 py-0.5 text-fifth font-light whitespace-nowrap">
                  {show.show_detail || ''}
                </td>
                <td className="px-4 py-0.5 whitespace-nowrap font-light text-center">
                  {show.show_scored ? (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-700 rounded-md text-xs border border-blue-500/30">
                      Scored
                    </span>
                  ) : show.isSelectionClosed ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-700 rounded-md text-xs border border-red-500/30">
                      Closed
                    </span>
                  ) : show.isLessThan24Hours ? (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-700 rounded-md text-xs border border-yellow-500/30">
                      {show.timeRemaining} left
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-500/20 text-green-700 rounded-md text-xs border border-green-500/30">
                      {show.timeRemaining} left
                    </span>
                  )}
                </td>
                <td className="px-4 py-0.5 font-light text-center">
                  <span className="text-fifth/70 text-xs">
                    {show.playerCount !== undefined ? show.playerCount : '-'}
                  </span>
                </td>
                {user && (
                  <td className="px-4 py-0.5 text-center">
                    {user && show.score !== undefined && show.show_scored ? (
                      <span className="text-fourth font-medium">
                        {show.score}
                      </span>
                    ) : (
                      <span className="text-gray-500"></span>
                    )}
                  </td>
                )}
                <td className="px-4 py-0.5 text-center">
                  {show.show_scored ? (
                    user && show.submission_id ? (
                      <button
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-600/70 text-primary text-xs font-medium rounded transition-colors inline-block border border-blue-800"
                        onClick={() => onViewSubmission(show)}
                      >
                        View Results
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-500 text-xs font-medium rounded inline-block border border-gray-300">
                        Scored
                      </span>
                    )
                  ) : show.isSelectionClosed ? (
                    user && show.submission_id ? (
                      <button
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-primary text-xs font-medium rounded transition-colors inline-block border border-gray-800"
                        onClick={() => onViewSubmission(show)}
                      >
                        View Picks
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 bg-gray-300 text-gray-500 text-xs font-medium rounded cursor-not-allowed inline-block border border-gray-300"
                        disabled
                      >
                        Closed
                      </button>
                    )
                  ) : (
                    user ? (
                      <button
                        className="px-3 py-1 bg-tertiary hover:bg-tertiary/70 text-fifth text-xs font-medium rounded transition-colors inline-block border border-secondary"
                        onClick={() => onSelectSongs(show)}
                      >
                        {show.submission_id ? 'Edit Picks' : 'Make Picks'}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="px-3 py-1 bg-tertiary hover:bg-tertiary/70 text-fifth text-xs font-medium rounded transition-colors inline-block border border-secondary/30"
                      >
                        Login to Play
                      </Link>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}