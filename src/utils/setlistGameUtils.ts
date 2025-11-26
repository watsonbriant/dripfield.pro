export const formatDate = (dateString: string) => {
  return dateString
    .split('-')
    .slice(1)
    .concat(dateString.substring(2, 4))
    .join('.');
};
