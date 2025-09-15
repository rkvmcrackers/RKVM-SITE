/**
 * ImageCacheProvider
 * Context provider for managing image cache across the application
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useImageCache } from '../hooks/useImageCache';
import { backgroundSyncService } from '../services/backgroundSyncService';

interface ImageCacheContextType {
  cachedImages: Map<string, string>;
  isLoading: boolean;
  isBackgroundSyncing: boolean;
  error: string | null;
  getImage: (url: string) => Promise<string | null>;
  preloadImages: (urls: string[]) => Promise<void>;
  getCacheStats: () => Promise<any>;
  clearCache: () => Promise<void>;
}

const ImageCacheContext = createContext<ImageCacheContextType | null>(null);

interface ImageCacheProviderProps {
  children: React.ReactNode;
  imageUrls: string[];
  enableBackgroundSync?: boolean;
  syncInterval?: number;
}

export const ImageCacheProvider: React.FC<ImageCacheProviderProps> = ({
  children,
  imageUrls,
  enableBackgroundSync = true,
  syncInterval = 30000
}) => {
  const {
    cachedImages,
    isLoading,
    isBackgroundSyncing,
    error,
    getImage,
    preloadImages,
    initializeCache,
    getCacheStats,
    clearCache
  } = useImageCache({
    enableBackgroundSync,
    syncInterval,
    onBackgroundSyncComplete: (newImagesCount) => {
      if (newImagesCount > 0) {
        console.log(`🔄 Background sync completed: ${newImagesCount} new images cached`);
      }
    }
  });

  // Initialize cache on mount
  useEffect(() => {
    if (imageUrls.length > 0) {
      initializeCache(imageUrls);
    }
  }, [imageUrls, initializeCache]);

  // Start background sync
  useEffect(() => {
    if (enableBackgroundSync && imageUrls.length > 0) {
      const startBackgroundSync = () => {
        backgroundSyncService.startSync(imageUrls, {
          batchSize: 5,
          delayBetweenBatches: 100,
          onProgress: (processed, total) => {
            // Silent progress tracking
          },
          onComplete: (newImagesCount) => {
            if (newImagesCount > 0) {
              console.log(`✅ Background sync: ${newImagesCount} new images cached`);
            }
          },
          onError: (error) => {
            console.warn('Background sync error:', error);
          }
        });
      };

      // Start initial sync
      startBackgroundSync();

      // Set up periodic sync
      const interval = setInterval(startBackgroundSync, syncInterval);

      return () => {
        clearInterval(interval);
        backgroundSyncService.stopSync();
      };
    }
  }, [enableBackgroundSync, imageUrls, syncInterval]);

  const contextValue: ImageCacheContextType = {
    cachedImages,
    isLoading,
    isBackgroundSyncing,
    error,
    getImage,
    preloadImages,
    getCacheStats,
    clearCache
  };

  return (
    <ImageCacheContext.Provider value={contextValue}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export const useImageCacheContext = (): ImageCacheContextType => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCacheContext must be used within an ImageCacheProvider');
  }
  return context;
};
