import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Show, SetlistEntry } from '../types/home';
import SetlistDisplay from './SetlistDisplay';
import gooseGif from '../img/Goose.gif';

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
  const navigate = useNavigate();

  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.subvenue_venue) {
      navigate(`/venue/${encodeURIComponent(show.subvenue_venue)}`);
    }
  };

  if (loadingMostRecent) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary">Most Recent Show</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-fifth/70">Loading show...</p>
        </div>
      </div>
    );
  }

  if (!mostRecentShow) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary">Most Recent Show</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-fifth/70">No recent shows found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary">Most Recent Show</h2>
        {mostRecentShow.show_group === 'Goose' && (
          <div className="flex-shrink-0">
            <img
              src={gooseGif}
              alt="Goose"
              className="h-6 w-6 filter drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
              }}
            />
          </div>
        )}
      </div>
      <div>
        <div className="mb-2 text-lg text-fifth font-medium">
          <div className="text-base">
            <button
              onClick={() => navigate(`/setlist/${mostRecentShow.show_id}`)}
              className="transition-colors table-link"
            >
              {mostRecentShow.formatted_show_date}
            </button>
            {" — "}
            <button
              onClick={() => navigateToVenue(mostRecentShow)}
              className="transition-colors table-link"
            >
              {mostRecentShow.venue_location}
            </button>
            <br />
            <span className="font-semibold">{mostRecentShow.show_group}</span>
          </div>
        </div>

        {loadingSetlist ? (
          <div className="text-center py-4">
            <p className="text-fifth/70">Loading setlist...</p>
          </div>
        ) : setlist.length > 0 ? (
          <SetlistDisplay setlist={setlist} navigate={navigate} />
        ) : (
          <div>
            <p className="text-fifth text-sm">Setlist not available.</p>
          </div>
        )}
      </div>
    </div>
  );
};
