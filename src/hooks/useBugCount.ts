import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useBugCount = (isAdmin: boolean) => {
  const [bugCount, setBugCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchBugCount = async () => {
      try {
        const { count, error } = await supabase
          .from('bugs')
          .select('*', { count: 'exact', head: true })
          .eq('bug_completion', false);
        
        if (error) {
          return;
        }
        
        setBugCount(count);
      } catch (error) {
        // Error silently handled
      }
    };
    
    // Initial fetch
    fetchBugCount();

    // Set up a subscription for real-time updates
    const bugSubscription = supabase
      .channel('bug-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bugs'
      }, () => {
        fetchBugCount();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bugs'
      }, () => {
        fetchBugCount();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'bugs'
      }, () => {
        fetchBugCount();
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(bugSubscription);
    };
  }, [isAdmin]);

  return bugCount;
};
