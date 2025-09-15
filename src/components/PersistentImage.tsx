/**
 * PersistentImage Component
 * Displays images with persistent localStorage caching - never refreshes once loaded
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePersistentImageCache } from '../hooks/usePersistentImageCache';
import { useImageCacheContext } from '../contexts/ImageCacheContext';

interface PersistentImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
}

const PersistentImage: React.FC<PersistentImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  onLoad,
  onError,
  loading = 'lazy',
  style
}) => {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { getCachedImage, isLoading: cacheLoading } = usePersistentImageCache();
  const { isImageLoaded, isImageLoading, markImageAsLoaded, markImageAsLoading, markImageAsNotLoading } = useImageCacheContext();

  // Memoize the image loading function to prevent re-fetching
  const loadImage = useCallback(async (imageUrl: string) => {
    // If already loaded or currently loading, don't reload
    if (isImageLoaded(imageUrl) || isImageLoading(imageUrl)) {
      return;
    }

    // Mark as loading
    markImageAsLoading(imageUrl);
    setIsLoading(true);
    setHasError(false);

    try {
      // Try to get cached image first
      const cachedDataUrl = await getCachedImage(imageUrl);
      
      if (cachedDataUrl) {
        setImageSrc(cachedDataUrl);
        markImageAsLoaded(imageUrl);
        setIsLoading(false);
        onLoad?.();
      } else {
        // If caching failed, fall back to direct URL
        setImageSrc(imageUrl);
        markImageAsLoaded(imageUrl);
        setIsLoading(false);
        onLoad?.();
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load image ${imageUrl}:`, error);
      setHasError(true);
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      onError?.();
    } finally {
      markImageAsNotLoading(imageUrl);
    }
  }, [src, fallbackSrc, getCachedImage, onLoad, onError, isImageLoaded, isImageLoading, markImageAsLoaded, markImageAsLoading, markImageAsNotLoading]);

  useEffect(() => {
    if (!src || src === fallbackSrc) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    // Check if image is already loaded globally
    if (isImageLoaded(src)) {
      // Image is already loaded, just set it
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    loadImage(src);
  }, [src, fallbackSrc, loadImage, isImageLoaded]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Image */}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={style}
      />
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-400 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default PersistentImage;