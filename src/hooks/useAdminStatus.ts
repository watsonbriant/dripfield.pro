import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminStatus(user: any) {
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdminUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
          return;
        }

        setIsAdminUser(data?.is_admin || false);
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdminUser(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return isAdminUser;
}