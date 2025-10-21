import React from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterUpdaterProps {
  center: [number, number];
  venues: Array<{ venue_latitude: string; venue_longitude: string }>;
}

export const MapCenterUpdater: React.FC<MapCenterUpdaterProps> = ({ center, venues }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (venues.length > 0) {
      // Calculate appropriate zoom level based on venue spread
      const lats = venues.map(v => parseFloat(v.venue_latitude));
      const lngs = venues.map(v => parseFloat(v.venue_longitude));
      
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);
      
      let zoom = 3; // Default zoom
      if (maxRange < 0.11) {
        zoom = 12;
      } else if (maxRange < 2) {
        zoom = 8;
      } else if (maxRange < 10) {
        zoom = 6;
      } else if (maxRange < 20) {
        zoom = 5;
      } else if (maxRange < 45) {
        zoom = 5;
      } else if (maxRange < 60) {
        zoom = 4;
      } else {
        zoom = 3;
      }
      
      map.setView(center, zoom, { animate: true });
    }
  }, [map, center, venues]);

  return null;
};
