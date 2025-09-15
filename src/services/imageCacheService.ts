/**
 * Image Cache Service
 * Production-ready IndexedDB service for fast image caching
 */

interface CachedImage {
  id: string;
  url: string;
  dataUrl: string;
  lastModified: number;
  etag?: string;
  size: number;
}

interface CacheStats {
  totalImages: number;
  totalSize: number;
  lastSync: number;
}

class ImageCacheService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ImageCacheDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'images';
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached image by URL
   */
  async getCachedImage(url: string): Promise<string | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('url');
      const request = index.getAll(url);

      request.onsuccess = () => {
        const results = request.result;
        if (results.length > 0) {
          const cached = results[0];
          // Check if cache is still valid
          if (Date.now() - cached.lastModified < this.CACHE_EXPIRY) {
            resolve(cached.dataUrl);
          } else {
            // Cache expired, remove it
            this.removeCachedImage(url);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  /**
   * Cache an image
   */
  async cacheImage(url: string, dataUrl: string, etag?: string): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    const id = this.generateId(url);
    const cachedImage: CachedImage = {
      id,
      url,
      dataUrl,
      lastModified: Date.now(),
      etag,
      size: this.calculateSize(dataUrl)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(cachedImage);

      request.onsuccess = () => {
        this.cleanupOldCache();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if image is cached
   */
  async isImageCached(url: string): Promise<boolean> {
    const cached = await this.getCachedImage(url);
    return cached !== null;
  }

  /**
   * Get all cached image URLs
   */
  async getAllCachedUrls(): Promise<string[]> {
    await this.initialize();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        const urls = results
          .filter(img => Date.now() - img.lastModified < this.CACHE_EXPIRY)
          .map(img => img.url);
        resolve(urls);
      };

      request.onerror = () => resolve([]);
    });
  }

  /**
   * Remove cached image
   */
  async removeCachedImage(url: string): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('url');
      const request = index.getAll(url);

      request.onsuccess = () => {
        const results = request.result;
        if (results.length > 0) {
          const deleteRequest = store.delete(results[0].id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => resolve();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    await this.initialize();
    if (!this.db) return { totalImages: 0, totalSize: 0, lastSync: 0 };

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        const validImages = results.filter(img => 
          Date.now() - img.lastModified < this.CACHE_EXPIRY
        );
        
        resolve({
          totalImages: validImages.length,
          totalSize: validImages.reduce((sum, img) => sum + img.size, 0),
          lastSync: Math.max(...validImages.map(img => img.lastModified), 0)
        });
      };

      request.onerror = () => resolve({ totalImages: 0, totalSize: 0, lastSync: 0 });
    });
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  /**
   * Clean up old cache entries
   */
  private async cleanupOldCache(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    const stats = await this.getCacheStats();
    if (stats.totalSize < this.MAX_CACHE_SIZE) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('lastModified');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const image = cursor.value;
          if (Date.now() - image.lastModified > this.CACHE_EXPIRY) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Generate unique ID for image
   */
  private generateId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Calculate data URL size
   */
  private calculateSize(dataUrl: string): number {
    // Rough estimation: base64 is ~4/3 of original size
    return Math.round(dataUrl.length * 0.75);
  }
}

export const imageCacheService = new ImageCacheService();
