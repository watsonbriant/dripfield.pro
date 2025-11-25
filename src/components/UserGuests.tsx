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
      <div className="bg-primary p-3 rounded-lg border border-fourth">
        <div className="text-center text-red-500 py-8">{getErrorMessage()}</div>
      </div>
    );
  }

  if (Object.keys(guestsByCategory).length === 0) {
    return (
      <div className="bg-primary p-3 rounded-lg border border-fourth">
        <div className="text-center text-fifth py-12">
          <p>{getEmptyStateMessage()}</p>
        </div>
      </div>
    );
  }

  
  // Main render
  return (
    <div className="space-y-4 max-w-[1280px] mx-auto">
      {/* Render all categories in alphabetical order */}
      {Object.keys(guestsByCategory)
        .sort((a, b) => a.localeCompare(b)) // Sort categories alphabetically
        .map(category => (
          <GuestTable
            key={category}
            category={category}
            guests={guestsByCategory[category].guests}
            count={guestsByCategory[category].count}
          />
        ))}
    </div>
  );
};

export default UserGuests;