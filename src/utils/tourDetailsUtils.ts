// Format date for display (MM.DD.YY)
export const formatDate = (dateString: string): string => {
    return dateString
        .split('-')
        .slice(1)
        .concat(dateString.substring(2, 4))
        .join('.');
};

// Get background color for show rows based on scoring status
export const getShowRowBgColor = (showScored: boolean): string => {
    return showScored ? 'bg-canvas' : 'bg-primary';
};

// Get text color for over/under picks based on value
export const getOverUnderTextColor = (averageOverUnder: number | undefined, showScored: boolean): string => {
    if (!showScored || averageOverUnder === undefined) return 'text-fifth';
    if (averageOverUnder > 0) return 'text-red-600';
    if (averageOverUnder < 0) return 'text-green-600';
    return 'text-fifth';
};

// Format over/under value with appropriate sign
export const formatOverUnderValue = (averageOverUnder: number | undefined, showScored: boolean): string => {
    if (!showScored || averageOverUnder === undefined) return '-';
    return (averageOverUnder > 0 ? '+' : '') + averageOverUnder.toFixed(2);
};
