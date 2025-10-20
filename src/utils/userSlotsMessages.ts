export const getUserSlotsMessages = (isOwnProfile: boolean | null, username: string | null) => {
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading slots data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} slots data...`;
    }
  };

  const getTitle = () => {
    if (isOwnProfile) {
      return "My Slots";
    } else if (username) {
      return `Slots`;
    } else {
      return "Slots";
    }
  };

  const getNoUserMessage = () => {
    if (isOwnProfile) {
      return "Please log in to view your slots.";
    } else {
      return "User data not available.";
    }
  };

  const getNoShowsMessage = () => {
    if (isOwnProfile) {
      return "You haven't marked any shows as attended yet.";
    } else if (username) {
      return `${username} hasn't marked any shows as attended yet.`;
    } else {
      return "This user hasn't marked any shows as attended yet.";
    }
  };

  const getNoSlotsMessage = () => {
    if (isOwnProfile) {
      return "No slots data found for your attended shows.";
    } else if (username) {
      return `No slots data found for ${username}'s attended shows.`;
    } else {
      return "No slots data found for this user's attended shows.";
    }
  };

  return {
    getLoadingMessage,
    getTitle,
    getNoUserMessage,
    getNoShowsMessage,
    getNoSlotsMessage
  };
};
