// minutes (e.g. 275) → "4h 35m"
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};
