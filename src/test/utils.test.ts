import { describe, it, expect } from 'vitest';
import { slugify } from '../lib/utils';

describe('slugify', () => {
  it('converts basic string to slug', () => {
    expect(slugify('The Sealed Nectar')).toBe('the-sealed-nectar');
  });

  it('handles special characters', () => {
    expect(slugify('The Sealed Nectar (Hardcover)')).toBe('the-sealed-nectar-hardcover');
  });

  it('handles multiple spaces and hyphens', () => {
    expect(slugify('  The   Sealed -- Nectar  ')).toBe('the-sealed-nectar');
  });

  it('handles lowercase conversion', () => {
    expect(slugify('THE SEALED NECTAR')).toBe('the-sealed-nectar');
  });
});
