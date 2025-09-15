// Robust data persistence service with multiple fallback mechanisms
import { githubAPI } from './github-api';
import { DATA_PERSISTENCE_CONFIG, FALLBACK_DATA } from '../config/data-persistence';

interface DataPersistenceConfig {
  enableLocalStorage: boolean;
  enableGitHubSync: boolean;
  enableDataValidation: boolean;
  maxRetries: number;
  retryDelay: number;
  enableDebugLogging: boolean;
}

const defaultConfig: DataPersistenceConfig = {
  enableLocalStorage: DATA_PERSISTENCE_CONFIG.enableLocalStorage,
  enableGitHubSync: DATA_PERSISTENCE_CONFIG.enableGitHubSync,
  enableDataValidation: DATA_PERSISTENCE_CONFIG.enableDataValidation,
  maxRetries: DATA_PERSISTENCE_CONFIG.maxRetries,
  retryDelay: DATA_PERSISTENCE_CONFIG.retryDelay,
  enableDebugLogging: DATA_PERSISTENCE_CONFIG.enableDebugLogging
};

class DataPersistenceService {
  private config: DataPersistenceConfig;

  constructor(config: DataPersistenceConfig = defaultConfig) {
    this.config = config;
  }

  // Validate data structure
  private validateData(data: any, expectedType: 'array' | 'object'): boolean {
    if (!this.config.enableDataValidation) return true;
    
    if (expectedType === 'array') {
      return Array.isArray(data);
    } else if (expectedType === 'object') {
      return data && typeof data === 'object' && !Array.isArray(data);
    }
    return false;
  }

  // Get data from local storage
  private getFromLocalStorage(key: string): any | null {
    if (!this.config.enableLocalStorage) return null;
    
    try {
      const data = localStorage.getItem(key);
      if (this.config.enableDebugLogging) {
        console.log(`Reading from localStorage: ${key}`, data ? 'Found' : 'Not found');
      }
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return null;
    }
  }

