import React, { useState, useEffect } from 'react';
import { getImageFallbacks } from '../utils/simple-image-proxy';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/placeholder.svg',
  onError,
  onLoad
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbacks = getImageFallbacks(src);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setFallbackIndex(0);
  }, [src]);

  const handleError = () => {
    console.log(`Image failed to load: ${currentSrc}`);
    
    if (fallbackIndex < fallbacks.length - 1) {
      // Try next fallback
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setCurrentSrc(fallbacks[nextIndex]);
      console.log(`Trying fallback ${nextIndex + 1}/${fallbacks.length}: ${fallbacks[nextIndex]}`);
    } else if (currentSrc !== fallbackSrc) {
      // Try final fallback
      console.log(`Trying final fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    } else {
      // All fallbacks failed
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    console.log(`Image loaded successfully: ${currentSrc}`);
    setIsLoading(false);
    onLoad?.();
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-xs">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default ImageWithFallback;
