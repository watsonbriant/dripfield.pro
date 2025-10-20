export const getUserGuestsMessages = (isOwnProfile: boolean, username: string | null, error?: string | null) => {
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading personnel data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} personnel data...`;
    }
  };

  const getErrorMessage = () => {
    if (isOwnProfile) {
      return error || "Failed to load personnel data";
    } else if (username) {
      return `Failed to load ${username}'s personnel data`;
    } else {
      return "Failed to load personnel data";
    }
  };

  const getEmptyStateMessage = () => {
    if (isOwnProfile) {
      return "You haven't seen any shows with personnel yet.";
    } else if (username) {
      return `${username} hasn't seen any shows with personnel yet.`;
    } else {
      return "This user hasn't seen any shows with personnel yet.";
    }
  };

  return {
    getLoadingMessage,
    getErrorMessage,
    getEmptyStateMessage
  };
};
