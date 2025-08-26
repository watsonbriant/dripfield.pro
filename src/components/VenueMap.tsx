import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { X, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FilterModal } from './FilterModal';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet v4
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://i.postimg.cc/MTNGffDN/map1-1.png',
  iconUrl: 'https://i.postimg.cc/8cvzRkX5/map2-1.png',
  shadowUrl: '',
});

// Create custom icons for tour start and end
const createTourStartIcon = () => new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createTourEndIcon = () => new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create numbered marker icons
const createNumberedIcon = (number: number, isStart: boolean = false, isEnd: boolean = false) => {
  let backgroundColor = '#272727'; // Default blue
  let textColor = 'white';
  
  if (isStart) {
    backgroundColor = '#16a34a'; // Green for start
  } else if (isEnd) {
    backgroundColor = '#dc2626'; // Red for end
  }
  
  return new DivIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        color: ${textColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        font-family: Arial, sans-serif;
      ">${number}</div>
    `,
    className: 'numbered-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

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

interface Group {
  group: string;
}

interface Tour {
  tour: string;
  tour_venuemap: boolean;
}

interface VenueMapProps {
  onVenueClick?: (venueId: string) => void;
}

// Component to handle map center updates
const MapCenterUpdater: React.FC<{ center: [number, number]; venues: MapVenue[] }> = ({ center, venues }) => {
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

export const VenueMap: React.FC<VenueMapProps> = ({ onVenueClick }) => {
  const [mapVenues, setMapVenues] = React.useState<MapVenue[]>([]);
  const [venueShows, setVenueShows] = React.useState<Record<string, Show[]>>({});
  const [allVenues, setAllVenues] = React.useState<MapVenue[]>([]);
  const [allShows, setAllShows] = React.useState<Record<string, Show[]>>({});
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('Show All');
  const [selectedTour, setSelectedTour] = React.useState<string>('Show All');
  const [tourPath, setTourPath] = React.useState<Array<[number, number]>>([]);
  const [tourVenueOrder, setTourVenueOrder] = React.useState<Record<string, number>>({});
  const [tourStartEndVenues, setTourStartEndVenues] = React.useState<{
    start?: string;
    end?: string;
  }>({});
  const [loading, setLoading] = React.useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

  // Function to format date as MM.DD.YY (matches Home component approach)
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

  // Generate tour path and identify start/end venues when tour is selected
  const generateTourPath = React.useCallback((tourName: string, allVenuesData: MapVenue[], allShowsData: Record<string, Show[]>) => {
    if (tourName === 'Show All') {
      setTourPath([]);
      setTourStartEndVenues({});
      setTourVenueOrder({});
      return;
    }

    // Collect all shows for this tour with venue coordinates
    const tourShows: Array<Show & { venue_latitude: number; venue_longitude: number; venue_name: string }> = [];
    
    Object.entries(allShowsData).forEach(([venueName, shows]) => {
      const venue = allVenuesData.find(v => v.venue === venueName);
      if (venue) {
        const tourShowsForVenue = shows.filter(show => show.show_tour === tourName);
        tourShowsForVenue.forEach(show => {
          tourShows.push({
            ...show,
            venue_latitude: parseFloat(venue.venue_latitude),
            venue_longitude: parseFloat(venue.venue_longitude),
            venue_name: venueName
          });
        });
      }
    });

    // Sort shows by canonid, then date, then group
    const sortedShows = tourShows.sort((a, b) => {
      // Primary sort by show_canonid (handle nulls)
      const canonIdA = a.show_canonid ?? -1;
      const canonIdB = b.show_canonid ?? -1;
      if (canonIdA !== canonIdB) {
        return canonIdA - canonIdB;
      }

      // Secondary sort by show_date
      const dateA = new Date(a.show_date).getTime();
      const dateB = new Date(b.show_date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // Tertiary sort by show_group
      return a.show_group.localeCompare(b.show_group);
    });

    // Create path coordinates from sorted shows
    const pathCoordinates: Array<[number, number]> = sortedShows.map(show => [
      show.venue_latitude,
      show.venue_longitude
    ]);

    // Create venue order mapping with unique venues only
    const venueOrderMap: Record<string, number> = {};
    const seenVenues = new Set<string>();
    let venueIndex = 1;
    
    sortedShows.forEach(show => {
      if (!seenVenues.has(show.venue_name)) {
        venueOrderMap[show.venue_name] = venueIndex;
        seenVenues.add(show.venue_name);
        venueIndex++;
      }
    });

    // Identify start and end venues
    const startEndVenues: { start?: string; end?: string } = {};
    const uniqueVenueNames = Array.from(seenVenues);
    if (uniqueVenueNames.length > 0) {
      startEndVenues.start = uniqueVenueNames[0];
      if (uniqueVenueNames.length > 1) {
        startEndVenues.end = uniqueVenueNames[uniqueVenueNames.length - 1];
      }
    }

    setTourPath(pathCoordinates);
    setTourStartEndVenues(startEndVenues);
    setTourVenueOrder(venueOrderMap);
  }, []);

  // Filter venues and shows based on selected filters
  const applyFilters = React.useCallback((tourName: string, groupName: string, allVenuesData: MapVenue[], allShowsData: Record<string, Show[]>) => {
    let filteredShows: Record<string, Show[]> = {};
    let venuesWithFilteredShows = new Set<string>();

    // If tour is selected (not "Show All"), filter by tour only
    if (tourName !== 'Show All') {
      Object.entries(allShowsData).forEach(([venueName, shows]) => {
        const tourShows = shows.filter(show => show.show_tour === tourName);
        if (tourShows.length > 0) {
          filteredShows[venueName] = tourShows;
          venuesWithFilteredShows.add(venueName);
        }
      });
    }
    // If tour is "Show All" but group is selected, filter by group
    else if (groupName !== 'Show All') {
      Object.entries(allShowsData).forEach(([venueName, shows]) => {
        const groupShows = shows.filter(show => show.show_group === groupName);
        if (groupShows.length > 0) {
          filteredShows[venueName] = groupShows;
          venuesWithFilteredShows.add(venueName);
        }
      });
    }
    // If both are "Show All", show everything
    else {
      filteredShows = allShowsData;
      venuesWithFilteredShows = new Set(Object.keys(allShowsData));
    }

    // Filter venues to only those that have shows for the selected criteria
    const filteredVenues = allVenuesData.filter(venue => 
      venuesWithFilteredShows.has(venue.venue)
    );

    setMapVenues(filteredVenues);
    setVenueShows(filteredShows);

    // Generate tour path if tour is selected
    generateTourPath(tourName, allVenuesData, allShowsData);
  }, [generateTourPath]);

  React.useEffect(() => {
    async function fetchMapData() {
      try {
        // Step 1: Fetch all groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('group')
          .order('group', { ascending: true });

        if (groupsError) {
          return;
        }

        setGroups(groupsData || []);

        // Step 2: Fetch tours with tour_venuemap = TRUE
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select('tour, tour_venuemap')
          .eq('tour_venuemap', true)
          .order('tour_canonid', { ascending: true });

        if (toursError) {
          // Continue without tour filtering if there's an error
          setTours([]);
        } else {
          setTours(toursData || []);
        }

        // Step 3: Fetch ALL shows with their venue relationships
        let allShowsData: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;
        let hasError = false;
        
        while (hasMore && !hasError) {
          const { data: showsBatch, error: batchError } = await supabase
            .from('shows')
            .select(`
              show_id, 
              show_date, 
              show_group, 
              show_tour,
              show_canonid,
              show_subvenue,
              subvenues!inner(
                subvenue,
                subvenue_venue
              )
            `)
            .order('show_date', { ascending: false })
            .range(from, from + pageSize - 1);

          if (batchError) {
            hasError = true;
            break;
          }

          if (showsBatch && showsBatch.length > 0) {
            allShowsData = [...allShowsData, ...showsBatch];
            hasMore = showsBatch.length === pageSize;
            from += pageSize;
          } else {
            hasMore = false;
          }
        }
        
        if (hasError || allShowsData.length === 0) {
          return;
        }

        // Step 4: Extract unique venue names from the shows
        const uniqueVenueNames = [...new Set(allShowsData.map(show => show.subvenues.subvenue_venue))];

        // Step 5: Fetch ALL venues once, then filter in JavaScript
        const { data: allVenuesData, error: allVenuesError } = await supabase
          .from('venues')
          .select('venue, venue_location, venue_id, venue_latitude, venue_longitude');
        
        if (allVenuesError) {
          return;
        }
        
        if (!allVenuesData) {
          return;
        }
        
        // Filter to only venues referenced in shows
        const uniqueVenueNamesSet = new Set(uniqueVenueNames);
        const allVenuesWithCoords = allVenuesData.filter(venue => 
          uniqueVenueNamesSet.has(venue.venue)
        );

        // Check coordinate availability
        const venuesWithCoords = allVenuesWithCoords.filter(venue => {
          const hasLat = venue.venue_latitude && venue.venue_latitude !== '' && venue.venue_latitude !== 'NULL';
          const hasLng = venue.venue_longitude && venue.venue_longitude !== '' && venue.venue_longitude !== 'NULL';
          return hasLat && hasLng;
        });

        // Filter to only venues with valid numeric coordinates
        const validVenues = venuesWithCoords.filter(venue => {
          const lat = parseFloat(venue.venue_latitude);
          const lng = parseFloat(venue.venue_longitude);
          const isValid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          return isValid;
        });

        if (validVenues.length === 0) {
          setLoading(false);
          return;
        }

        // Step 6: Group shows by venue for popups
        const showsByVenue: Record<string, Show[]> = {};
        const validVenueNames = new Set(validVenues.map(v => v.venue));
        
        allShowsData.forEach(show => {
          const venueName = show.subvenues.subvenue_venue;
          
          if (validVenueNames.has(venueName)) {
            if (!showsByVenue[venueName]) {
              showsByVenue[venueName] = [];
            }
            showsByVenue[venueName].push({
              show_id: show.show_id,
              show_date: show.show_date,
              show_group: show.show_group,
              show_tour: show.show_tour,
              show_canonid: show.show_canonid
            });
          }
        });

        // Store all data for filtering
        setAllVenues(validVenues);
        setAllShows(showsByVenue);
        
        // Initially show all venues and shows
        setMapVenues(validVenues);
        setVenueShows(showsByVenue);
        
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
  }, []);

  // Handle tour selection change
  const handleTourChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tourName = event.target.value;
    
    setSelectedTour(tourName);
    
    // If "Show All" is selected, immediately clear tour-related state
    if (tourName === 'Show All') {
      setTourPath([]);
      setTourStartEndVenues({});
      setTourVenueOrder({});
      setSelectedGroup('Show All');
    }
    
    // If tour is selected (not "Show All"), reset group filter and disable it
    if (tourName !== 'Show All') {
      setSelectedGroup('Show All');
    }
    
    applyFilters(tourName, tourName !== 'Show All' ? 'Show All' : selectedGroup, allVenues, allShows);
  };

  // Handle group selection change
  const handleGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const groupName = event.target.value;
    setSelectedGroup(groupName);
    applyFilters(selectedTour, groupName, allVenues, allShows);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSelectedTour('Show All');
    setSelectedGroup('Show All');
    setTourPath([]);
    setTourStartEndVenues({});
    setTourVenueOrder({});
    applyFilters('Show All', 'Show All', allVenues, allShows);
  };

  // Function to determine which icon to use for each marker
  const getMarkerIcon = (venueName: string) => {
    const hasTourOrder = tourVenueOrder[venueName];
    const tourOrderKeys = Object.keys(tourVenueOrder);
    
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

  // Check if any filters are active
  const hasActiveFilters = selectedTour !== 'Show All' || selectedGroup !== 'Show All';

  // Determine if group dropdown should be disabled
  const isGroupDropdownDisabled = selectedTour !== 'Show All';

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-4 text-center">
        <p className="text-fifth">Loading map...</p>
      </div>
    );
  }

  if (allVenues.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-4 text-center">
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
    <div className="bg-primary border border-secondary rounded-lg p-3 mb-4">
      {/* Mobile Header (less than xl) */}
      <div className="mb-2 xl:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fifth">{mapVenues.length} venues</span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="p-1 bg-red-600 hover:bg-red-600/70 text-primary rounded transition-colors focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1 bg-tertiary hover:bg-tertiary/70 text-fifth text-sm font-medium rounded border border-secondary transition-colors focus:outline-none"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Desktop Header (xl and above) */}
      <div className="mb-2 hidden xl:flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm text-fifth">
            Showing {mapVenues.length} venues
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2 py-1 bg-red-600 hover:bg-red-600/70 text-primary text-xs font-medium rounded transition-colors focus:outline-none"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Tour Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="tour-filter" className="text-sm text-fifth font-medium">
              Filter by tour:
            </label>
            <select
              id="tour-filter"
              value={selectedTour}
              onChange={handleTourChange}
              className="px-3 py-1 border border-secondary rounded bg-tertiary text-fifth text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tertiary"
            >
              <option value="Show All">[Show All]</option>
              {tours.map((tour) => (
                <option key={tour.tour} value={tour.tour}>
                  {tour.tour}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="group-filter" className="text-sm text-fifth font-medium">
              Filter by group:
            </label>
            <select
              id="group-filter"
              value={selectedGroup}
              onChange={handleGroupChange}
              disabled={isGroupDropdownDisabled}
              className={`px-3 py-1 border border-secondary rounded text-fifth text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tertiary ${
                isGroupDropdownDisabled 
                  ? 'bg-gray-200 cursor-not-allowed opacity-50' 
                  : 'bg-tertiary'
              }`}
            >
              <option value="Show All">[Show All]</option>
              {groups.map((group) => (
                <option key={group.group} value={group.group}>
                  {group.group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Filter Modal for Mobile */}
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

      {/* Add CSS for numbered markers */}
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
        
        {/* Component to handle map center updates */}
        <MapCenterUpdater center={[centerLat, centerLng]} venues={mapVenues} />
        
        {/* Tour path polyline - only show when tour is selected */}
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
        
        {mapVenues.map((venue) => {
          const shows = venueShows[venue.venue] || [];
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
        })}
      </MapContainer>
    </div>
  );
};