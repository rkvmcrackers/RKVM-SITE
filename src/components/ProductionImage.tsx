import React, { useState, useEffect, useRef } from 'react';
import { productionImageLoader } from '../utils/production-image-loader';

interface ProductionImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const ProductionImage: React.FC<ProductionImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  priority = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(priority);

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
        setCurrentSrc(''); // Clear to show loading state

        // Check if already cached
        const cachedUrl = productionImageLoader.getCachedImage(src);
        if (cachedUrl) {
          setCurrentSrc(cachedUrl);
          setIsLoading(false);
          return;
        }

        // Load image with production optimizations
        const result = await productionImageLoader.loadImage(src);
        setCurrentSrc(result.url);
        setLoadTime(result.loadTime);
        setIsLoading(false);
        
        if (result.loadTime > 0) {
          console.log(`📊 ProductionImage: Loaded ${src} in ${result.loadTime}ms`);
        }
      } catch (error) {
        console.warn(`❌ ProductionImage: Failed to load ${src}:`, error);
        setCurrentSrc(fallbackSrc);
        setHasError(true);
        setIsLoading(false);
      }
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
        rootMargin: '100px', // Load when 100px from viewport
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
      console.warn(`❌ ProductionImage: Image failed to load directly: ${currentSrc}`);
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
          {loadTime > 0 && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
              {loadTime}ms
            </div>
          )}
        </div>
      )}
      
      {isVisible && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
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

export default ProductionImage;
