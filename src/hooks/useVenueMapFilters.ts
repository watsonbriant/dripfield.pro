import React from 'react';

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

interface UseVenueMapFiltersReturn {
  selectedGroup: string;
  selectedTour: string;
  tourPath: Array<[number, number]>;
  tourVenueOrder: Record<string, number>;
  tourStartEndVenues: { start?: string; end?: string };
  isFilterModalOpen: boolean;
  hasActiveFilters: boolean;
  isGroupDropdownDisabled: boolean;
  setSelectedGroup: (group: string) => void;
  setSelectedTour: (tour: string) => void;
  setIsFilterModalOpen: (open: boolean) => void;
  handleTourChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleGroupChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleClearFilters: () => void;
  applyFilters: (tourName: string, groupName: string, allVenuesData: MapVenue[], allShowsData: Record<string, Show[]>) => void;
}

export const useVenueMapFilters = (
  allVenues: MapVenue[],
  allShows: Record<string, Show[]>,
  setMapVenues: React.Dispatch<React.SetStateAction<MapVenue[]>>,
  setVenueShows: React.Dispatch<React.SetStateAction<Record<string, Show[]>>>
): UseVenueMapFiltersReturn => {
  const [selectedGroup, setSelectedGroup] = React.useState<string>('Show All');
  const [selectedTour, setSelectedTour] = React.useState<string>('Show All');
  const [tourPath, setTourPath] = React.useState<Array<[number, number]>>([]);
  const [tourVenueOrder, setTourVenueOrder] = React.useState<Record<string, number>>({});
  const [tourStartEndVenues, setTourStartEndVenues] = React.useState<{
    start?: string;
    end?: string;
  }>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

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
  }, [generateTourPath, setMapVenues, setVenueShows]);

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

  // Check if any filters are active
  const hasActiveFilters = selectedTour !== 'Show All' || selectedGroup !== 'Show All';

  // Determine if group dropdown should be disabled
  const isGroupDropdownDisabled = selectedTour !== 'Show All';

  return {
    selectedGroup,
    selectedTour,
    tourPath,
    tourVenueOrder,
    tourStartEndVenues,
    isFilterModalOpen,
    hasActiveFilters,
    isGroupDropdownDisabled,
    setSelectedGroup,
    setSelectedTour,
    setIsFilterModalOpen,
    handleTourChange,
    handleGroupChange,
    handleClearFilters,
    applyFilters
  };
};
