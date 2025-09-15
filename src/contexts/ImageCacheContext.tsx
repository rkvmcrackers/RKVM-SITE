/**
 * Image Cache Context
 * Global context to prevent multiple instances from loading the same image
 */

import React, { createContext, useContext, useRef, useCallback } from 'react';

interface ImageCacheContextType {
  loadedImages: Set<string>;
  loadingImages: Set<string>;
  isImageLoaded: (url: string) => boolean;
  isImageLoading: (url: string) => boolean;
  markImageAsLoaded: (url: string) => void;
  markImageAsLoading: (url: string) => void;
  markImageAsNotLoading: (url: string) => void;
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined);

export const useImageCacheContext = () => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCacheContext must be used within an ImageCacheProvider');
  }
  return context;
};

interface ImageCacheProviderProps {
  children: React.ReactNode;
}

export const ImageCacheProvider: React.FC<ImageCacheProviderProps> = ({ children }) => {
  const loadedImagesRef = useRef<Set<string>>(new Set());
  const loadingImagesRef = useRef<Set<string>>(new Set());

  const isImageLoaded = useCallback((url: string) => {
    return loadedImagesRef.current.has(url);
  }, []);

  const isImageLoading = useCallback((url: string) => {
    return loadingImagesRef.current.has(url);
  }, []);

  const markImageAsLoaded = useCallback((url: string) => {
    loadedImagesRef.current.add(url);
    loadingImagesRef.current.delete(url);
  }, []);

  const markImageAsLoading = useCallback((url: string) => {
    loadingImagesRef.current.add(url);
  }, []);

  const markImageAsNotLoading = useCallback((url: string) => {
    loadingImagesRef.current.delete(url);
  }, []);

  const value: ImageCacheContextType = {
    loadedImages: loadedImagesRef.current,
    loadingImages: loadingImagesRef.current,
    isImageLoaded,
    isImageLoading,
    markImageAsLoaded,
    markImageAsLoading,
    markImageAsNotLoading,
  };

  return (
    <ImageCacheContext.Provider value={value}>
      {children}
    </ImageCacheContext.Provider>
  );
};
