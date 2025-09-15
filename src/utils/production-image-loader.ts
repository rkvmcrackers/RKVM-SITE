/**
 * Production Image Loader
 * Optimized for production environments with better caching and fallbacks
 */

import { Product } from '../types/product';

interface ImageLoadResult {
  success: boolean;
  url: string;
  cached: boolean;
  loadTime: number;
}

class ProductionImageLoader {
  private imageCache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<ImageLoadResult>>();
  private failedUrls = new Set<string>();
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Load image with production optimizations
   */
  async loadImage(url: string, retryCount = 0): Promise<ImageLoadResult> {
    const startTime = Date.now();
    
    // Check if already cached
    if (this.imageCache.has(url)) {
      return {
        success: true,
        url: this.imageCache.get(url)!,
        cached: true,
        loadTime: 0
      };
    }

    // Check if already failed
    if (this.failedUrls.has(url)) {
      throw new Error(`Image previously failed to load: ${url}`);
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.loadImageWithFallbacks(url, retryCount);
    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      this.loadingPromises.delete(url);
      result.loadTime = Date.now() - startTime;
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  /**
   * Load image with multiple fallback strategies
   */
  private async loadImageWithFallbacks(url: string, retryCount: number): Promise<ImageLoadResult> {
    const strategies = this.getLoadStrategies(url);
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        const strategy = strategies[i];
        console.log(`🔄 ProductionImageLoader: Trying strategy ${i + 1}/${strategies.length} for ${url}`);
        
        const result = await this.executeStrategy(strategy, url);
        if (result.success) {
          this.imageCache.set(url, result.url);
          console.log(`✅ ProductionImageLoader: Success with strategy ${i + 1} for ${url}`);
          return result;
        }
      } catch (error) {
        console.warn(`❌ ProductionImageLoader: Strategy ${i + 1} failed for ${url}:`, error);
        continue;
      }
    }

    // If all strategies failed and we have retries left
    if (retryCount < this.MAX_RETRIES) {
      console.log(`🔄 ProductionImageLoader: Retrying ${url} (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
      await this.delay(1000 * (retryCount + 1)); // Exponential backoff
      return this.loadImage(url, retryCount + 1);
    }

    // Mark as failed
    this.failedUrls.add(url);
    throw new Error(`All strategies failed for ${url}`);
  }

  /**
   * Get different loading strategies for production
   */
  private getLoadStrategies(url: string): Array<{type: string, url: string, options: RequestInit}> {
    const strategies = [];

    // Strategy 1: Direct load with aggressive caching
    strategies.push({
      type: 'direct',
      url: url,
      options: {
        mode: 'cors',
        cache: 'force-cache',
        headers: {
          'Accept': 'image/*,image/webp,image/jpeg,image/png,image/gif,*/*',
          'Cache-Control': 'max-age=31536000'
        }
      }
    });

    // Strategy 2: Proxy with compression
    if (!url.startsWith('/') && !url.startsWith('data:')) {
      strategies.push({
        type: 'proxy-compressed',
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
          cache: 'default',
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
   * Execute a specific loading strategy
   */
  private async executeStrategy(strategy: any, originalUrl: string): Promise<ImageLoadResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(strategy.url, {
        ...strategy.options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        return {
          success: true,
          url: objectUrl,
          cached: false,
          loadTime: 0
        };
      } else if (strategy.type === 'no-cors' && response.type === 'opaque') {
        // For no-cors, we can't read the response, so use the URL directly
        return {
          success: true,
          url: strategy.url,
          cached: false,
          loadTime: 0
        };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Preload all product images for production
   */
  async preloadAllImages(products: Product[]): Promise<void> {
    console.log(`🚀 ProductionImageLoader: Starting production preload of ${products.length} images...`);
    
    const imageUrls = products
      .map(product => product.image || '/placeholder.svg')
      .filter(url => url && !url.startsWith('data:') && !this.failedUrls.has(url));

    if (imageUrls.length === 0) {
      console.log('✅ ProductionImageLoader: No images to preload');
      return;
    }

    // Load images in batches for better performance
    const batchSize = 5; // Smaller batches for production
    const batches = [];
    
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      batches.push(imageUrls.slice(i, i + batchSize));
    }

    // Process batches with delays to prevent overwhelming the server
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 ProductionImageLoader: Processing batch ${i + 1}/${batches.length} (${batch.length} images)`);
      
      const promises = batch.map(url => 
        this.loadImage(url).catch(error => {
          console.warn(`Failed to preload: ${url}`, error);
          return null;
        })
      );

      await Promise.allSettled(promises);

      // Delay between batches to prevent server overload
      if (i < batches.length - 1) {
        await this.delay(500);
      }
    }

    console.log(`✅ ProductionImageLoader: Preload completed! ${this.imageCache.size} images cached`);
  }

  /**
   * Get cached image URL
   */
  getCachedImage(url: string): string | null {
    return this.imageCache.get(url) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.imageCache.clear();
    this.loadingPromises.clear();
    this.failedUrls.clear();
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      cachedImages: this.imageCache.size,
      loadingImages: this.loadingPromises.size,
      failedImages: this.failedUrls.size
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const productionImageLoader = new ProductionImageLoader();
