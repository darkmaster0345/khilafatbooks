import { describe, it, expect } from 'vitest';
import { formatPKR } from '../lib/currency';

describe('formatPKR', () => {
  it('formats positive amounts correctly', () => {
    expect(formatPKR(1500)).toBe('Rs. 1,500');
    expect(formatPKR(5000)).toBe('Rs. 5,000');
  });

  it('returns "FREE" for zero amount', () => {
    expect(formatPKR(0)).toBe('FREE');
  });

  it('formats large amounts correctly', () => {
    expect(formatPKR(1000000)).toBe('Rs. 1,000,000');
  });
});
