export const REFILL_THRESHOLD_DAYS = 3;

/** Days of stock left and whether a refill is due (≤ 3 days). */
export function forecastRefill(stockCount: number, dosesPerDay: number): { daysLeft: number; needsRefill: boolean } {
  const stock = Math.max(0, Math.floor(stockCount));
  if (dosesPerDay <= 0) return { daysLeft: Infinity, needsRefill: false };
  const daysLeft = Math.floor(stock / dosesPerDay);
  return { daysLeft, needsRefill: daysLeft <= REFILL_THRESHOLD_DAYS };
}
