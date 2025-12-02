import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  const [tableMinWidth, setTableMinWidth] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Measure and preserve table width when unfiltered data loads
  useEffect(() => {
    if (shows.length > 0 && selectedGroups.length === 0 && tableRef.current && !tableMinWidth && !loading) {
      // Use requestAnimationFrame to ensure table is fully rendered
      requestAnimationFrame(() => {
        const table = tableRef.current?.querySelector('table');
        if (table && table.offsetWidth > 0) {
          const width = table.offsetWidth;
          setTableMinWidth(width);
        }
      });
    }
  }, [shows, selectedGroups, tableMinWidth, loading]);
  
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
      setTableMinWidth(null); // Reset table width when year changes
    }
  }, [year, previousYearId]);

  return (
    <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
      {/* Mobile: Header and Year Buttons */}
      <div className="lg:hidden mb-4">
        <div className="flex flex-wrap gap-1">
          {years.map((yearItem) => (
            <Link
              key={yearItem.year_id}
              to={`/years/${yearItem.year_id}`}
              onClick={() => handleYearChange(yearItem.year_id, yearItem.year)}
              className={`px-1 py-0.5 border border-fourth rounded-md hover:bg-fourth hover:text-canvas transition-all duration-300 text-xs hover:drop-shadow-[2px_2px_0px_rgba(244,155,29,1)] font-medium ${
                year === yearItem.year_id ? 'bg-fourth text-canvas' : 'text-fourth bg-primary'
              }`}
            >
              {yearItem.year}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Layout: Shows Table on left, Tours/Filters stacked on right */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Shows Table - Tour Dates Container */}
        <div className="w-auto max-w-full lg:w-auto lg:min-w-0 min-w-0">
          <div className="overflow-x-auto shadow-xl" ref={tableRef}>
            <div style={tableMinWidth ? { minWidth: `${tableMinWidth}px` } : undefined}>
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
          </div>
        </div>

        {/* Right Side: Tours and Filters stacked vertically */}
        <div className="w-full lg:w-[250px] flex-shrink-0 space-y-4">
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
    </div>
  );
}