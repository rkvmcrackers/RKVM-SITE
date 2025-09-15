// Data persistence configuration
export const DATA_PERSISTENCE_CONFIG = {
  // Enable local storage as primary backup
  enableLocalStorage: true,
  
  // Enable GitHub sync as secondary backup
  enableGitHubSync: true,
  
  // Enable data validation
  enableDataValidation: true,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  
  // Auto-sync interval (in milliseconds)
  // Set to 0 to disable auto-sync
  autoSyncInterval: 0, // 5 minutes = 5 * 60 * 1000
  
  // Data retention settings
  maxLocalStorageSize: 10 * 1024 * 1024, // 10MB
  
  // Emergency recovery settings
  enableEmergencyRecovery: true,
  emergencyRecoveryTimeout: 30000, // 30 seconds
  
  // Debug settings
  enableDebugLogging: process.env.NODE_ENV === 'development',
  
  // Data keys for localStorage
  storageKeys: {
    products: 'products',
    orders: 'orders',
    highlights: 'highlights',
    config: 'app_config'
  },
  
  // GitHub file paths
  githubPaths: {
    products: 'data/products.json',
    orders: 'data/orders.json',
    highlights: 'data/highlights.json',
    config: 'data/config.json'
  }
};

// Fallback data for when all sources fail
export const FALLBACK_DATA = {
  products: [],
  orders: [],
  highlights: [
    "🎆 Premium Quality Crackers",
    "🔥 Safe & Eco-Friendly",
    "💥 Best Prices Guaranteed",
    "🚚 Fast Delivery Available"
  ],
  config: {
    version: "1.0.0",
    lastUpdated: new Date().toISOString()
  }
};

export default DATA_PERSISTENCE_CONFIG;
