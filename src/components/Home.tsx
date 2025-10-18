import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import coverImage from '../img/Cover.jpg';
import cover2 from '../img/Cover2.jpg';
import { ShowTable } from './ShowTable';
import { MostRecentShow } from './MostRecentShow';
import { StatsSection } from './StatsSection';
import { useShowsData } from '../hooks/useShowsData';
import { useStatsData } from '../hooks/useStatsData';

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
    <div className="max-w-[1280px] mx-auto">
      {!isSupabaseConfigured() && (
        <div className="bg-primary border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-fifth">
            Please connect to Supabase using the button in the top right to view setlist data.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-[43%] space-y-4 mr-4">
          {/* Logo container */}
          <div className="h-auto md:h-[204.05px] overflow-hidden rounded-lg flex items-center justify-center">
            <img
              src={cover2}
              alt="Dripfield.pro logo"
              className="hidden md:block h-full w-auto border border-secondary rounded-lg object-contain"
            />
            <img
              src={cover2}
              alt="Dripfield.pro logo"
              className="block md:hidden h-auto w-auto border border-secondary rounded-lg"
            />
          </div>

          <ShowTable
            title="Last 5 Shows"
            shows={recentShows}
            loading={loading}
          />

          <MostRecentShow
            mostRecentShow={mostRecentShow}
            setlist={setlist}
            loadingMostRecent={loadingMostRecent}
            loadingSetlist={loadingSetlist}
          />

          <ShowTable
            title="Next 5 Shows"
            shows={upcomingShows}
            loading={loadingUpcoming}
          />

          <ShowTable
            title="This Day in Goose History"
            shows={historicalShows}
            loading={loadingHistorical}
            emptyMessage="No shows occurred on this date in Goose history."
          />
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[57%] space-y-4">
          {/* Cover Image */}
          <div className="hidden md:block overflow-hidden rounded-lg">
            <img
              src={coverImage}
              alt="Dripfield.pro banner"
              className="w-full h-full object-cover border border-secondary rounded-lg shadow-lg"
            />
          </div>

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
          />
        </div>
      </div>
    </div>
  );
}