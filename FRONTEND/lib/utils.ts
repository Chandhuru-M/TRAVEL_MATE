/**
 * Delays the execution of a function until after a certain time has passed
 * since the last time it was invoked. Useful for search inputs.
 * @param func - The function to debounce.
 * @param delay - The delay in milliseconds.
 * @returns A debounced version of the function.
 */
export const debounce = <F extends (...args: any[]) => any>(func: F, delay: number): ((...args: Parameters<F>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * Formats a number into a currency string (e.g., 1234.5 => $1,234.50).
 * @param amount - The number to format.
 * @param currency - The currency code (e.g., 'USD').
 * @returns A formatted currency string.
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Capitalizes the first letter of a string.
 * @param s - The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalize = (s: string): string => {
  if (typeof s !== 'string' || s.length === 0) {
    return '';
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};