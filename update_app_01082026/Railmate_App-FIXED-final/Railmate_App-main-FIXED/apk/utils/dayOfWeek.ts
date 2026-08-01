// utility to get day of week (0-6) from a date.
export const getDayOfWeek = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
};
