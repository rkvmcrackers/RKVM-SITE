/**
 * useImageCache Hook
 * React hook for fast image caching and background sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { imageCacheService } from '../services/imageCacheService';

interface ImageCacheState {
  cachedImages: Map<string, string>;
  isLoading: boolean;
  isBackgroundSyncing: boolean;
  error: string | null;
}

interface UseImageCacheOptions {
  enableBackgroundSync?: boolean;
  syncInterval?: number; // in milliseconds
  onImageLoaded?: (url: string) => void;
  onBackgroundSyncComplete?: (newImagesCount: number) => void;
}

export const useImageCache = (options: UseImageCacheOptions = {}) => {
  const {
    enableBackgroundSync = true,
    syncInterval = 30000, // 30 seconds
    onImageLoaded,
    onBackgroundSyncComplete
  } = options;

  const [state, setState] = useState<ImageCacheState>({
    cachedImages: new Map(),
    isLoading: false,
    isBackgroundSyncing: false,
    error: null
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  /**
   * Load image from cache or fetch from API
   */
  const loadImage = useCallback(async (url: string): Promise<string | null> => {
    if (!url) return null;

    // Check if already in memory cache
    if (state.cachedImages.has(url)) {
      return state.cachedImages.get(url)!;
    }

    // Check IndexedDB cache
    try {
      const cachedDataUrl = await imageCacheService.getCachedImage(url);
      if (cachedDataUrl) {
        // Update memory cache
        setState(prev => ({
          ...prev,
          cachedImages: new Map(prev.cachedImages).set(url, cachedDataUrl)
        }));
        onImageLoaded?.(url);
        return cachedDataUrl;
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }

    return null;
  }, [state.cachedImages, onImageLoaded]);

  /**
   * Fetch image from API and cache it
   */
  const fetchAndCacheImage = useCallback(async (url: string): Promise<string | null> => {
    if (!url) return null;

    try {
      // Try multiple strategies for different image sources
      const strategies = getImageFetchStrategies(url);
      
      for (const strategy of strategies) {
        try {
          const response = await fetch(strategy.url, strategy.options);
          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await blobToDataUrl(blob);
            
            // Cache the image
            await imageCacheService.cacheImage(url, dataUrl);
            
            // Update memory cache
            setState(prev => ({
              ...prev,
              cachedImages: new Map(prev.cachedImages).set(url, dataUrl)
            }));
            
            onImageLoaded?.(url);
            return dataUrl;
          }
        } catch (error) {
          continue; // Try next strategy
        }
      }

      throw new Error('All fetch strategies failed');
    } catch (error) {
      console.warn('Failed to fetch image:', url, error);
      return null;
    }
  }, [onImageLoaded]);

  /**
   * Get image (from cache or fetch)
   */
  const getImage = useCallback(async (url: string): Promise<string | null> => {
    // First try to load from cache
    const cachedImage = await loadImage(url);
    if (cachedImage) {
      return cachedImage;
    }

    // If not in cache, fetch and cache it
    return await fetchAndCacheImage(url);
  }, [loadImage, fetchAndCacheImage]);

  /**
   * Preload multiple images
   */
  const preloadImages = useCallback(async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load from cache first (instant)
      const cachePromises = urls.map(url => loadImage(url));
      await Promise.allSettled(cachePromises);

      // Fetch missing images in background
      const missingUrls = urls.filter(url => !state.cachedImages.has(url));
      if (missingUrls.length > 0) {
        const fetchPromises = missingUrls.map(url => fetchAndCacheImage(url));
        await Promise.allSettled(fetchPromises);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to preload images' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [loadImage, fetchAndCacheImage, state.cachedImages]);

  /**
   * Background sync - check for new images
   */
  const backgroundSync = useCallback(async (imageUrls: string[]): Promise<void> => {
    if (!enableBackgroundSync || imageUrls.length === 0) return;

    setState(prev => ({ ...prev, isBackgroundSyncing: true }));

    try {
      let newImagesCount = 0;
      const batchSize = 5; // Process in small batches

      for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (url) => {
          const isCached = await imageCacheService.isImageCached(url);
          if (!isCached) {
            const fetched = await fetchAndCacheImage(url);
            if (fetched) newImagesCount++;
          }
        });

        await Promise.allSettled(batchPromises);
        
        // Small delay between batches to avoid overwhelming the browser
        if (i + batchSize < imageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      onBackgroundSyncComplete?.(newImagesCount);
    } catch (error) {
      console.warn('Background sync failed:', error);
    } finally {
      setState(prev => ({ ...prev, isBackgroundSyncing: false }));
    }
  }, [enableBackgroundSync, fetchAndCacheImage, onBackgroundSyncComplete]);

  /**
   * Initialize cache and start background sync
   */
  const initializeCache = useCallback(async (imageUrls: string[]): Promise<void> => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      // Initialize IndexedDB
      await imageCacheService.initialize();
      
      // Load all cached images into memory
      const cachedUrls = await imageCacheService.getAllCachedUrls();
      const cachedImages = new Map<string, string>();
      
      for (const url of cachedUrls) {
        const dataUrl = await imageCacheService.getCachedImage(url);
        if (dataUrl) {
          cachedImages.set(url, dataUrl);
        }
      }

      setState(prev => ({
        ...prev,
        cachedImages,
        isLoading: false
      }));

      // Start background sync
      if (enableBackgroundSync) {
        backgroundSync(imageUrls);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to initialize cache' }));
    }
  }, [enableBackgroundSync, backgroundSync]);

  /**
   * Start periodic background sync
   */
  useEffect(() => {
    if (!enableBackgroundSync) return;

    const startPeriodicSync = (imageUrls: string[]) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        backgroundSync(imageUrls);
        startPeriodicSync(imageUrls); // Schedule next sync
      }, syncInterval);
    };

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [enableBackgroundSync, syncInterval, backgroundSync]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    return await imageCacheService.getCacheStats();
  }, []);

  /**
   * Clear all cache
   */
  const clearCache = useCallback(async () => {
    await imageCacheService.clearCache();
    setState(prev => ({
      ...prev,
      cachedImages: new Map(),
      error: null
    }));
  }, []);

  return {
    ...state,
    loadImage,
    fetchAndCacheImage,
    getImage,
    preloadImages,
    backgroundSync,
    initializeCache,
    getCacheStats,
    clearCache
  };
};

/**
 * Get image fetch strategies based on URL
 */
function getImageFetchStrategies(url: string): Array<{url: string, options: RequestInit}> {
  const strategies = [];

  // Strategy 1: Direct fetch
  strategies.push({
    url,
    options: {
      mode: 'cors',
      cache: 'force-cache',
      headers: {
        'Accept': 'image/*,*/*'
      }
    }
  });

  // Strategy 2: Proxy for external images
  if (!url.startsWith('/') && !url.startsWith('data:')) {
    strategies.push({
      url: `https://images.weserv.nl/?url=${encodeURIComponent(url)}&q=85&f=webp`,
      options: {
        mode: 'cors',
        cache: 'force-cache',
        headers: {
          'Accept': 'image/webp,image/*,*/*'
        }
      }
    });
  }

  // Strategy 3: Alternative proxy
  if (!url.startsWith('/') && !url.startsWith('data:')) {
    strategies.push({
      url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
      options: {
        mode: 'cors',
        cache: 'force-cache',
        headers: {
          'Accept': 'image/*,*/*'
        }
      }
    });
  }

  return strategies;
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
