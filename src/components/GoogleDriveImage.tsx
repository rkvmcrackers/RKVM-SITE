import React, { useState, useEffect, useRef } from 'react';
import { GoogleDriveProxy } from '../utils/google-drive-proxy';

interface GoogleDriveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const GoogleDriveImage: React.FC<GoogleDriveImageProps> = ({
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
  const [attemptCount, setAttemptCount] = useState<number>(0);

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

        // Get proxy strategies for Google Drive images
        const strategies = GoogleDriveProxy.getProxyStrategies(src);
        
        // Try each strategy
        for (let i = 0; i < strategies.length; i++) {
          const strategyUrl = strategies[i];
          
          try {
            console.log(`🔄 GoogleDriveImage: Trying strategy ${i + 1}/${strategies.length}: ${strategyUrl}`);
            
            // Create a new image element to test loading
            const testImg = new Image();
            
            const loadPromise = new Promise<string>((resolve, reject) => {
              testImg.onload = () => {
                console.log(`✅ GoogleDriveImage: Successfully loaded: ${strategyUrl}`);
                resolve(strategyUrl);
              };
              
              testImg.onerror = () => {
                console.warn(`❌ GoogleDriveImage: Failed to load: ${strategyUrl}`);
                reject(new Error(`Failed to load ${strategyUrl}`));
              };
              
              // Set crossOrigin for CORS
              testImg.crossOrigin = 'anonymous';
              testImg.src = strategyUrl;
            });

            const loadedUrl = await loadPromise;
            setCurrentSrc(loadedUrl);
            setIsLoading(false);
            setAttemptCount(i + 1);
            return; // Success, exit the loop
            
          } catch (error) {
            console.warn(`❌ GoogleDriveImage: Strategy ${i + 1} failed:`, error);
            continue; // Try next strategy
          }
        }

        // If all strategies failed
        throw new Error('All loading strategies failed');

      } catch (error) {
        console.warn(`❌ GoogleDriveImage: Failed to load ${src}:`, error);
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
      console.warn(`❌ GoogleDriveImage: Image failed to load: ${currentSrc}`);
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
          {attemptCount > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              Trying {attemptCount}...
            </div>
          )}
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
          crossOrigin="anonymous"
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

export default GoogleDriveImage;
