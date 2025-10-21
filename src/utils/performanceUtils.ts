export const placementColors: Record<string, string> = {
  'Set 1 Opener': '#047857',
  'Set 1 Closer': '#1e40af',
  'Set 2 Opener': '#10b981',
  'Set 3 Opener': '#10b981',
  'Set 4 Opener': '#10b981',
  'Set 5 Opener': '#10b981',
  'Set 2 Closer': '#3b82f6',
  'Set 3 Closer': '#3b82f6',
  'Set 4 Closer': '#3b82f6',
  'Set 5 Closer': '#3b82f6',
  'Encore 1': '#be123c',
  'Encore 2': '#f43f5e',
  'Encore 3': '#f43f5e'
};

export const formatLength = (length: string | null): string => {
  if (!length) return '';
  const parts = length.split(':').map(part => parseInt(part));
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours === 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return length;
};

export const years = Array.from(
  { length: 2026 - 2012 + 1 },
  (_, i) => 2012 + i
);
