import React, { useState, useEffect, useRef } from 'react';
import { globalImagePreloader } from '../utils/global-image-preloader';

interface InstantImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const InstantImage: React.FC<InstantImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(priority);

  useEffect(() => {
    const loadImage = () => {
      if (!src) {
        setCurrentSrc(fallbackSrc);
        setIsLoading(false);
        return;
      }

      // Check if image is already cached globally
      const cachedUrl = globalImagePreloader.getCachedImage(src);
      if (cachedUrl) {
        console.log(`⚡ InstantImage: Using cached image for ${src}`);
        setCurrentSrc(cachedUrl);
        setIsLoading(false);
        return;
      }

      // If not cached, try to load it
      setCurrentSrc(src);
      setIsLoading(false);
    };

    // For priority images, load immediately
    if (priority) {
      loadImage();
      return;
    }

    // For non-priority images, use Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            loadImage();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, fallbackSrc, priority]);

  const handleImageError = () => {
    if (!hasError) {
      console.warn(`❌ InstantImage: Image failed to load: ${currentSrc}`);
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      )}
      
      {isVisible && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      )}
      
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default InstantImage;
