import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { saveProducts, saveProductsFast, getProducts } from '../utils/github-api';
import { getProductsData, saveProductsData, emergencySyncToGitHub } from '../utils/data-persistence';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use robust data persistence with multiple fallbacks
        const fetchedProducts = await getProductsData();
        setProducts(fetchedProducts);
        
        console.log(`Loaded ${fetchedProducts.length} products from data persistence service`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
        setError(errorMessage);
        console.error('Error fetching products:', err);
        
        // Set empty array as fallback
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save products using robust data persistence
  const saveProductsToGitHub = async (newProducts: Product[]) => {
    try {
      const success = await saveProductsData(newProducts);
      if (success) {
        setProducts(newProducts);
        return true;
      } else {
        setError('Failed to save products (local storage may have succeeded)');
        return false;
      }
    } catch (err) {
      setError('Failed to save products');
      console.error('Error saving products:', err);
      return false;
    }
  };

  // Add new product (fast upload with fallback)
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    
    const updatedProducts = [...products, newProduct];
    
    try {
      // Try fast upload first
      let success = await saveProductsFast(updatedProducts);
      
      if (!success) {
        console.log('Fast upload failed, trying regular upload...');
        // Fallback to regular upload if fast upload fails
        success = await saveProductsToGitHub(updatedProducts);
      }
      
      if (success) {
        setProducts(updatedProducts);
        return true;
      } else {
        setError('Failed to save product to GitHub');
        return false;
      }
    } catch (err) {
      setError('Failed to save product');
      console.error('Error saving product:', err);
      return false;
    }
  };

  // Add multiple products in bulk (single API call)
  const bulkAddProducts = async (newProducts: Omit<Product, 'id'>[]) => {
    const productsWithIds: Product[] = newProducts.map(product => ({
      ...product,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    const updatedProducts = [...products, ...productsWithIds];
    const success = await saveProductsToGitHub(updatedProducts);
    
    // If successful, refresh the products from GitHub to ensure we have the latest state
    if (success) {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error refreshing products after bulk upload:', err);
      }
    }
    
    return success;
  };

  // Update product (fast upload with fallback)
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, ...updates } : product
    );
    
    try {
      // Try fast upload first
      let success = await saveProductsFast(updatedProducts);
      
      if (!success) {
        console.log('Fast update failed, trying regular upload...');
        // Fallback to regular upload if fast upload fails
        success = await saveProductsToGitHub(updatedProducts);
      }
      
      if (success) {
        setProducts(updatedProducts);
        return true;
      } else {
        setError('Failed to update product in GitHub');
        return false;
      }
    } catch (err) {
      setError('Failed to update product');
      console.error('Error updating product:', err);
      return false;
    }
  };

  // Delete product (fast upload with fallback)
  const deleteProduct = async (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    
    try {
      // Try fast upload first
      let success = await saveProductsFast(updatedProducts);
      
      if (!success) {
        console.log('Fast delete failed, trying regular upload...');
        // Fallback to regular upload if fast upload fails
        success = await saveProductsToGitHub(updatedProducts);
      }
      
      if (success) {
        setProducts(updatedProducts);
        return true;
      } else {
        setError('Failed to delete product from GitHub');
        return false;
      }
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
      return false;
    }
  };

  // Refresh products using robust data persistence
  const refreshProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedProducts = await getProductsData();
      setProducts(fetchedProducts);
      
      console.log(`Refreshed ${fetchedProducts.length} products from data persistence service`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh products';
      setError(errorMessage);
      console.error('Error refreshing products:', err);
      
      // Set empty array as fallback
      setProducts([]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Emergency recovery function
  const emergencyRecovery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting emergency recovery...');
      const results = await emergencySyncToGitHub();
      
      if (results.products) {
        const fetchedProducts = await getProductsData();
        setProducts(fetchedProducts);
        console.log('Emergency recovery successful for products');
        return true;
      } else {
        setError('Emergency recovery failed - no data sources available');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Emergency recovery failed';
      setError(errorMessage);
      console.error('Emergency recovery error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generate categories dynamically from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  return { 
    products, 
    categories, 
    loading, 
    error,
    addProduct,
    bulkAddProducts,
    updateProduct,
    deleteProduct,
    saveProductsToGitHub,
    refreshProducts,
    emergencyRecovery
  };
};
