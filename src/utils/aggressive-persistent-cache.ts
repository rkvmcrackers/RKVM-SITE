/**
 * Aggressive Persistent Image Cache
 * Works even in incognito mode by using multiple storage strategies
 * Never refreshes products, only loads new ones
 */

import { Product } from '../types/product';
import { GoogleDriveProxy } from './google-drive-proxy';

interface CachedImage {
  url: string;
  dataUrl: string;
  timestamp: number;
  version: string;
  size: number;
  hash: string; // For duplicate detection
}

interface CacheStats {
  totalImages: number;
  cachedImages: number;
  newImages: number;
  failedImages: number;
  cacheSize: number;
}

class AggressivePersistentCache {
  private memoryCache = new Map<string, CachedImage>();
  private loadingPromises = new Map<string, Promise<string>>();
  private readonly CACHE_VERSION = '2.0.0';
  private readonly MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private productHash = '';

  constructor() {
    this.initializeDB();
    this.loadFromAllStorage();
  }

  /**
   * Initialize IndexedDB for large image storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AggressiveImageCache', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Load from all available storage methods
   */
  private async loadFromAllStorage(): Promise<void> {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('aggressiveImageCache');
      if (stored) {
        const cache = JSON.parse(stored);
        if (cache.version === this.CACHE_VERSION) {
          Object.entries(cache.images).forEach(([url, data]: [string, any]) => {
            this.memoryCache.set(url, data);
          });
          this.productHash = cache.productHash || '';
          console.log(`📦 AggressiveCache: Loaded ${this.memoryCache.size} images from localStorage`);
        }
      }

      // Load from sessionStorage (works in incognito)
      const sessionStored = sessionStorage.getItem('aggressiveImageCache');
      if (sessionStored) {
        const cache = JSON.parse(sessionStored);
        if (cache.version === this.CACHE_VERSION) {
          Object.entries(cache.images).forEach(([url, data]: [string, any]) => {
            if (!this.memoryCache.has(url)) {
              this.memoryCache.set(url, data);
            }
          });
          console.log(`📦 AggressiveCache: Loaded additional images from sessionStorage`);
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
          console.log(`📦 AggressiveCache: Loaded ${request.result.length} images from IndexedDB`);
        };
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save to all available storage methods
   */
  private async saveToAllStorage(): Promise<void> {
    try {
      const cache = {
        version: this.CACHE_VERSION,
        images: Object.fromEntries(this.memoryCache),
        productHash: this.productHash,
        timestamp: Date.now()
      };

      // Save to localStorage
      try {
        localStorage.setItem('aggressiveImageCache', JSON.stringify(cache));
      } catch (error) {
        console.warn('localStorage full, trying sessionStorage');
      }

      // Save to sessionStorage (works in incognito)
      try {
        sessionStorage.setItem('aggressiveImageCache', JSON.stringify(cache));
      } catch (error) {
        console.warn('sessionStorage full');
      }

      // Save to IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['images', 'metadata'], 'readwrite');
        const imageStore = transaction.objectStore('images');
        const metaStore = transaction.objectStore('metadata');
        
        for (const [url, data] of this.memoryCache) {
          imageStore.put(data);
        }
        
        metaStore.put({ key: 'cache', value: cache });
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Generate hash for products to detect changes
   */
  private generateProductHash(products: Product[]): string {
    const productData = products.map(p => `${p.id}-${p.name}-${p.image}`).join('|');
    return btoa(productData).slice(0, 16); // Simple hash
  }

  /**
   * Check if products have changed
   */
  private hasProductsChanged(products: Product[]): boolean {
    const newHash = this.generateProductHash(products);
    return newHash !== this.productHash;
  }

  /**
   * Get cached image or load and cache it
   */
  async getCachedImage(url: string): Promise<string> {
    // Check memory cache first
    if (this.memoryCache.has(url)) {
      const cached = this.memoryCache.get(url)!;
      console.log(`⚡ AggressiveCache: Using cached image for ${url}`);
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
   * Load image and cache it aggressively
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
            
            // Generate hash for duplicate detection
            const hash = await this.generateImageHash(blob);
            
            // Cache the image
            const cached: CachedImage = {
              url,
              dataUrl,
              timestamp: Date.now(),
              version: this.CACHE_VERSION,
              size: blob.size,
              hash
            };

            this.memoryCache.set(url, cached);
            await this.saveToAllStorage();
            
            console.log(`✅ AggressiveCache: Cached new image ${url}`);
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
   * Generate hash for image content
   */
  private async generateImageHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  /**
   * Get loading strategies
   */
  private getLoadStrategies(url: string): Array<{url: string, options: RequestInit}> {
    const strategies = [];

    // Handle Google Drive URLs specially
    if (GoogleDriveProxy.isGoogleDriveUrl(url)) {
      const proxyUrls = GoogleDriveProxy.getProxyStrategies(url);
      proxyUrls.forEach(proxyUrl => {
        strategies.push({
          url: proxyUrl,
          options: {
            mode: 'no-cors', // Use no-cors for Google Drive images
            cache: 'force-cache',
            headers: {
              'Accept': 'image/*,*/*'
            }
          }
        });
      });
      return strategies;
    }

    // Strategy 1: Direct load with aggressive caching
    strategies.push({
      url: url,
      options: {
        mode: 'cors',
        cache: 'force-cache',
        headers: {
          'Accept': 'image/*,*/*',
          'Cache-Control': 'max-age=31536000',
          'Pragma': 'cache'
        }
      }
    });

    // Strategy 2: Proxy with compression
    if (!url.startsWith('/') && !url.startsWith('data:')) {
      strategies.push({
        url: `https://images.weserv.nl/?url=${encodeURIComponent(url)}&q=90&f=webp&output=webp`,
        options: {
          mode: 'cors',
          cache: 'force-cache',
          headers: {
            'Accept': 'image/webp,image/*,*/*',
            'Cache-Control': 'max-age=31536000'
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
            'Accept': 'image/*,*/*',
            'Cache-Control': 'max-age=31536000'
          }
        }
      });
    }

    // Strategy 4: Another proxy
    if (!url.startsWith('/') && !url.startsWith('data:')) {
      strategies.push({
        url: `https://thingproxy.freeboard.io/fetch/${url}`,
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
   * Preload all product images (only if products changed)
   */
  async preloadAllImages(products: Product[]): Promise<CacheStats> {
    if (!this.isInitialized) {
      await this.initializeDB();
    }

    // Check if products have changed
    const hasChanged = this.hasProductsChanged(products);
    if (!hasChanged && this.memoryCache.size > 0) {
      console.log(`📊 AggressiveCache: Products unchanged, using existing cache (${this.memoryCache.size} images)`);
      return this.getCacheStats();
    }

    // Update product hash
    this.productHash = this.generateProductHash(products);

    const imageUrls = this.extractImageUrls(products);
    const stats: CacheStats = {
      totalImages: imageUrls.length,
      cachedImages: 0,
      newImages: 0,
      failedImages: 0,
      cacheSize: 0
    };

    console.log(`🚀 AggressiveCache: Starting preload of ${imageUrls.length} images...`);

    // Check which images are already cached
    const newUrls = imageUrls.filter(url => !this.memoryCache.has(url));
    const cachedUrls = imageUrls.filter(url => this.memoryCache.has(url));

    stats.cachedImages = cachedUrls.length;
    stats.newImages = newUrls.length;

    console.log(`📊 AggressiveCache: ${cachedUrls.length} already cached, ${newUrls.length} new to load`);

    // Load only new images
    if (newUrls.length > 0) {
      const batchSize = 15; // Increased batch size
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
        
        // Minimal delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Calculate cache size
    stats.cacheSize = Array.from(this.memoryCache.values()).reduce((sum, img) => sum + img.size, 0);

    console.log(`✅ AggressiveCache: Preload completed!`, stats);
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
    this.productHash = '';
    
    // Clear all storage methods
    localStorage.removeItem('aggressiveImageCache');
    sessionStorage.removeItem('aggressiveImageCache');
    
    // Clear IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['images', 'metadata'], 'readwrite');
      const imageStore = transaction.objectStore('images');
      const metaStore = transaction.objectStore('metadata');
      imageStore.clear();
      metaStore.clear();
    }
    
    console.log('🧹 AggressiveCache: All caches cleared');
  }
}

export const aggressivePersistentCache = new AggressivePersistentCache();
