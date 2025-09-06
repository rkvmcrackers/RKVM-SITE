import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { saveProducts, getProducts } from '../utils/github-api';

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

  // Add new product
  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    
    const updatedProducts = [...products, newProduct];
    return await saveProductsToGitHub(updatedProducts);
  };

  // Update product
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, ...updates } : product
    );
    return await saveProductsToGitHub(updatedProducts);
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    return await saveProductsToGitHub(updatedProducts);
  };

  // Generate categories dynamically from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  return { 
    products, 
    categories, 
    loading, 
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    saveProductsToGitHub
  };
};
