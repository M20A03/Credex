export const USD_TO_INR = 85;

/** Format a number as ₹12,345 */
export function formatINR(amount: number): string {
  if (amount === 0) return '₹0';
  const rounded = Math.round(amount);
  return '₹' + rounded.toLocaleString('en-IN');
}

/** Format a number as ₹1.2L / ₹2.5Cr for large numbers */
export function formatINRShort(amount: number): string {
  if (amount >= 10_000_000) {
    return '₹' + (amount / 10_000_000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  }
  if (amount >= 100_000) {
    return '₹' + (amount / 100_000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  if (amount >= 1_000) {
    return '₹' + (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return formatINR(amount);
}

/** Convert USD to INR */
export function usdToInr(usd: number): number {
  return Math.round(usd * USD_TO_INR);
}

/** Format annual savings */
export function formatAnnual(monthly: number): string {
  return formatINRShort(monthly * 12);
}
