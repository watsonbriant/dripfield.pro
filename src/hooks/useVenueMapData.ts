import React from 'react';
import { supabase } from '../lib/supabase';

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

interface UseVenueMapDataReturn {
  allVenues: MapVenue[];
  allShows: Record<string, Show[]>;
  groups: Group[];
  tours: Tour[];
  loading: boolean;
}

export const useVenueMapData = (): UseVenueMapDataReturn => {
  const [allVenues, setAllVenues] = React.useState<MapVenue[]>([]);
  const [allShows, setAllShows] = React.useState<Record<string, Show[]>>({});
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [loading, setLoading] = React.useState(true);

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
        
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
  }, []);

  return {
    allVenues,
    allShows,
    groups,
    tours,
    loading
  };
};
