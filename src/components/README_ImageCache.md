# Fast Image Caching System

A production-ready React image caching system that provides instant image loading with IndexedDB storage and silent background updates.

## Features

- ⚡ **Instant Loading**: Images load instantly from IndexedDB cache
- 🔄 **Silent Background Sync**: Automatically fetches new/updated images in the background
- 💾 **Efficient Storage**: Uses IndexedDB for large binary data (500MB limit)
- 🎯 **Smart Caching**: Only fetches new images, keeps existing ones
- 🚀 **Performance Optimized**: Lazy loading, priority loading, and batch processing
- 🔧 **Production Ready**: Error handling, cleanup, and memory management

## Quick Start

### 1. Basic Usage

```tsx
import FastImage from './components/FastImage';

function ProductCard({ product }) {
  return (
    <div>
      <FastImage
        src={product.image}
        alt={product.name}
        className="w-full h-64 object-cover"
        fallbackSrc="/placeholder.svg"
        priority={true} // Load immediately
      />
    </div>
  );
}
```

### 2. With Provider (Recommended)

```tsx
import { ImageCacheProvider } from './components/ImageCacheProvider';
import ProductGrid from './components/ProductGrid';

function App() {
  const products = useProducts();
  const imageUrls = products.map(p => p.image).filter(Boolean);

  return (
    <ImageCacheProvider
      imageUrls={imageUrls}
      enableBackgroundSync={true}
      syncInterval={30000} // 30 seconds
    >
      <ProductGrid products={products} />
    </ImageCacheProvider>
  );
}
```

### 3. Using the Hook

```tsx
import { useImageCacheContext } from './components/ImageCacheProvider';

function MyComponent() {
  const { getImage, preloadImages, getCacheStats } = useImageCacheContext();

  const handleLoadImage = async (url) => {
    const imageData = await getImage(url);
    // Image is now cached and ready to use
  };

  return <div>...</div>;
}
```

## Components

### FastImage

A React component that renders images with instant loading from cache.

**Props:**
- `src`: Image URL
- `alt`: Alt text
- `className`: CSS classes
- `fallbackSrc`: Fallback image URL
- `priority`: Load immediately (boolean)
- `loading`: 'lazy' | 'eager'
- `onLoad`: Load callback
- `onError`: Error callback
- `placeholder`: Custom placeholder component

### ImageCacheProvider

Context provider that manages image caching across the application.

**Props:**
- `imageUrls`: Array of image URLs to cache
- `enableBackgroundSync`: Enable background sync (boolean)
- `syncInterval`: Sync interval in milliseconds

## Services

### imageCacheService

IndexedDB service for image storage and retrieval.

**Methods:**
- `getCachedImage(url)`: Get cached image
- `cacheImage(url, dataUrl)`: Cache an image
- `isImageCached(url)`: Check if image is cached
- `getCacheStats()`: Get cache statistics
- `clearCache()`: Clear all cache

### backgroundSyncService

Service for silent background image updates.

**Methods:**
- `startSync(urls, options)`: Start background sync
- `stopSync()`: Stop current sync
- `isSyncRunning()`: Check if sync is running

## Hooks

### useImageCache

React hook for image caching functionality.

**Returns:**
- `cachedImages`: Map of cached images
- `isLoading`: Loading state
- `isBackgroundSyncing`: Background sync state
- `error`: Error state
- `getImage(url)`: Get image from cache or fetch
- `preloadImages(urls)`: Preload multiple images
- `getCacheStats()`: Get cache statistics
- `clearCache()`: Clear all cache

## Configuration

### Cache Settings

```typescript
// In imageCacheService.ts
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Sync Settings

```typescript
// In useImageCache.ts
const syncInterval = 30000; // 30 seconds
const batchSize = 5; // Images per batch
```

## Best Practices

1. **Use Priority Loading**: Set `priority={true}` for above-the-fold images
2. **Lazy Load**: Use `loading="lazy"` for below-the-fold images
3. **Fallback Images**: Always provide a fallback image
4. **Error Handling**: Handle image load errors gracefully
5. **Memory Management**: The system automatically cleans up old cache entries

## Performance Tips

1. **Batch Processing**: Images are processed in small batches to avoid overwhelming the browser
2. **Intersection Observer**: Uses Intersection Observer for efficient lazy loading
3. **Memory Cache**: Keeps frequently used images in memory for instant access
4. **Background Sync**: Updates happen silently without blocking the UI

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Automatically retries with different strategies
- **Cache Errors**: Gracefully falls back to fetching
- **Storage Errors**: Handles IndexedDB quota exceeded errors
- **Image Errors**: Shows fallback images for failed loads

## Browser Support

- **IndexedDB**: Modern browsers (IE 10+)
- **Intersection Observer**: Modern browsers (IE not supported)
- **Service Workers**: Modern browsers (optional)

## Example Implementation

See `ProductGridExample.tsx` for a complete implementation example.

## Troubleshooting

1. **Images not loading**: Check network connectivity and image URLs
2. **Cache not working**: Ensure IndexedDB is supported and not disabled
3. **Slow loading**: Check cache size and consider reducing image quality
4. **Memory issues**: The system automatically cleans up old entries

## License

MIT License - feel free to use in your projects!
