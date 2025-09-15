/**
 * ProductGridExample
 * Complete example of using the fast image caching system
 */

import React, { useEffect, useState } from 'react';
import { ImageCacheProvider, useImageCacheContext } from './ImageCacheProvider';
import FastImage from './FastImage';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const { getCacheStats, isBackgroundSyncing } = useImageCacheContext();
  const [cacheStats, setCacheStats] = useState({ totalImages: 0, totalSize: 0 });

  // Update cache stats
  useEffect(() => {
    const updateStats = async () => {
      const stats = await getCacheStats();
      setCacheStats(stats);
    };
    updateStats();
  }, [getCacheStats, isBackgroundSyncing]);

  return (
    <div className="space-y-6">
      {/* Cache Status (Optional - can be hidden in production) */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span>
            Cached: {cacheStats.totalImages} images ({Math.round(cacheStats.totalSize / 1024)}KB)
          </span>
          {isBackgroundSyncing && (
            <span className="text-blue-600">🔄 Syncing...</span>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 8} // Prioritize first 8 images
          />
        ))}
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  priority: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, priority }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image - This will load instantly from cache */}
      <div className="aspect-square relative">
        <FastImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          fallbackSrc="/placeholder.svg"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => {
            // Optional: Track image load events
            console.log(`✅ Image loaded: ${product.name}`);
          }}
          onError={() => {
            // Optional: Track image errors
            console.warn(`❌ Image failed: ${product.name}`);
          }}
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.category}</p>
        <p className="text-2xl font-bold text-green-600">₹{product.price}</p>
      </div>
    </div>
  );
};

// Main component with provider
const ProductGridExample: React.FC<{ products: Product[] }> = ({ products }) => {
  // Extract all image URLs for caching
  const imageUrls = products
    .map(product => product.image)
    .filter(Boolean);

  return (
    <ImageCacheProvider
      imageUrls={imageUrls}
      enableBackgroundSync={true}
      syncInterval={30000} // 30 seconds
    >
      <ProductGrid products={products} />
    </ImageCacheProvider>
  );
};

export default ProductGridExample;
