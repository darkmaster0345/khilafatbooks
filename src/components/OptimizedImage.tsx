import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
  placeholder?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Optimized image component with:
 * - Native lazy loading
 * - srcSet for responsive Cloudinary images
 * - Blur-up placeholder effect
 * - Graceful fallback on error
 */
const OptimizedImage = ({
  src,
  alt,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  placeholder,
  onClick,
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If image is already cached, mark as loaded
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {/* Blur placeholder */}
      {placeholder && !loaded && !error && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}
      <img
        ref={imgRef}
        src={error ? '/placeholder.svg' : src}
        srcSet={error ? undefined : srcSet || undefined}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default OptimizedImage;
