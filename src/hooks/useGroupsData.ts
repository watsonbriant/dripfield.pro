import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Show {
  show_id: string;
  show_group: string;
}

interface GroupCount {
  group: string;
  count: number;
}

export function useGroupsData(shows: Show[]) {
  const [groups, setGroups] = useState<GroupCount[]>([]);

  useEffect(() => {
    const groupCounts: Record<string, number> = {};
    
    shows.forEach(show => {
      const group = show.show_group;
      if (group) {
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      }
    });
    
    const groupsArray: GroupCount[] = Object.entries(groupCounts)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => a.group.localeCompare(b.group));
    
    setGroups(groupsArray);
  }, [shows]);

  return { groups };
}
