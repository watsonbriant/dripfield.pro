import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import CircularProgress from './CircularProgress';
import GuestTable from './GuestTable';
import { useUserGuests } from '../hooks/useUserGuests';
import { getUserGuestsMessages } from '../utils/userGuestsMessages';

interface UserGuestsProps {
  userId?: string;
}

const UserGuests: React.FC<UserGuestsProps> = ({ userId }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Use the custom hook for data fetching
  const { loading, loadingProgress, guestsByCategory, error } = useUserGuests(effectiveUserId);

  // Fetch username if viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            return;
          }
          
          if (data?.username) {
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Error in username fetch:', error);
        }
      };
      
      fetchUsername();
    }
  }, [userId, isOwnProfile, user]);

  // Get messages using utility functions
  const { getLoadingMessage, getErrorMessage, getEmptyStateMessage } = getUserGuestsMessages(!!isOwnProfile, username, error);

  // Early returns for different states
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-56">
        <CircularProgress value={loadingProgress} />
        <p className="text-fifth mt-4">{getLoadingMessage()}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="text-center text-red-500 py-8">{getErrorMessage()}</div>
      </div>
    );
  }

  if (Object.keys(guestsByCategory).length === 0) {
    return (
      <div className="bg-primary border border-fourth shadow-xl">
        <div className="text-center text-fifth py-12">
          <p>{getEmptyStateMessage()}</p>
        </div>
      </div>
    );
  }

  
  // Define category order for grid layout
  const categoryOrder = ['Goose (current)', 'Goose (former)', 'Guest', 'Group'];
  
  // Get sorted categories in the desired order
  const sortedCategories = Object.keys(guestsByCategory)
    .filter(cat => guestsByCategory[cat].guests.length > 0)
    .sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      // If both are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the order array, sort alphabetically
      return a.localeCompare(b);
    });

  // Main render
  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          Musicians Seen
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {sortedCategories.map((category, index, array) => (
          <GuestTable
            key={category}
            category={category}
            guests={guestsByCategory[category].guests}
            count={guestsByCategory[category].count}
            isLast={index === array.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default UserGuests;