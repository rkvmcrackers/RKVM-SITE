/**
 * Image Preloader Utility
 * Preloads critical images for faster loading
 */

interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

class ImagePreloader {
  private preloadedImages = new Set<string>();
  private loadingPromises = new Map<string, Promise<boolean>>();

  /**
   * Preload a single image
   */
  async preloadImage(src: string, options: PreloadOptions = {}): Promise<boolean> {
    if (this.preloadedImages.has(src)) {
      return true;
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = this.loadImage(src, options);
    this.loadingPromises.set(src, promise);
    
    const result = await promise;
    if (result) {
      this.preloadedImages.add(src);
    }
    
    return result;
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(srcs: string[], options: PreloadOptions = {}): Promise<boolean[]> {
    const promises = srcs.map(src => this.preloadImage(src, options));
    return Promise.all(promises);
  }

  /**
   * Load image with timeout and error handling
   */
  private loadImage(src: string, options: PreloadOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = options.timeout || 10000; // 10 second timeout
      
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };

      // Set loading priority
      if (options.priority === 'high') {
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }

      img.src = src;
    });
  }

  /**
   * Check if image is already preloaded
   */
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Clear preloaded images cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.loadingPromises.clear();
  }
}

export const imagePreloader = new ImagePreloader();

/**
 * Preload critical images for the home page
 */
export const preloadCriticalImages = async (): Promise<void> => {
  const criticalImages = [
    '/placeholder.svg', // Placeholder image
    // Add other critical images here
  ];

  try {
    await imagePreloader.preloadImages(criticalImages, { priority: 'high' });
    console.log('Critical images preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some critical images:', error);
  }
};

/**
 * Preload product images in batches
 */
export const preloadProductImages = async (imageUrls: string[]): Promise<void> => {
  const batchSize = 5; // Load 5 images at a time
  const batches = [];
  
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    batches.push(imageUrls.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      await imagePreloader.preloadImages(batch, { priority: 'low' });
    } catch (error) {
      console.warn('Failed to preload batch:', error);
    }
  }
};
