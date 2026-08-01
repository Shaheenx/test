// TIME value from DB (e.g. "06:40:00") → "06:40"
export const formatTime = (time: string | null): string => {
  if (!time) return '--';
  return time.slice(0, 5);
};
