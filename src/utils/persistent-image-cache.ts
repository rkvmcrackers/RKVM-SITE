/**
 * Persistent Image Cache
 * Stores images permanently in localStorage and IndexedDB
 * Only fetches new images, keeps existing cached ones
 */

import { Product } from '../types/product';

interface CachedImage {
  url: string;
  dataUrl: string;
  timestamp: number;
  version: string;
  size: number;
}

interface CacheStats {
  totalImages: number;
  cachedImages: number;
  newImages: number;
  failedImages: number;
  cacheSize: number;
}

class PersistentImageCache {
  private memoryCache = new Map<string, CachedImage>();
  private loadingPromises = new Map<string, Promise<string>>();
  private readonly CACHE_VERSION = '1.0.0';
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB for large image storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.loadFromStorage();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
    });
  }

  /**
   * Load existing cache from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem('imageCache');
      if (stored) {
        const cache = JSON.parse(stored);
        if (cache.version === this.CACHE_VERSION) {
          Object.entries(cache.images).forEach(([url, data]: [string, any]) => {
            this.memoryCache.set(url, data);
          });
          console.log(`📦 PersistentImageCache: Loaded ${this.memoryCache.size} images from localStorage`);
        }
      }

      // Load from IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
          request.result.forEach((item: CachedImage) => {
            if (!this.memoryCache.has(item.url)) {
              this.memoryCache.set(item.url, item);
            }
          });
          console.log(`📦 PersistentImageCache: Loaded ${request.result.length} images from IndexedDB`);
        };
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      // Save to localStorage
      const cache = {
        version: this.CACHE_VERSION,
        images: Object.fromEntries(this.memoryCache)
      };
      localStorage.setItem('imageCache', JSON.stringify(cache));

      // Save to IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        for (const [url, data] of this.memoryCache) {
          store.put(data);
        }
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Get cached image or load and cache it
   */
  async getCachedImage(url: string): Promise<string> {
    // Check memory cache first
    if (this.memoryCache.has(url)) {
      const cached = this.memoryCache.get(url)!;
      console.log(`⚡ PersistentImageCache: Using cached image for ${url}`);
      return cached.dataUrl;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.loadAndCacheImage(url);
    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  /**
   * Load image and cache it permanently
   */
  private async loadAndCacheImage(url: string): Promise<string> {
    try {
      const strategies = this.getLoadStrategies(url);
      
      for (const strategy of strategies) {
        try {
          const response = await fetch(strategy.url, strategy.options);
          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await this.blobToDataUrl(blob);
            
            // Cache the image
            const cached: CachedImage = {
              url,
              dataUrl,
              timestamp: Date.now(),
              version: this.CACHE_VERSION,
              size: blob.size
            };

            this.memoryCache.set(url, cached);
            await this.saveToStorage();
            
            console.log(`✅ PersistentImageCache: Cached new image ${url}`);
            return dataUrl;
          }
        } catch (error) {
          continue; // Try next strategy
        }
      }

      throw new Error(`All strategies failed for ${url}`);
    } catch (error) {
      console.warn(`Failed to load image ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get loading strategies
   */
  private getLoadStrategies(url: string): Array<{url: string, options: RequestInit}> {
    const strategies = [];

    // Strategy 1: Direct load
    strategies.push({
      url: url,
      options: {
        mode: 'cors',
        cache: 'force-cache',
        headers: {
          'Accept': 'image/*,*/*',
          'Cache-Control': 'max-age=31536000'
        }
      }
    });

    // Strategy 2: Proxy with compression
    if (!url.startsWith('/') && !url.startsWith('data:')) {
      strategies.push({
        url: `https://images.weserv.nl/?url=${encodeURIComponent(url)}&q=85&f=webp&output=webp`,
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
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Preload all product images (only new ones)
   */
  async preloadAllImages(products: Product[]): Promise<CacheStats> {
    if (!this.isInitialized) {
      await this.initializeDB();
    }

    const imageUrls = this.extractImageUrls(products);
    const stats: CacheStats = {
      totalImages: imageUrls.length,
      cachedImages: 0,
      newImages: 0,
      failedImages: 0,
      cacheSize: 0
    };

    console.log(`🚀 PersistentImageCache: Starting preload of ${imageUrls.length} images...`);

    // Check which images are already cached
    const newUrls = imageUrls.filter(url => !this.memoryCache.has(url));
    const cachedUrls = imageUrls.filter(url => this.memoryCache.has(url));

    stats.cachedImages = cachedUrls.length;
    stats.newImages = newUrls.length;

    console.log(`📊 PersistentImageCache: ${cachedUrls.length} already cached, ${newUrls.length} new to load`);

    // Load only new images
    if (newUrls.length > 0) {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < newUrls.length; i += batchSize) {
        batches.push(newUrls.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const promises = batch.map(url => 
          this.getCachedImage(url).catch(error => {
            console.warn(`Failed to preload: ${url}`, error);
            stats.failedImages++;
            return null;
          })
        );

        await Promise.allSettled(promises);
        stats.newImages -= batch.length;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate cache size
    stats.cacheSize = Array.from(this.memoryCache.values()).reduce((sum, img) => sum + img.size, 0);

    console.log(`✅ PersistentImageCache: Preload completed!`, stats);
    return stats;
  }

  /**
   * Extract image URLs from products
   */
  private extractImageUrls(products: Product[]): string[] {
    const urls = new Set<string>();
    
    products.forEach(product => {
      if (product.image && !product.image.startsWith('data:')) {
        urls.add(product.image);
      }
    });

    urls.add('/placeholder.svg');
    return Array.from(urls);
  }

  /**
   * Check if image is cached
   */
  isImageCached(url: string): boolean {
    return this.memoryCache.has(url);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return {
      totalImages: this.memoryCache.size,
      cachedImages: this.memoryCache.size,
      newImages: 0,
      failedImages: 0,
      cacheSize: Array.from(this.memoryCache.values()).reduce((sum, img) => sum + img.size, 0)
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    this.loadingPromises.clear();
    
    // Clear localStorage
    localStorage.removeItem('imageCache');
    
    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      store.clear();
    }
    
    console.log('🧹 PersistentImageCache: All caches cleared');
  }
}

export const persistentImageCache = new PersistentImageCache();
