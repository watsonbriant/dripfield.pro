import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GuestSearch } from './GuestSearch';
import GuestPerformanceChart from './GuestPerformanceChart';
import { GuestSongsSection } from './GuestSongsSection';
import { ShowsByGroup } from './ShowsByGroup';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useGuestData } from '../hooks/useGuestData';
import { cleanSongName } from '../utils/songUtils';

export function Guest() {
  const { PersonnelID } = useParams();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  
  const { guest, performances, loading, songShowMap } = useGuestData(PersonnelID);

  // Handle group selection
  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const handleSongClick = (song: string) => {
    setSelectedSong(currentSong => currentSong === song ? null : song);
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!guest) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <p className="text-fifth">Personnel not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[936px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 mb-1 mr-2">
          <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
            {guest.guest}
          </h2>
          {guest.guest_instrument && (
            <div className="bg-secondary text-fifth text-xs font-medium px-2 py-1 rounded-lg border border-secondary">
              {guest.guest_instrument}
            </div>
          )}
        </div>
        <GuestSearch />
      </div>

      <div className="space-y-4 mb-8">
        {/* Top row with Song List and Performances by Group side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Song List - Only show if there are performances */}
          {performances.length > 0 && (
            <GuestSongsSection 
              PersonnelID={PersonnelID} 
              isLoading={loading} 
              selectedSong={selectedSong}
              onSongClick={handleSongClick}
              cleanSongName={cleanSongName}
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
          <div className="overflow-x-auto">
            <GuestPerformanceChart 
              performances={performances} 
              selectedGroup={selectedGroup}
              selectedSong={selectedSong}
              songShowMap={songShowMap}
            />
          </div>
        ) : (
          <div className="bg-primary border border-secondary rounded-lg p-4">
            <p className="text-fifth text-center">
              <span className="font-semibold">{guest.guest}</span> hasn't performed as a guest.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}