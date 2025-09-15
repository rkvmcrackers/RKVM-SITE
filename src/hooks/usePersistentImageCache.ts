/**
 * usePersistentImageCache Hook
 * Stores images in localStorage and never refreshes them once loaded
 */

import { useState, useEffect, useCallback } from 'react';

interface CachedImage {
  dataUrl: string;
  timestamp: number;
  size: number;
}

interface UsePersistentImageCacheOptions {
  maxCacheSize?: number; // in MB
  cacheExpiry?: number; // in days
}

const DEFAULT_MAX_CACHE_SIZE = 50; // 50MB
const DEFAULT_CACHE_EXPIRY = 365; // 1 year

export const usePersistentImageCache = (options: UsePersistentImageCacheOptions = {}) => {
  const [cachedImages, setCachedImages] = useState<Map<string, CachedImage>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    maxCacheSize = DEFAULT_MAX_CACHE_SIZE,
    cacheExpiry = DEFAULT_CACHE_EXPIRY
  } = options;

  // Load cached images from localStorage on mount
  useEffect(() => {
    const loadCachedImages = () => {
      try {
        const cached = localStorage.getItem('persistentImageCache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const imageMap = new Map<string, CachedImage>();
          
          // Check for expired entries
          const now = Date.now();
          const expiryTime = cacheExpiry * 24 * 60 * 60 * 1000; // Convert days to ms
          
          Object.entries(parsedCache).forEach(([url, data]: [string, any]) => {
            if (now - data.timestamp < expiryTime) {
              imageMap.set(url, data);
            }
          });
          
          setCachedImages(imageMap);
          console.log(`📦 Loaded ${imageMap.size} cached images from localStorage`);
        }
      } catch (err) {
        console.error('❌ Error loading cached images:', err);
        setError('Failed to load cached images');
      }
    };

    loadCachedImages();
  }, [cacheExpiry]);

  // Save images to localStorage
  const saveToStorage = useCallback((imageMap: Map<string, CachedImage>) => {
    try {
      const cacheObject: Record<string, CachedImage> = {};
      imageMap.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      localStorage.setItem('persistentImageCache', JSON.stringify(cacheObject));
      console.log(`💾 Saved ${imageMap.size} images to localStorage`);
    } catch (err) {
      console.error('❌ Error saving to localStorage:', err);
      setError('Failed to save images to cache');
    }
  }, []);

  // Clean up old cache entries if size limit exceeded
  const cleanupCache = useCallback((imageMap: Map<string, CachedImage>) => {
    const maxSizeBytes = maxCacheSize * 1024 * 1024; // Convert MB to bytes
    let totalSize = 0;
    
    // Calculate total size
    imageMap.forEach((image) => {
      totalSize += image.size;
    });
    
    if (totalSize > maxSizeBytes) {
      console.log(`🧹 Cache size ${Math.round(totalSize / 1024 / 1024)}MB exceeds limit ${maxCacheSize}MB, cleaning up...`);
      
      // Sort by timestamp (oldest first)
      const sortedEntries = Array.from(imageMap.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries until under limit
      const newMap = new Map<string, CachedImage>();
      let currentSize = 0;
      
      for (const [url, image] of sortedEntries) {
        if (currentSize + image.size <= maxSizeBytes) {
          newMap.set(url, image);
          currentSize += image.size;
        }
      }
      
      console.log(`🧹 Cleaned up cache: ${imageMap.size} → ${newMap.size} images`);
      return newMap;
    }
    
    return imageMap;
  }, [maxCacheSize]);

  // Convert image URL to data URL
  const convertToDataUrl = useCallback(async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert to data URL'));
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`⚠️ Failed to fetch image ${url}:`, err);
      return null;
    }
  }, []);

  // Get cached image or fetch and cache it
  const getCachedImage = useCallback(async (url: string): Promise<string | null> => {
    // Check if already cached in memory
    if (cachedImages.has(url)) {
      console.log(`⚡ Using memory cached image: ${url}`);
      return cachedImages.get(url)!.dataUrl;
    }

    // Check localStorage for persistent cache
    try {
      const cached = localStorage.getItem('persistentImageCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache[url]) {
          const cachedImage = parsedCache[url];
          const now = Date.now();
          const expiryTime = cacheExpiry * 24 * 60 * 60 * 1000;
          
          if (now - cachedImage.timestamp < expiryTime) {
            console.log(`💾 Using persistent cached image: ${url}`);
            // Add to memory cache for faster access
            setCachedImages(prev => new Map(prev).set(url, cachedImage));
            return cachedImage.dataUrl;
          } else {
            // Remove expired entry
            delete parsedCache[url];
            localStorage.setItem('persistentImageCache', JSON.stringify(parsedCache));
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Error reading from localStorage:', err);
    }

    // Image not cached, fetch it
    console.log(`🔄 Fetching new image: ${url}`);
    setIsLoading(true);
    setError(null);

    try {
      const dataUrl = await convertToDataUrl(url);
      if (dataUrl) {
        const imageData: CachedImage = {
          dataUrl,
          timestamp: Date.now(),
          size: dataUrl.length // Approximate size
        };

        // Add to memory cache
        setCachedImages(prev => {
          const newMap = new Map(prev).set(url, imageData);
          const cleanedMap = cleanupCache(newMap);
          saveToStorage(cleanedMap);
          return cleanedMap;
        });

        console.log(`✅ Cached new image: ${url}`);
        return dataUrl;
      }
    } catch (err) {
      console.error(`❌ Failed to cache image ${url}:`, err);
      setError(`Failed to load image: ${url}`);
    } finally {
      setIsLoading(false);
    }

    return null;
  }, [cachedImages, convertToDataUrl, cleanupCache, saveToStorage, cacheExpiry]);

  // Clear all cached images
  const clearCache = useCallback(() => {
    setCachedImages(new Map());
    localStorage.removeItem('persistentImageCache');
    console.log('🗑️ Cleared all cached images');
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    let totalSize = 0;
    cachedImages.forEach((image) => {
      totalSize += image.size;
    });

    return {
      totalImages: cachedImages.size,
      totalSize: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      maxSizeMB: maxCacheSize
    };
  }, [cachedImages, maxCacheSize]);

  return {
    getCachedImage,
    clearCache,
    getCacheStats,
    isLoading,
    error,
    cachedImagesCount: cachedImages.size
  };
};
