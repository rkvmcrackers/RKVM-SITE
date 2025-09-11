import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { saveProducts, saveProductsFast, getProducts } from '../utils/github-api';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Get products from GitHub API
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Save products to GitHub
  const saveProductsToGitHub = async (newProducts: Product[]) => {
    try {
      const success = await saveProducts(newProducts);
      if (success) {
        setProducts(newProducts);
        return true;
      } else {
        setError('Failed to save products to GitHub');
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

  // Refresh products from GitHub
  const refreshProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
      console.error('Error refreshing products:', err);
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
    refreshProducts
  };
};
