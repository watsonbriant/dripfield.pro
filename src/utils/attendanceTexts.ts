export const getAttendanceTexts = (isOwnProfile: boolean, username?: string | null) => {
  const getTitle = () => {
    if (isOwnProfile) {
      return "Attendance Stats";
    } else if (username) {
      return `Attendance Stats`;
    } else {
      return "Attendance Stats";
    }
  };

  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading stats...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} stats...`;
    }
  };

  const getShowsLabel = () => {
    return "Shows Attended";
  };

  const getVenuesLabel = () => {
    return "Venues Visited";
  };

  const getSongsLabel = () => {
    return "Songs Seen";
  };

  const getToursLabel = () => {
    return "Tours Attended";
  };

  const getNoToursMessage = () => {
    if (isOwnProfile) {
      return "No tour data available";
    } else if (username) {
      return `${username} hasn't attended any tours yet`;
    } else {
      return "No tour data available";
    }
  };

  return {
    getTitle,
    getLoadingMessage,
    getShowsLabel,
    getVenuesLabel,
    getSongsLabel,
    getToursLabel,
    getNoToursMessage,
  };
};
