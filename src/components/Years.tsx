import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YearSelector } from './YearSelector';
import { ShowsTable } from './ShowsTable';
import { ToursSection } from './ToursSection';
import { GroupFilters } from './GroupFilters';
import { useYearsDataForYears } from '../hooks/useYearsDataForYears';
import { useShowsDataByYear } from '../hooks/useShowsDataByYear';
import { useToursData } from '../hooks/useToursData';
import { useGroupsData } from '../hooks/useGroupsData';
import { useAttendeeData } from '../hooks/useAttendeeData';
import { useShowRatings } from '../hooks/useShowRatings';
import { useShowMetadata } from '../hooks/useShowMetadata';

interface Show {
  show_iscanon: boolean;
  show_tour: string;
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_detail: string | null;
  show_alert: string | null;
  show_canonid: number | null;
  venue_location: string | null;
  show_venue_location: string;
  show_subvenue_venue: string;
  venue_id?: string;
  attended?: boolean;
  show_wl_link?: string | null;
}

export function Years() {
  const { year } = useParams();
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [previousYearId, setPreviousYearId] = useState<string | null>(null);

  // Custom hooks for data fetching
  const { years, loading: yearsLoading } = useYearsDataForYears();
  const { shows, loading: showsLoading } = useShowsDataByYear(currentYear);
  const { tours } = useToursData(currentYear);
  const { groups } = useGroupsData(shows);
  const { attendeeCounts } = useAttendeeData(filteredShows);
  const { showRatings } = useShowRatings(filteredShows);
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(shows, currentYear);

  const loading = yearsLoading || showsLoading;

  const handleYearChange = (_yearId: string, year: string) => {
    setCurrentYear(year);
  };

  const toggleGroupSelection = (group: string) => {
    setSelectedGroups(prevSelected => {
      if (prevSelected.includes(group)) {
        return prevSelected.filter(g => g !== group);
      } else {
        return [...prevSelected, group];
      }
    });
  };

  const clearGroupFilters = () => {
    setSelectedGroups([]);
  };

  // Apply group filtering to shows
  useEffect(() => {
    if (selectedGroups.length === 0) {
      setFilteredShows(shows);
    } else {
      setFilteredShows(shows.filter(show => selectedGroups.includes(show.show_group)));
    }
  }, [shows, selectedGroups]);
  
  // Initialize year from URL or redirect to 2025
  useEffect(() => {
    if (years.length === 0) return;

    // If no year in URL, redirect to 2025
    if (!year) {
      const year2025 = years.find(y => y.year === '2025');
      if (year2025) {
        navigate(`/years/${year2025.year_id}`, { replace: true });
      }
      return;
    }

    // Validate that the year_id in URL exists
    const yearData = years.find(y => y.year_id === year);
    
    if (yearData) {
      // Valid year_id - set it
      setCurrentYear(yearData.year);
    } else {
      // Invalid year_id - redirect to 2025
      const year2025 = years.find(y => y.year === '2025');
      if (year2025) {
        navigate(`/years/${year2025.year_id}`, { replace: true });
      }
    }
  }, [year, years, navigate]);

  // Effect to handle URL year_id changes
  useEffect(() => {
    if (year !== previousYearId) {
      setPreviousYearId(year || null);
      setSelectedGroups([]);
    }
  }, [year, previousYearId]);

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Years</h1>
        <YearSelector 
          years={years}
          currentYear={currentYear}
          onYearChange={handleYearChange}
        />
      </div>

      {/* Shows Table - Full Width */}
      <div className="mb-8 overflow-x-auto">
        <ShowsTable
          shows={filteredShows}
          tours={tours}
          attendeeCounts={attendeeCounts}
          showRatings={showRatings}
          showsWithSetlists={showsWithSetlists}
          showsWithReleases={showsWithReleases}
          currentYear={currentYear}
          selectedGroups={selectedGroups}
          onClearFilters={clearGroupFilters}
          loading={loading}
        />
      </div>

      {/* Two Column Layout for Tours and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[35%_calc(65%-1rem)] gap-4">
        <ToursSection 
          tours={tours}
          currentYear={currentYear}
          loading={loading}
        />
        
        <GroupFilters
          groups={groups}
          selectedGroups={selectedGroups}
          onToggleGroup={toggleGroupSelection}
          onClearFilters={clearGroupFilters}
          loading={loading}
        />
      </div>
    </div>
  );
}