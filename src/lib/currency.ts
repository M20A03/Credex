export const USD_TO_INR = 85;

export type Currency = 'INR' | 'USD';

/** Format a number as ₹12,345 or $145 based on selected currency */
export function formatCurrency(amountINR: number, currency: Currency = 'INR'): string {
  if (amountINR === 0) return currency === 'INR' ? '₹0' : '$0';
  
  if (currency === 'USD') {
    const usdAmount = Math.round(amountINR / USD_TO_INR);
    return '$' + usdAmount.toLocaleString('en-US');
  }

  const rounded = Math.round(amountINR);
  return '₹' + rounded.toLocaleString('en-IN');
}

/** Format short notation: ₹1.2L / $1.4K for large numbers */
export function formatCurrencyShort(amountINR: number, currency: Currency = 'INR'): string {
  if (currency === 'USD') {
    const usd = amountINR / USD_TO_INR;
    if (usd >= 1_000_000) {
      return '$' + (usd / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (usd >= 1_000) {
      return '$' + (usd / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return '$' + Math.round(usd).toLocaleString('en-US');
  }

  // INR Notation
  if (amountINR >= 10_000_000) {
    return '₹' + (amountINR / 10_000_000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  }
  if (amountINR >= 100_000) {
    return '₹' + (amountINR / 100_000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  if (amountINR >= 1_000) {
    return '₹' + (amountINR / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return formatCurrency(amountINR, 'INR');
}

/** Legacy aliases for backwards compatibility */
export function formatINR(amount: number): string {
  return formatCurrency(amount, 'INR');
}

export function formatINRShort(amount: number): string {
  return formatCurrencyShort(amount, 'INR');
}

/** Convert USD to INR */
export function usdToInr(usd: number): number {
  return Math.round(usd * USD_TO_INR);
}

/** Convert INR to USD */
export function inrToUsd(inr: number): number {
  return Math.round(inr / USD_TO_INR);
}
