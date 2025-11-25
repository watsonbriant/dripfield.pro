import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { HomeShowTable } from './HomeShowTable';
import { MostRecentShow } from './MostRecentShow';
import { StatsSection } from './StatsSection';
import { useShowsData } from '../hooks/useShowsData';
import { useStatsData } from '../hooks/useStatsData';
import { useShowMetadata } from '../hooks/useShowMetadata';
import cover7Image from '../img/Cover7.png';

export function Home() {
  const [selectedYear, setSelectedYear] = useState<number | string>(new Date().getFullYear());
  
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
    isAnyStatLoading
  } = useStatsData(selectedYear);

  // Get metadata for all shows (recent, upcoming, historical)
  const allShows = useMemo(() => [...recentShows, ...upcomingShows, ...historicalShows], [recentShows, upcomingShows, historicalShows]);
  const { showsWithSetlists, showsWithReleases } = useShowMetadata(allShows, selectedYear.toString());

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


  return (
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
          <div className="border border-fourth">
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
          <div className="bg-primary border border-fourth">
            <img 
              src={cover7Image} 
              alt="Cover7" 
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[20%]">
          <div className="border border-fourth">
            <StatsSection
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              topSongs={topSongs}
              showOpeners={showOpeners}
              setOpeners={setOpeners}
              setClosers={setClosers}
              encores={encores}
              notPlayedSongs={notPlayedSongs}
              isAnyStatLoading={isAnyStatLoading}
              showYearSelector={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}