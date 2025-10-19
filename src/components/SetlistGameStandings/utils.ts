import { PlayerStats, SortField, SortDirection } from './types';

export const sortStandings = (
  data: PlayerStats[], 
  field: SortField, 
  direction: SortDirection
): PlayerStats[] => {
  return [...data].sort((a, b) => {
    // Primary sort by the selected field and direction
    let comparison = 0;
    
    if (a[field] < b[field]) {
      comparison = -1;
    } else if (a[field] > b[field]) {
      comparison = 1;
    }
    
    // Apply the selected sort direction
    comparison = direction === 'asc' ? comparison : -comparison;
    
    // If items are equal on the primary sort field, apply the tiebreaker rules
    if (comparison === 0) {
      // If we're not already sorting by totalPoints, use it as first tiebreaker (descending)
      if (field !== 'totalPoints') {
        if (a.totalPoints > b.totalPoints) return -1;
        if (a.totalPoints < b.totalPoints) return 1;
      }
      
      // If we're not already sorting by avgPointsPerShow, use it as second tiebreaker (descending)
      if (field !== 'avgPointsPerShow') {
        if (a.avgPointsPerShow > b.avgPointsPerShow) return -1;
        if (a.avgPointsPerShow < b.avgPointsPerShow) return 1;
      }
      
      // If we're not already sorting by songsPicked, use it as third tiebreaker (descending)
      if (field !== 'songsPicked') {
        if (a.songsPicked > b.songsPicked) return -1;
        if (a.songsPicked < b.songsPicked) return 1;
      }
      
      // Finally, sort alphabetically by username as the last tiebreaker
      return a.username.localeCompare(b.username);
    }
    
    return comparison;
  });
};
