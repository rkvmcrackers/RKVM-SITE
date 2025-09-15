/**
 * FastImage Component
 * Production-ready component for instant image loading with IndexedDB caching
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageCache } from '../hooks/useImageCache';

interface FastImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  style?: React.CSSProperties;
}

const FastImage: React.FC<FastImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
  onLoad,
  onError,
  placeholder,
  loading = 'lazy',
  sizes,
  style
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { getImage, cachedImages } = useImageCache({
    enableBackgroundSync: true,
    syncInterval: 30000
  });

  /**
   * Load image from cache or fetch
   */
  const loadImage = useCallback(async () => {
    if (!src) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // Try to get image from cache first
      const imageData = await getImage(src);
      
      if (imageData) {
        setCurrentSrc(imageData);
        setIsLoading(false);
        onLoad?.();
      } else {
        // If no image found, show fallback
        setCurrentSrc(fallbackSrc);
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    } catch (error) {
      console.warn('Failed to load image:', src, error);
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [src, fallbackSrc, getImage, onLoad, onError]);

  /**
   * Handle image load success
   */
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  /**
   * Handle image load error
   */
  const handleImageError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [hasError, onError]);

  /**
   * Set up intersection observer for lazy loading
   */
  useEffect(() => {
    if (priority || isVisible) {
      loadImage();
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            loadImage();
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, isVisible, loadImage]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Default placeholder component
   */
  const defaultPlaceholder = (
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
    </div>
  );

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`}
      style={style}
    >
      {/* Loading placeholder */}
      {isLoading && (placeholder || defaultPlaceholder)}
      
      {/* Image */}
      {isVisible && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          decoding="async"
          sizes={sizes}
          style={{
            ...style,
            display: isLoading ? 'none' : 'block'
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default FastImage;
