/**
 * Format an ISO date string to a human-readable date.
 * e.g. "2026-06-28T00:00:00.000Z" → "28 Jun 2026"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string to YYYY-MM-DD for <input type="date"> value.
 */
export function toDateInputValue(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format an amount with its currency code.
 * e.g. 649, "INR" → "INR 649.00"
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}
