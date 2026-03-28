import { describe, it, expect } from 'vitest';
import { truncateDescription } from '../lib/seo';

describe('truncateDescription', () => {
  it('does not truncate short strings', () => {
    const text = 'Short description';
    expect(truncateDescription(text)).toBe(text);
  });

  it('truncates long strings at word boundary', () => {
    const text = 'This is a very long description that should be truncated at a word boundary to ensure it does not cut off in the middle of a word and looks professional in search results.';
    const truncated = truncateDescription(text);
    expect(truncated.length).toBeLessThanOrEqual(160);
    expect(truncated.endsWith('...')).toBe(true);
    // Ensure no partial word before ...
    const withoutEllipsis = truncated.slice(0, -3);
    expect(text.startsWith(withoutEllipsis)).toBe(true);
    expect(text[withoutEllipsis.length]).toBe(' ');
  });
});
