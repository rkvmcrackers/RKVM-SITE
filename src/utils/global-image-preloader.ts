/**
 * Global Image Preloader
 * Preloads ALL images immediately when app starts, before users visit pages
 */

import { Product } from '../types/product';

interface PreloadStatus {
  total: number;
  loaded: number;
  failed: number;
  loading: number;
  cached: number;
}

class GlobalImagePreloader {
  private imageCache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();
  private preloadStatus: PreloadStatus = {
    total: 0,
    loaded: 0,
    failed: 0,
    loading: 0,
    cached: 0
  };
  private isPreloading = false;
  private preloadQueue: string[] = [];
  private readonly MAX_CONCURRENT = 20; // High concurrency for faster loading

  /**
   * Start global preloading immediately
   */
  async startGlobalPreloading(products: Product[]): Promise<void> {
    if (this.isPreloading) {
      console.log('🔄 GlobalImagePreloader: Already preloading...');
      return;
    }

    this.isPreloading = true;
    console.log('🚀 GlobalImagePreloader: Starting GLOBAL image preloading...');

    try {
      // Extract all image URLs
      const imageUrls = this.extractImageUrls(products);
      this.preloadStatus.total = imageUrls.length;
      
      console.log(`📸 GlobalImagePreloader: Found ${imageUrls.length} images to preload`);

      // Start preloading immediately
      await this.preloadAllImages(imageUrls);
      
      console.log(`✅ GlobalImagePreloader: COMPLETED! Status:`, this.preloadStatus);
    } catch (error) {
      console.error('❌ GlobalImagePreloader: Failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Extract all image URLs from products
   */
  private extractImageUrls(products: Product[]): string[] {
    const urls = new Set<string>();
    
    products.forEach(product => {
      if (product.image && !product.image.startsWith('data:')) {
        urls.add(product.image);
      }
    });

    // Add placeholder
    urls.add('/placeholder.svg');
    
    return Array.from(urls);
  }

  /**
   * Preload all images with maximum concurrency
   */
  private async preloadAllImages(urls: string[]): Promise<void> {
    // Add all URLs to queue
    this.preloadQueue = [...urls];
    
    // Process queue with high concurrency
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < this.MAX_CONCURRENT; i++) {
      promises.push(this.processQueue());
    }

    await Promise.allSettled(promises);
  }

  /**
   * Process the preload queue
   */
  private async processQueue(): Promise<void> {
    while (this.preloadQueue.length > 0) {
      const url = this.preloadQueue.shift();
      if (!url) break;

      try {
        this.preloadStatus.loading++;
        await this.preloadSingleImage(url);
        this.preloadStatus.loaded++;
        this.preloadStatus.cached++;
      } catch (error) {
        this.preloadStatus.failed++;
        console.warn(`⚠️ GlobalImagePreloader: Failed to preload ${url}:`, error);
      } finally {
        this.preloadStatus.loading--;
      }
    }
  }

  /**
   * Preload a single image with multiple strategies
   */
  private async preloadSingleImage(url: string): Promise<string> {
    // Check if already cached
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.loadImageWithStrategies(url);
    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      this.imageCache.set(url, result);
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  /**
   * Load image with multiple strategies for maximum success rate
   */
  private async loadImageWithStrategies(url: string): Promise<string> {
    const strategies = this.getLoadStrategies(url);
    
    for (const strategy of strategies) {
      try {
        const result = await this.executeStrategy(strategy, url);
        if (result) {
          return result;
        }
      } catch (error) {
        continue; // Try next strategy
      }
    }

    throw new Error(`All strategies failed for ${url}`);
  }

  /**
   * Get loading strategies for maximum success rate
   */
  private getLoadStrategies(url: string): Array<{type: string, url: string, options: RequestInit}> {
    const strategies = [];

    // Strategy 1: Direct load
    strategies.push({
      type: 'direct',
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

    // Strategy 2: Proxy with WebP compression
    if (!url.startsWith('/') && !url.startsWith('data:')) {
      strategies.push({
        type: 'proxy-webp',
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
        type: 'proxy-alt',
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

    // Strategy 4: No-cors fallback
    strategies.push({
      type: 'no-cors',
      url: url,
      options: {
        mode: 'no-cors',
        cache: 'force-cache'
      }
    });

    return strategies;
  }

  /**
   * Execute a loading strategy
   */
  private async executeStrategy(strategy: any, originalUrl: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(strategy.url, {
        ...strategy.options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } else if (strategy.type === 'no-cors' && response.type === 'opaque') {
        // For no-cors, use the URL directly
        return strategy.url;
      }

      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      return null;
    }
  }

  /**
   * Get cached image URL
   */
  getCachedImage(url: string): string | null {
    return this.imageCache.get(url) || null;
  }

  /**
   * Check if image is cached
   */
  isImageCached(url: string): boolean {
    return this.imageCache.has(url);
  }

  /**
   * Get preload status
   */
  getStatus(): PreloadStatus {
    return { ...this.preloadStatus };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalCached: this.imageCache.size,
      currentlyLoading: this.loadingPromises.size,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.imageCache.clear();
    this.loadingPromises.clear();
    this.preloadQueue = [];
    this.preloadStatus = {
      total: 0,
      loaded: 0,
      failed: 0,
      loading: 0,
      cached: 0
    };
  }
}

export const globalImagePreloader = new GlobalImagePreloader();
