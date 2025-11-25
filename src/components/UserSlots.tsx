import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserSlotsProps } from '../types/userSlots';
import { useUserSlots } from '../hooks/useUserSlots';
import { useUsername } from '../hooks/useUsername';
import { getUserSlotsMessages } from '../utils/userSlotsMessages';
import CircularProgress from './CircularProgress';
import EmptyState from './EmptyState';
import SlotsTable from './SlotsTable';

const UserSlots: React.FC<UserSlotsProps> = ({ userId }) => {
  const { user } = useAuth();
  
  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId) || false;

  // Use custom hooks for data fetching
  const {
    isLoading,
    loadingProgress,
    slots,
    activeColumns,
    songIdMap,
    hasSlotEntries,
    attendedShowIds
  } = useUserSlots(effectiveUserId);

  const username = useUsername(userId || null, isOwnProfile);

  // Get message helpers
  const {
    getLoadingMessage,
    getNoUserMessage,
    getNoShowsMessage,
    getNoSlotsMessage
  } = getUserSlotsMessages(isOwnProfile, username);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-fifth mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  if (!effectiveUserId) {
    return <EmptyState message={getNoUserMessage()} />;
  }

  if (attendedShowIds.length === 0) {
    return <EmptyState message={getNoShowsMessage()} />;
  }

  if (!hasSlotEntries) {
    return <EmptyState message={getNoSlotsMessage()} />;
  }

  return (
    <div>
      <div className="bg-primary border border-fourth rounded-lg p-3">
        <SlotsTable 
          slots={slots}
          activeColumns={activeColumns}
          songIdMap={songIdMap}
        />
      </div>
    </div>
  );
};

export default UserSlots;