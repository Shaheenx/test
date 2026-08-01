// 1320 → "৳ 1,320"
export const formatFare = (amount: number): string =>
  `৳ ${amount.toLocaleString('en-BD')}`;