  // Save data to local storage
  private saveToLocalStorage(key: string, data: any): boolean {
    if (!this.config.enableLocalStorage) return false;
    
    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
      
      if (this.config.enableDebugLogging) {
        console.log(`Saved to localStorage: ${key} (${jsonData.length} bytes)`);
      }
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage for key ${key}:`, error);
      return false;
    }
  }

  // Get data from GitHub with fallback
  private async getFromGitHub(path: string, expectedType: 'array' | 'object' = 'array'): Promise<any | null> {
    if (!this.config.enableGitHubSync) return null;
    
    try {
      if (this.config.enableDebugLogging) {
        console.log(`Fetching from GitHub: ${path}`);
      }
      
      const result = await githubAPI.getFile(path);
      if (result && this.validateData(result.content, expectedType)) {
        if (this.config.enableDebugLogging) {
          console.log(`Successfully fetched from GitHub: ${path}`);
        }
        return result.content;
      }
      
      if (this.config.enableDebugLogging) {
        console.log(`GitHub data validation failed for: ${path}`);
      }
      return null;
    } catch (error) {
      console.error(`Error fetching from GitHub for path ${path}:`, error);
      return null;
    }
  }

  // Save data to GitHub with retry mechanism
  private async saveToGitHub(path: string, data: any, message: string): Promise<boolean> {
    if (!this.config.enableGitHubSync) return false;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const success = await githubAPI.putFile(path, data, message);
        if (success) return true;
        
        if (attempt < this.config.maxRetries) {
          console.log(`GitHub save attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      } catch (error) {
        console.error(`GitHub save attempt ${attempt} error:`, error);
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }
    return false;
  }

  // Get data with multiple fallback sources
  async getData(
    key: string, 
    path: string, 
    expectedType: 'array' | 'object' = 'array',
    fallbackData: any = null
  ): Promise<any> {
    // Try GitHub first
    const githubData = await this.getFromGitHub(path, expectedType);
    if (githubData !== null) {
      // Save to local storage as backup
      this.saveToLocalStorage(key, githubData);
      return githubData;
    }

    // Fallback to local storage
    const localData = this.getFromLocalStorage(key);
    if (localData !== null && this.validateData(localData, expectedType)) {
      console.warn(`Using local storage data for ${key} as GitHub is unavailable`);
      return localData;
    }

    // Final fallback to provided default data
    if (fallbackData !== null && this.validateData(fallbackData, expectedType)) {
      console.warn(`Using fallback data for ${key}`);
      return fallbackData;
    }

    // Return empty array/object based on expected type
    return expectedType === 'array' ? [] : {};
  }

  // Save data with multiple persistence strategies
  async saveData(
    key: string, 
    path: string, 
    data: any, 
    message: string,
    expectedType: 'array' | 'object' = 'array'
  ): Promise<boolean> {
    // Validate data before saving
    if (!this.validateData(data, expectedType)) {
      console.error(`Invalid data structure for ${key}`);
      return false;
    }

    // Save to local storage immediately (fast, reliable)
    const localSuccess = this.saveToLocalStorage(key, data);
    
    // Try to save to GitHub (slower, may fail)
    const githubSuccess = await this.saveToGitHub(path, data, message);
    
    // Return true if at least local storage succeeded
    if (localSuccess) {
      if (!githubSuccess) {
        console.warn(`Data saved locally for ${key} but GitHub sync failed`);
      }
      return true;
    }
    
    return false;
  }

  // Sync local data to GitHub (for recovery)
  async syncToGitHub(key: string, path: string, message: string): Promise<boolean> {
    const localData = this.getFromLocalStorage(key);
    if (localData === null) {
      console.warn(`No local data found for ${key} to sync`);
      return false;
    }

    return await this.saveToGitHub(path, localData, message);
  }

  // Check if data exists in any source
  async hasData(key: string, path: string): Promise<boolean> {
    const localData = this.getFromLocalStorage(key);
    if (localData !== null) return true;

    const githubData = await this.getFromGitHub(path);
    return githubData !== null;
  }

  // Clear all data from all sources
  async clearAllData(key: string, path: string): Promise<boolean> {
    let success = true;
    
    // Clear local storage
    if (this.config.enableLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error clearing localStorage for ${key}:`, error);
        success = false;
      }
    }

    // Clear GitHub data
    if (this.config.enableGitHubSync) {
      try {
        await githubAPI.deleteFile(path, `Clear ${key} data`);
      } catch (error) {
        console.error(`Error clearing GitHub data for ${path}:`, error);
        success = false;
      }
    }

    return success;
  }
}

// Create singleton instance
export const dataPersistence = new DataPersistenceService();

// Convenience functions for specific data types
export const getProductsData = async () => {
  return await dataPersistence.getData('products', 'data/products.json', 'array', []);
};

export const saveProductsData = async (products: any[]) => {
  return await dataPersistence.saveData('products', 'data/products.json', products, 'Update products', 'array');
};

export const getOrdersData = async () => {
  return await dataPersistence.getData('orders', 'data/orders.json', 'array', []);
};

export const saveOrdersData = async (orders: any[]) => {
  return await dataPersistence.saveData('orders', 'data/orders.json', orders, 'Update orders', 'array');
};

export const getHighlightsData = async () => {
  return await dataPersistence.getData('highlights', 'data/highlights.json', 'array', []);
};

export const saveHighlightsData = async (highlights: any[]) => {
  return await dataPersistence.saveData('highlights', 'data/highlights.json', highlights, 'Update highlights', 'array');
};

// Emergency recovery functions
export const emergencySyncToGitHub = async () => {
  const results = {
    products: false,
    orders: false,
    highlights: false
  };

  try {
    results.products = await dataPersistence.syncToGitHub('products', 'data/products.json', 'Emergency sync products');
    results.orders = await dataPersistence.syncToGitHub('orders', 'data/orders.json', 'Emergency sync orders');
    results.highlights = await dataPersistence.syncToGitHub('highlights', 'data/highlights.json', 'Emergency sync highlights');
  } catch (error) {
    console.error('Emergency sync failed:', error);
  }

  return results;
};

export default DataPersistenceService;
