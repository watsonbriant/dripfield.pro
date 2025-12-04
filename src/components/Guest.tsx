import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { GuestSearch } from './GuestSearch';
import GuestPerformanceChart from './GuestPerformanceChart';
import { GuestSongsSection } from './GuestSongsSection';
import { ShowsByGroup } from './ShowsByGroup';
import { useGuestData } from '../hooks/useGuestData';

export function Guest() {
  const { PersonnelID } = useParams();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  
  const { guest, performances, loading, songShowMap, songs, songSpreadData, loadingProgress } = useGuestData(PersonnelID);

  // Handle group selection
  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const handleSongClick = (song: string) => {
    setSelectedSong(currentSong => currentSong === song ? null : song);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1024px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading personnel data...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="max-w-[1024px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">Personnel not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{guest ? `${guest.guest} — Dripfield.pro` : 'Personnel — Dripfield.pro'}</title>
      </Helmet>
      <div className="max-w-[1024px]">
      <div className="mb-4">
        <div className="bg-primary border border-fourth shadow-xl">
          <div className="bg-fourth text-white py-0.5 pr-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 pl-2">
                <h2 className="text-sm font-semibold">
                  {guest.guest}
                </h2>
                {guest.guest_instrument && (
                  <div className="hidden md:block text-fifth border border-fourth bg-primary px-1 rounded text-[0.625rem]">
                    {guest.guest_instrument}
                  </div>
                )}
              </div>
              <GuestSearch />
            </div>
            {guest.guest_instrument && (
              <div className="md:hidden pl-2">
                <div className="text-white text-[0.625rem] inline-block">
                  {guest.guest_instrument}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-8">
        {/* Top row with Song List and Performances by Group side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Song List - Only show if there are performances */}
          {performances.length > 0 && (
            <GuestSongsSection 
              PersonnelID={PersonnelID} 
              isLoading={loading} 
              selectedSong={selectedSong}
              onSongClick={handleSongClick}
              songs={songs}
              songSpreadData={songSpreadData}
              loadingProgress={loadingProgress}
            />
          )}

          {/* Performances by Group */}
          <ShowsByGroup 
            performances={performances}
            selectedGroup={selectedGroup}
            onGroupClick={handleGroupClick}
          />
        </div>

        {/* Performance Chart */}
        {performances.length > 0 ? (
          <div className="overflow-x-auto shadow-xl">
            <GuestPerformanceChart 
              performances={performances} 
              selectedGroup={selectedGroup}
              selectedSong={selectedSong}
              songShowMap={songShowMap}
            />
          </div>
        ) : (
          <div className="bg-primary border border-fourth">
            <div className="p-2">
              <p className="text-[0.625rem] text-fifth text-center">
                <span className="font-semibold">{guest.guest}</span> hasn't performed as a guest.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}