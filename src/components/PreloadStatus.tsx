import React, { useState, useEffect } from 'react';
import { aggressivePersistentCache } from '../utils/aggressive-persistent-cache';

const PreloadStatus: React.FC = () => {
  const [status, setStatus] = useState(aggressivePersistentCache.getCacheStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = aggressivePersistentCache.getCacheStats();
      setStatus(newStatus);
      
      // Show status if there are cached images
      if (newStatus.cachedImages > 0) {
        setIsVisible(true);
      }
      
      // Hide status after showing cache info
      if (newStatus.cachedImages > 0) {
        setTimeout(() => setIsVisible(false), 2000); // Hide after 2 seconds
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || status.cachedImages === 0) {
    return null;
  }

  const cacheSizeMB = (status.cacheSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600/90 text-white p-3 rounded-lg shadow-lg max-w-xs">
      <div className="text-sm font-medium mb-2">💾 Images Cached</div>
      <div className="text-xs text-green-100">
        {status.cachedImages} images cached ({cacheSizeMB}MB)
      </div>
    </div>
  );
};

export default PreloadStatus;
