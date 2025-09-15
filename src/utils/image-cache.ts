/**
 * Aggressive Image Cache Service
 * Caches images in browser memory and localStorage for instant loading
 */

interface CachedImage {
  url: string;
  dataUrl: string;
  timestamp: number;
  size: number;
}

class ImageCacheService {
  private memoryCache = new Map<string, CachedImage>();
  private loadingPromises = new Map<string, Promise<string>>();
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of images to cache
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get cached image or load and cache it
   */
  async getCachedImage(url: string): Promise<string> {
    // Check memory cache first
    const cached = this.memoryCache.get(url);
    if (cached && this.isCacheValid(cached)) {
      return cached.dataUrl;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Start loading
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
   * Load image and convert to data URL for caching
   */
  private async loadAndCacheImage(url: string): Promise<string> {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(`img_cache_${this.hashUrl(url)}`);
      if (stored) {
        const cached: CachedImage = JSON.parse(stored);
        if (this.isCacheValid(cached)) {
          this.memoryCache.set(url, cached);
          return cached.dataUrl;
        }
      }

      // Load image
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }

      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);

      // Cache the image
      const cached: CachedImage = {
        url,
        dataUrl,
        timestamp: Date.now(),
        size: blob.size
      };

      this.memoryCache.set(url, cached);
      this.cleanupCache();

      // Store in localStorage
      try {
        localStorage.setItem(`img_cache_${this.hashUrl(url)}`, JSON.stringify(cached));
      } catch (e) {
        // localStorage might be full, ignore
        console.warn('Failed to store image in localStorage:', e);
      }

      return dataUrl;
    } catch (error) {
      console.warn(`Failed to load image ${url}:`, error);
      throw error;
    }
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
   * Check if cache entry is still valid
   */
  private isCacheValid(cached: CachedImage): boolean {
    return Date.now() - cached.timestamp < this.CACHE_EXPIRY;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache() {
    if (this.memoryCache.size <= this.MAX_CACHE_SIZE) return;

    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(([url]) => {
      this.memoryCache.delete(url);
    });
  }

  /**
   * Hash URL for localStorage key
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Preload multiple images aggressively
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.getCachedImage(url).catch(() => {
        // Ignore individual failures
        console.warn(`Failed to preload image: ${url}`);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.loadingPromises.clear();
    
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('img_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      loadingCount: this.loadingPromises.size,
      totalSize: Array.from(this.memoryCache.values()).reduce((sum, img) => sum + img.size, 0)
    };
  }
}

export const imageCache = new ImageCacheService();
