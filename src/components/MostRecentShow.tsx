import React from 'react';
import { Link } from 'react-router-dom';
import { Show, SetlistEntry } from '../types/home';
import SetlistDisplay from './SetlistDisplay';
import gooseGif from '../img/Goose.png';

interface MostRecentShowProps {
  mostRecentShow: Show | null;
  setlist: SetlistEntry[];
  loadingMostRecent: boolean;
  loadingSetlist: boolean;
}

export const MostRecentShow: React.FC<MostRecentShowProps> = ({
  mostRecentShow,
  setlist,
  loadingMostRecent,
  loadingSetlist
}) => {
  if (loadingMostRecent) {
    return (
      <div className="bg-primary pb-1">
        <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Most Recent Show</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-fifth/70">Loading show...</p>
        </div>
      </div>
    );
  }

  if (!mostRecentShow) {
    return (
      <div className="bg-primary pb-1">
        <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Most Recent Show</h3>
        </div>
        <div className="text-center py-12">
          <p className="text-fifth/70">No recent shows found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary pb-1">
      <div className="bg-tertiary text-fifth px-2 py-0.5 mb-0.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Most Recent Show</h3>
        {mostRecentShow.show_group === 'Goose' && (
          <div className="flex-shrink-0">
            <img
              src={gooseGif}
              alt="Goose"
              className="h-4 filter"
            />
          </div>
        )}
      </div>
      <div>
        <div className="mb-1 mt-1 ml-2 text-xs leading-[0.875rem] text-fifth font-medium">
          <div>
            <Link
              to={`/setlist/${mostRecentShow.show_id}`}
              className="transition-colors table-link"
            >
              {mostRecentShow.show_date
                .split('-')
                .slice(1)
                .concat(mostRecentShow.show_date.substring(2, 4))
                .join('.')}
            </Link>
            {" — "}
            {mostRecentShow.venue_id ? (
              <Link
                to={`/venue/${mostRecentShow.venue_id}`}
                className="transition-colors table-link"
              >
                {mostRecentShow.venue_location}
              </Link>
            ) : mostRecentShow.subvenue_venue ? (
              <Link
                to={`/venue/${encodeURIComponent(mostRecentShow.subvenue_venue)}`}
              className="transition-colors table-link"
            >
              {mostRecentShow.venue_location}
              </Link>
            ) : (
              <span>{mostRecentShow.venue_location}</span>
            )}
            <br />
            <span className="font-medium">{mostRecentShow.show_group}</span>
          </div>
        </div>

        {loadingSetlist ? (
          <div className="text-center py-4">
            <p className="text-fifth/70">Loading setlist...</p>
          </div>
        ) : setlist.length > 0 ? (
          <SetlistDisplay setlist={setlist} />
        ) : (
          <div>
            <p className="text-fifth text-[0.625rem] ml-2">Setlist not available.</p>
          </div>
        )}
      </div>
    </div>
  );
};
