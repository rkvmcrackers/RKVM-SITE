/**
 * Background Sync Service
 * Handles silent background updates for image cache
 */

import { imageCacheService } from './imageCacheService';

interface SyncOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  onProgress?: (processed: number, total: number) => void;
  onComplete?: (newImagesCount: number) => void;
  onError?: (error: Error) => void;
}

class BackgroundSyncService {
  private isRunning = false;
  private currentSyncId: string | null = null;

  /**
   * Start background sync for image URLs
   */
  async startSync(
    imageUrls: string[],
    options: SyncOptions = {}
  ): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const {
      batchSize = 5,
      delayBetweenBatches = 100,
      maxRetries = 3,
      onProgress,
      onComplete,
      onError
    } = options;

    this.isRunning = true;
    this.currentSyncId = this.generateSyncId();

    try {
      let newImagesCount = 0;
      let processed = 0;
      const total = imageUrls.length;

      // Process images in batches
      for (let i = 0; i < imageUrls.length; i += batchSize) {
        if (this.currentSyncId !== this.generateSyncId()) {
          // Sync was cancelled
          return;
        }

        const batch = imageUrls.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (url) => {
          try {
            const isCached = await imageCacheService.isImageCached(url);
            if (!isCached) {
              const success = await this.fetchAndCacheImage(url, maxRetries);
              if (success) {
                newImagesCount++;
              }
            }
            processed++;
            onProgress?.(processed, total);
          } catch (error) {
            console.warn('Failed to sync image:', url, error);
          }
        });

        await Promise.allSettled(batchPromises);
        
        // Delay between batches to avoid overwhelming the browser
        if (i + batchSize < imageUrls.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      onComplete?.(newImagesCount);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      this.isRunning = false;
      this.currentSyncId = null;
    }
  }

  /**
   * Stop current sync
   */
  stopSync(): void {
    this.isRunning = false;
    this.currentSyncId = null;
  }

  /**
   * Check if sync is running
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Fetch and cache a single image
   */
  private async fetchAndCacheImage(url: string, maxRetries: number): Promise<boolean> {
    const strategies = this.getImageFetchStrategies(url);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const strategy of strategies) {
        try {
          const response = await fetch(strategy.url, strategy.options);
          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await this.blobToDataUrl(blob);
            
            // Cache the image
            await imageCacheService.cacheImage(url, dataUrl);
            return true;
          }
        } catch (error) {
          continue; // Try next strategy
        }
      }
      
      // Wait before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    return false;
  }

  /**
   * Get image fetch strategies
   */
  private getImageFetchStrategies(url: string): Array<{url: string, options: RequestInit}> {
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
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generate unique sync ID
   */
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
