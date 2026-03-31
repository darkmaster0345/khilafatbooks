/**
 * Optimized Cloudinary URLs for better performance.
 * Applies f_auto, q_auto, dpr_auto, and specified dimensions/fit.
 *
 * @param url The original Cloudinary URL
 * @param widthOrOpts Width as number/string OR options object for w, h, fit
 * @returns The optimized URL with transformation parameters
 */
export function optimizeCloudinaryUrl(
  url: string,
  widthOrOpts: number | string | { w?: number | string; h?: number; fit?: string } = 800
): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url
  if (url.includes('f_auto')) return url // already has transforms, don't touch

  let w: number | string = 800
  let h: number | undefined
  let fit: string | undefined

  if (typeof widthOrOpts === 'object') {
    w = widthOrOpts.w || 'auto'
    h = widthOrOpts.h
    fit = widthOrOpts.fit || 'fill'
  } else {
    w = widthOrOpts
  }

  const transforms = [
    'f_auto',
    'q_auto',
    'dpr_auto',
    `w_${w}`,
    h ? `h_${h}` : null,
    fit ? `c_${fit}` : null,
  ].filter(Boolean).join(',')

  return url.replace('/upload/', `/upload/${transforms}/`)
}
