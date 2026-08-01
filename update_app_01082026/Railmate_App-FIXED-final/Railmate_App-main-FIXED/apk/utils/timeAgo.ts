// utils/timeAgo.ts
//
// Returns a localised "time ago" string.
// When isBengali=true, digits are converted to Bengali numerals.

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

function toBengaliNumerals(value: number): string {
  return String(value)
    .split('')
    .map((ch) => BENGALI_DIGITS[ch] ?? ch)
    .join('');
}

export function timeAgo(
  isoString: string,
  isBengali: boolean,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return t('community.just_now');
  }

  if (diffMinutes < 60) {
    const n = isBengali ? toBengaliNumerals(diffMinutes) : diffMinutes;
    return t('community.min_ago', { n });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  const n = isBengali ? toBengaliNumerals(diffHours) : diffHours;
  return t('community.hour_ago', { n });
}
