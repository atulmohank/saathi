export const REFILL_THRESHOLD_DAYS = 3;

export function forecastRefill(stockCount: number, dosesPerDay: number): { daysLeft: number; needsRefill: boolean } {
  const stock = Math.max(0, Math.floor(stockCount));
  if (dosesPerDay <= 0) return { daysLeft: Infinity, needsRefill: false };
  const daysLeft = Math.floor(stock / dosesPerDay);
  return { daysLeft, needsRefill: daysLeft <= REFILL_THRESHOLD_DAYS };
}
