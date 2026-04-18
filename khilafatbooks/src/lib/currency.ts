/**
 * Format a number as Pakistani Rupees.
 * Assumes product prices in the data file are already in PKR.
 */
export const formatPKR = (amount: number): string => {
  if (amount === 0) return 'FREE';
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
