import { describe, it, expect } from 'vitest';
import { optimizeCloudinaryUrl } from '../lib/cloudinary';

describe('optimizeCloudinaryUrl', () => {
  it('should return empty string for null/empty url', () => {
    expect(optimizeCloudinaryUrl('')).toBe('');
  });

  it('should return original url if not a Cloudinary URL', () => {
    const url = 'https://example.com/image.jpg';
    expect(optimizeCloudinaryUrl(url)).toBe(url);
  });

  it('should add transforms to a standard Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto,w_800/sample.jpg';
    expect(optimizeCloudinaryUrl(url)).toBe(expected);
  });

  it('should not double-apply transforms', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400/sample.jpg';
    expect(optimizeCloudinaryUrl(url)).toBe(url);
  });

  it('should use custom width', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto,w_1200/sample.jpg';
    expect(optimizeCloudinaryUrl(url, 1200)).toBe(expected);
  });

  it('should support options object', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const expected = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto,w_400,h_500,c_fill/sample.jpg';
    expect(optimizeCloudinaryUrl(url, { w: 400, h: 500, fit: 'fill' })).toBe(expected);
  });
});
