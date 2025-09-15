/**
 * Aggressive Image Preloader
 * Preloads ALL images immediately when app starts
 */

import { imageCache } from './image-cache';
import { SimpleImageProxy } from './simple-image-proxy';

class AggressivePreloader {
  private preloadedUrls = new Set<string>();
  private isPreloading = false;

  /**
   * Preload all product images aggressively
   */
  async preloadAllImages(products: any[]): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Starting aggressive image preloading...');

    try {
      // Process all image URLs
      const imageUrls = products
        .map(product => {
          if (!product.image || product.image.startsWith('/') || product.image.startsWith('data:')) {
            return product.image || '/placeholder.svg';
          }
          return SimpleImageProxy.convertToProxyUrl(product.image);
        })
        .filter(url => url && !this.preloadedUrls.has(url));

      if (imageUrls.length === 0) {
        console.log('✅ No new images to preload');
        return;
      }

      console.log(`📸 Preloading ${imageUrls.length} images...`);

      // Preload in batches for better performance
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < imageUrls.length; i += batchSize) {
        batches.push(imageUrls.slice(i, i + batchSize));
      }

      // Process batches with small delays to prevent browser freezing
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} images)`);
        
        await Promise.allSettled(
          batch.map(url => 
            imageCache.getCachedImage(url).then(() => {
              this.preloadedUrls.add(url);
            }).catch(error => {
              console.warn(`Failed to preload: ${url}`, error);
            })
          )
        );

        // Small delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`✅ Aggressive preloading completed! ${this.preloadedUrls.size} images cached`);
    } catch (error) {
      console.error('❌ Aggressive preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload critical images immediately
   */
  async preloadCriticalImages(): Promise<void> {
    const criticalImages = [
      '/placeholder.svg',
      '/logo.jpg'
    ];

    console.log('🔥 Preloading critical images...');
    
    await Promise.allSettled(
      criticalImages.map(url => 
        imageCache.getCachedImage(url).catch(() => {
          console.warn(`Failed to preload critical image: ${url}`);
        })
      )
    );

    console.log('✅ Critical images preloaded');
  }

  /**
   * Check if image is already preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedUrls.has(url);
  }

  /**
   * Get preloading stats
   */
  getStats() {
    return {
      preloadedCount: this.preloadedUrls.size,
      isPreloading: this.isPreloading,
      cacheStats: imageCache.getCacheStats()
    };
  }

  /**
   * Clear preloaded URLs (but keep cache)
   */
  clearPreloadedUrls(): void {
    this.preloadedUrls.clear();
  }
}

export const aggressivePreloader = new AggressivePreloader();
