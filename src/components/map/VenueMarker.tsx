import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createNumberedIcon } from '../../utils/mapIcons';

interface MapVenue {
  venue: string;
  venue_location: string;
  venue_id: string;
  venue_latitude: string;
  venue_longitude: string;
}

interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_tour: string;
  show_canonid?: number;
}

interface VenueMarkerProps {
  venue: MapVenue;
  shows: Show[];
  selectedTour: string;
  tourVenueOrder: Record<string, number>;
  tourStartEndVenues: { start?: string; end?: string };
  onVenueClick?: (venueId: string) => void;
}

export const VenueMarker: React.FC<VenueMarkerProps> = ({
  venue,
  shows,
  selectedTour,
  tourVenueOrder,
  tourStartEndVenues,
  onVenueClick
}) => {
  // Function to format date as MM.DD.YY
  const formatDate = (dateString: string): string => {
    return dateString
      .split('-')
      .slice(1)
      .concat(dateString.substring(2, 4))
      .join('.');
  };

  // Function to get tour stop display text
  const getTourStopDisplay = (venueName: string) => {
    if (selectedTour === 'Show All' || !tourVenueOrder[venueName]) {
      return null;
    }

    const isStart = tourStartEndVenues.start === venueName;
    const isEnd = tourStartEndVenues.end === venueName;
    
    if (isStart) {
      return {
        text: '(Tour Start)',
        color: '#16a34a'
      };
    } else if (isEnd) {
      return {
        text: '(Tour End)',
        color: '#dc2626'
      };
    } else {
      return {
        text: `(Stop #${tourVenueOrder[venueName]})`,
        color: '#8e6c7a'
      };
    }
  };

  // Function to determine which icon to use for each marker
  const getMarkerIcon = (venueName: string) => {
    const hasTourOrder = tourVenueOrder[venueName];
    
    // Only show numbered icons when a specific tour is selected AND we have tour data
    if (selectedTour !== 'Show All' && tourVenueOrder[venueName]) {
      const venueNumber = tourVenueOrder[venueName];
      const isStart = tourStartEndVenues.start === venueName;
      const isEnd = tourStartEndVenues.end === venueName;
      return createNumberedIcon(venueNumber, isStart, isEnd);
    }
    
    // Always return undefined for "Show All" or when no tour data exists
    return undefined;
  };

  const customIcon = getMarkerIcon(venue.venue);
  const tourStopDisplay = getTourStopDisplay(venue.venue);
  
  // Create marker props conditionally (excluding key)
  const markerProps: any = {
    position: [parseFloat(venue.venue_latitude), parseFloat(venue.venue_longitude)]
  };
  
  // Only add icon prop if we have a custom icon
  if (customIcon) {
    markerProps.icon = customIcon;
  }

  return (
    <Marker 
      key={`${venue.venue_id}-${selectedTour}`}
      {...markerProps}
    >
      <Popup maxWidth={300}>
        <div className="text-base min-w-48 font-medium">
          <div className="block">
            <span 
              className="text-fifth text-sm font-[Rubik] font-[500] cursor-pointer hover:underline"
              onClick={() => onVenueClick && onVenueClick(venue.venue_id)}
            >
              {venue.venue}
            </span>
            {tourStopDisplay && (
              <span 
                className="ml-2 text-fifth text-sm font-[Rubik] font-[500]"
                style={{ color: tourStopDisplay.color }}
              >
                {tourStopDisplay.text}
              </span>
            )}
          </div>
          <span className="text-gray-600 text-xs font-[Rubik] font-[400] block mb-2">
            {venue.venue_location}
          </span>
          
          {/* Show listings */}
          {shows.length > 0 ? (
            <div className="mt-2">
              <div className="max-h-32 overflow-y-auto">
                {shows
                  .sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime())
                  .map((show) => (
                  <div 
                    key={show.show_id}
                    className="text-gray-700 text-xs font-[Rubik] font-[400] cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/setlist/${show.show_id}`;
                    }}
                  >
                    <span className='font-medium'>{formatDate(show.show_date)}</span> ({show.show_group})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-xs font-[Rubik] font-[400] mt-2">
              No shows recorded
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
