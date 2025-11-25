import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { FilterModal } from './FilterModal';
import { MapCenterUpdater } from './map/MapCenterUpdater';
import { MobileHeader } from './map/MobileHeader';
import { DesktopHeader } from './map/DesktopHeader';
import { VenueMarker } from './map/VenueMarker';
import { useVenueMapData } from '../hooks/useVenueMapData';
import { useVenueMapFilters } from '../hooks/useVenueMapFilters';
import 'leaflet/dist/leaflet.css';

interface VenueMapProps {
  onVenueClick?: (venueId: string) => void;
}

export const VenueMap: React.FC<VenueMapProps> = ({ onVenueClick }) => {
  const [mapVenues, setMapVenues] = React.useState<any[]>([]);
  const [venueShows, setVenueShows] = React.useState<Record<string, any[]>>({});
  
  const {
    allVenues,
    allShows,
    groups,
    tours,
    loading
  } = useVenueMapData();

  const {
    selectedGroup,
    selectedTour,
    tourPath,
    tourVenueOrder,
    tourStartEndVenues,
    isFilterModalOpen,
    hasActiveFilters,
    isGroupDropdownDisabled,
    setIsFilterModalOpen,
    handleTourChange,
    handleGroupChange,
    handleClearFilters
  } = useVenueMapFilters(allVenues, allShows, setMapVenues, setVenueShows);

  // Initialize mapVenues and venueShows when data loads
  React.useEffect(() => {
    if (allVenues.length > 0 && Object.keys(allShows).length > 0) {
      setMapVenues(allVenues);
      setVenueShows(allShows);
    }
  }, [allVenues, allShows]);

  if (loading) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-4 text-center">
        <p className="text-fifth">Loading map...</p>
      </div>
    );
  }

  if (allVenues.length === 0) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-4 text-center">
        <p className="text-fifth">No venues with location data available for mapping.</p>
      </div>
    );
  }

  // Calculate center point based on current filtered venue locations
  const centerLat = mapVenues.length > 0 
    ? mapVenues.reduce((sum, venue) => sum + parseFloat(venue.venue_latitude), 0) / mapVenues.length
    : 39.8283; // Default to US center
  const centerLng = mapVenues.length > 0 
    ? mapVenues.reduce((sum, venue) => sum + parseFloat(venue.venue_longitude), 0) / mapVenues.length
    : -98.5795; // Default to US center

  return (
    <div className="bg-primary border border-fourth p-2 mb-4">
      <MobileHeader
        venueCount={mapVenues.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
      />

      <DesktopHeader
        venueCount={mapVenues.length}
        hasActiveFilters={hasActiveFilters}
        selectedTour={selectedTour}
        selectedGroup={selectedGroup}
        tours={tours}
        groups={groups}
        isGroupDropdownDisabled={isGroupDropdownDisabled}
        onClearFilters={handleClearFilters}
        onTourChange={handleTourChange}
        onGroupChange={handleGroupChange}
      />
      
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        groups={groups}
        tours={tours}
        selectedGroup={selectedGroup}
        selectedTour={selectedTour}
        onGroupChange={handleGroupChange}
        onTourChange={handleTourChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <style>
        {`
          .numbered-marker {
            background: transparent !important;
            border: none !important;
          }
        `}
      </style>
      
      <MapContainer 
        center={[centerLat, centerLng]}
        zoom={3} 
        style={{ width: '100%' }}
        className="rounded-lg h-[400px] xl:h-[750px]"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=''
        />
        
        <MapCenterUpdater center={[centerLat, centerLng]} venues={mapVenues} />
        
        {tourPath.length > 1 && (
          <Polyline
            positions={tourPath}
            pathOptions={{
              color: '#ff6b35',
              weight: 3,
              opacity: 0.8,
              dashArray: '10, 5'
            }}
          />
        )}
        
        {mapVenues.map((venue) => (
          <VenueMarker
            key={`${venue.venue_id}-${selectedTour}`}
            venue={venue}
            shows={venueShows[venue.venue] || []}
            selectedTour={selectedTour}
            tourVenueOrder={tourVenueOrder}
            tourStartEndVenues={tourStartEndVenues}
            onVenueClick={onVenueClick}
          />
        ))}
      </MapContainer>
    </div>
  );
};