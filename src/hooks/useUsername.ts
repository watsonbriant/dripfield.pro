import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUsername = (userId: string | null | undefined, isOwnProfile: boolean) => {
  const [username, setUsername] = useState<string | null>(null);

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
  }, [userId, isOwnProfile]);

  return username;
};
