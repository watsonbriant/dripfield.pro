import { formatInTimeZone } from 'date-fns-tz';
import { getColumnBackgroundColor } from '../utils/songMatrixUtils';

export const formatShowDate = (showDate: string): string => {
  return formatInTimeZone(
    new Date(showDate),
    'UTC',
    'MM.dd'
  );
};

export const groupShowsByYear = (shows: Array<any>) => {
  if (!shows || shows.length === 0) return [];
  
  const yearGroups = [];
  let currentYear = '';
  let currentGroup = [];
  
  shows.forEach((show, index) => {
    const year = new Date(show.show_date).getFullYear().toString();
    
    if (year !== currentYear) {
      if (currentGroup.length > 0) {
        yearGroups.push({
          year: currentYear,
          shows: currentGroup,
          startIndex: index - currentGroup.length,
          endIndex: index - 1
        });
      }
      currentYear = year;
      currentGroup = [show];
    } else {
      currentGroup.push(show);
    }
  });
  
  // Add the last group
  if (currentGroup.length > 0) {
    yearGroups.push({
      year: currentYear,
      shows: currentGroup,
      startIndex: shows.length - currentGroup.length,
      endIndex: shows.length - 1
    });
  }
  
  return yearGroups;
};

export const getMatrixColumnBackgroundColor = (placement: string | null): string => {
  return getColumnBackgroundColor(placement);
};

export const getLoadingMessage = (isOwnProfile: boolean, username: string | null) => {
  if (isOwnProfile) {
    return "Loading your song matrix...";
  } else {
    return `Loading ${username ? username + "'s" : "their"} song matrix...`;
  }
};

export const getTitle = (songCount: number, isOwnProfile: boolean, username: string | null) => {
  return `${songCount} Songs`;
};

export const getNoShowsMessage = (isOwnProfile: boolean, username: string | null) => {
  if (isOwnProfile) {
    return "No show data available. Add shows you've attended to see your song matrix.";
  } else if (username) {
    return `${username} hasn't attended any shows yet.`;
  } else {
    return "No show data available for this user.";
  }
};

export const getNoSongDataMessage = (isOwnProfile: boolean, username: string | null) => {
  if (isOwnProfile) {
    return "No song data available for your attended shows";
  } else if (username) {
    return `No song data available for ${username}'s attended shows`;
  } else {
    return "No song data available for this user's attended shows";
  }
};

export const getErrorMessage = (errorMessage: string | null, isOwnProfile: boolean, username: string | null) => {
  if (isOwnProfile) {
    return errorMessage || "An error occurred loading your song matrix";
  } else if (username) {
    return `An error occurred loading ${username}'s song matrix`;
  } else {
    return "An error occurred loading the song matrix";
  }
};
