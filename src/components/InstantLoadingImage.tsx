import React, { useState, useEffect } from 'react';
import { imageCache } from '../utils/image-cache';

interface InstantLoadingImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const InstantLoadingImage: React.FC<InstantLoadingImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setCurrentSrc(fallbackSrc);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        // Try to get cached image first
        const cachedImage = await imageCache.getCachedImage(src);
        setCurrentSrc(cachedImage);
        setIsLoading(false);
        onLoad?.();
      } catch (error) {
        console.warn(`Failed to load image: ${src}`, error);
        
        // Try fallback
        if (fallbackSrc && fallbackSrc !== src) {
          try {
            const fallbackCached = await imageCache.getCachedImage(fallbackSrc);
            setCurrentSrc(fallbackCached);
            setHasError(true);
            setIsLoading(false);
          } catch (fallbackError) {
            console.warn(`Fallback image also failed: ${fallbackSrc}`, fallbackError);
            setCurrentSrc(fallbackSrc);
            setHasError(true);
            setIsLoading(false);
          }
        } else {
          setCurrentSrc(fallbackSrc);
          setHasError(true);
          setIsLoading(false);
        }
        
        onError?.();
      }
    };

    loadImage();
  }, [src, fallbackSrc, onLoad, onError]);

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      )}
      
      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{ 
          display: isLoading ? 'none' : 'block',
          contentVisibility: 'auto'
        }}
      />
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default InstantLoadingImage;
