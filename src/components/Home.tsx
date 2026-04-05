import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { HomeShowTable } from './HomeShowTable';
import { MostRecentShow } from './MostRecentShow';
import { StatsSection } from './StatsSection';
import { useShowsData } from '../hooks/useShowsData';
import { useStatsData } from '../hooks/useStatsData';
import { useShowMetadata } from '../hooks/useShowMetadata';
import { useSidebar } from '../context/SidebarContext';
import cover7Image from '../img/Cover7.png';

export function Home() {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  
  // Derive selectedYear directly from URL param (URL is the single source of truth)
  const selectedYear = useMemo(() => {
    if (yearParam) {
      if (yearParam === 'all-time') {
        return 'all-time';
      }
      const yearNum = parseInt(yearParam, 10);
      if (!isNaN(yearNum)) {
        return yearNum;
      }
    }
    return 2025; // Default fallback
  }, [yearParam]);
  
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    recentShows,
    upcomingShows,
    historicalShows,
    mostRecentShow,
    setlist,
    loading,
    loadingUpcoming,
    loadingHistorical,
    loadingMostRecent,
    loadingSetlist
  } = useShowsData();

  const {
    topSongs,
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    notPlayedSongs,
    longestSongs,
    liberatedSongs,
    longestShows,
    lowestRarityShows,
    highestGapShows,
    highestAttendedShows,
    highestRatedShows,
    isAnyStatLoading
  } = useStatsData(selectedYear);

  // Get metadata for all shows (recent, upcoming, historical)
  const allShows = useMemo(() => [...recentShows, ...upcomingShows, ...historicalShows], [recentShows, upcomingShows, historicalShows]);
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(allShows, selectedYear.toString());

  // Available years for dropdown
  const availableYears = useMemo(() => {
    const years = ['all-time', ...Array.from({ length: 13 }, (_, i) => 2026 - i)];
    return years;
  }, []);

  // Handle initial navigation when on root or /home without year
  useEffect(() => {
    const currentPath = window.location.pathname;
    if ((currentPath === '/' || currentPath === '/home') && !yearParam) {
      navigate(`/home/2026`, { replace: true });
    }
  }, [yearParam, navigate]);

  // Close dropdown when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      setIsYearDropdownOpen(false);
    }
  }, [isSidebarOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await supabase.from('shows').select('show_id').limit(1);
      } catch (err) {
        // Error silently handled
      }
    };

    testConnection();
  }, []);

  const handleYearChange = (year: number | string) => {
    const yearValue = year === 'all-time' ? 'all-time' : year.toString();
    navigate(`/home/${yearValue}`, { replace: true });
    setIsYearDropdownOpen(false);
  };

  const getHeaderBgColor = () => {
    // Use a color that matches the theme - similar to tertiary but with more saturation for the button
    return '#3c1e40'; // Teal color matching the stats theme
  };

  const getYearDisplayText = () => {
    return selectedYear === 'all-time' ? 'All-Time' : selectedYear.toString();
  };


  return (
    <>
      <Helmet>
        <title>Dripfield.pro — A Setlist Archive for Goose the Band</title>
      </Helmet>
      <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
      {!isSupabaseConfigured() && (
        <div className="bg-primary border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-fifth">
            Please connect to Supabase using the button in the top right to view setlist data.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Column */}
        <div className="w-full lg:w-[20%]">
          <div className="border border-fourth shadow-xl">
            <HomeShowTable
              title="Last 5 Shows"
              shows={recentShows}
              loading={loading}
              showsWithSetlists={showsWithSetlists}
              showsWithReleases={showsWithReleases}
            />

            <MostRecentShow
              mostRecentShow={mostRecentShow as any}
              setlist={setlist}
              loadingMostRecent={loadingMostRecent}
              loadingSetlist={loadingSetlist}
            />

            <HomeShowTable
              title="Next 5 Shows"
              shows={upcomingShows}
              loading={loadingUpcoming}
              showsWithSetlists={showsWithSetlists}
              showsWithReleases={showsWithReleases}
            />

            <HomeShowTable
              title="This Day in Goose History"
              shows={historicalShows}
              loading={loadingHistorical}
              emptyMessage="No shows occurred on this date in Goose history."
              showsWithSetlists={showsWithSetlists}
              showsWithReleases={showsWithReleases}
            />
          </div>
        </div>

        {/* Middle Column */}
        <div className="w-full lg:w-[60%] space-y-4">
          <div className="border border-fourth shadow-xl">
            <div className="bg-primary relative border-x-[0.5px] border-fourth border-t-[0.5px]">
              <div className="bg-tertiary text-fifth py-0.5 flex justify-between items-center">
                <h2 className="pl-2 text-sm font-semibold">
                  {getYearDisplayText()} Stats
                </h2>
                
                {/* Year Dropdown */}
                <div className="relative pr-1" ref={yearDropdownRef}>
                  <button
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    disabled={isSidebarOpen}
                    className="relative flex items-center gap-2 text-white px-2 border border-fourth transition-colors text-sm font-semibold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: getHeaderBgColor() }}
                  >
                    <div className="absolute inset-0 bg-fourth pointer-events-none"></div>
                    <span className="relative z-10">{getYearDisplayText()}</span>
                    <ChevronDown className="w-3 h-3 relative z-10" />
                  </button>
                  
                  {isYearDropdownOpen && !isSidebarOpen && (
                    <div className="absolute right-0 bg-canvas text-fifth border border-fourth shadow-lg z-50 overflow-y-auto w-[100px] max-h-64">
                      {availableYears.map((year) => {
                        const yearValue = year === 'all-time' ? 'all-time' : year;
                        const isSelected = selectedYear === yearValue;
                        return (
                          <button
                            key={year}
                            onClick={() => handleYearChange(yearValue)}
                            className={`w-full text-left px-2 text-xs py-1 font-medium transition-colors ${
                              isSelected ? 'text-white' : 'hover:bg-tertiary/40'
                            }`}
                            style={isSelected ? { backgroundColor: getHeaderBgColor() } : {}}
                          >
                            {year === 'all-time' ? 'All-Time' : year.toString()}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <StatsSection
              selectedYear={selectedYear}
              setSelectedYear={() => {
                // This is a no-op since showYearSelector is false
                // Year changes are handled by handleYearChange in the dropdown
              }}
              topSongs={topSongs}
              showOpeners={showOpeners}
              setOpeners={setOpeners}
              setClosers={setClosers}
              encores={encores}
              notPlayedSongs={notPlayedSongs}
              longestSongs={longestSongs}
              liberatedSongs={liberatedSongs}
              longestShows={longestShows}
              lowestRarityShows={lowestRarityShows}
              highestGapShows={highestGapShows}
              highestAttendedShows={highestAttendedShows}
              highestRatedShows={highestRatedShows}
              isAnyStatLoading={isAnyStatLoading}
              showYearSelector={false}
              hideHeader={true}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[20%]">
          <div className="bg-primary border border-fourth shadow-xl">
            <img 
              src={cover7Image} 
              alt="Cover7" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}