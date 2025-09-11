import { useState, useEffect } from "react";
import { clearAllData, checkDataStatus } from "../utils/clear-all-data";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useProducts } from "../hooks/use-products";
import { useHighlights } from "../hooks/use-highlights";
import { uploadImageToGitHub, resizeImage } from "../utils/image-upload";
import { cleanProductsData } from "../utils/clean-products";
import { uploadCleanProducts } from "../utils/upload-clean-data";
import * as XLSX from 'xlsx';
import { useAnimatedNotification } from "../contexts/AnimatedNotificationContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressBar from "../components/ProgressBar";

import { useOrders } from "../hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Package, 
  Image as ImageIcon,
  Save,
  X,
  Megaphone,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Receipt,
  Upload
} from "lucide-react";
import { Product } from "../types/product";
import { Order } from "../hooks/use-orders";
import GitHubTest from "../components/GitHubTest";
import BillingComponent from "../components/BillingComponent";

interface AdminProduct extends Product {
  imageUrl?: string;
}

const AdminDashboard = () => {
  const { products, categories, addProduct, addBulkProducts, updateProduct, deleteProduct } = useProducts();
  const { highlights, addHighlight, removeHighlight, updateHighlight, resetToBase: resetHighlights } = useHighlights();
  const { showNotification } = useAnimatedNotification();

  const { orders, loading: ordersLoading, updateOrderStatus, deleteOrder, getTotalRevenue, getTotalRevenueIncludingCancelled, getCancelledOrdersAmount, getOrdersCountByStatus } = useOrders();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    inStock: true,
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [editingHighlightIndex, setEditingHighlightIndex] = useState<number | null>(null);
  const [editingHighlightText, setEditingHighlightText] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  
  // Bulk upload state
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<AdminProduct[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  
  // Offset state variables for each metric
  // These values persist in localStorage across page refreshes
  const [offsetProducts, setOffsetProducts] = useState(() => {
    const saved = localStorage.getItem('offsetProducts');
    return saved ? parseInt(saved) : 0;
  });
  const [offsetOrders, setOffsetOrders] = useState(() => {
    const saved = localStorage.getItem('offsetOrders');
    return saved ? parseInt(saved) : 0;
  });
  const [offsetRevenue, setOffsetRevenue] = useState(() => {
    const saved = localStorage.getItem('offsetRevenue');
    return saved ? parseInt(saved) : 0;
  });
  const [offsetGrossRevenue, setOffsetGrossRevenue] = useState(() => {
    const saved = localStorage.getItem('offsetGrossRevenue');
    return saved ? parseInt(saved) : 0;
  });
  const [offsetPendingOrders, setOffsetPendingOrders] = useState(() => {
    const saved = localStorage.getItem('offsetPendingOrders');
    return saved ? parseInt(saved) : 0;
  });
  const [offsetBillingReady, setOffsetBillingReady] = useState(() => {
    const saved = localStorage.getItem('offsetBillingReady');
    return saved ? parseInt(saved) : 0;
  });
  
  const navigate = useNavigate();

  // Check authentication and add auto-logout functionality
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
    if (!isLoggedIn) {
      navigate("/admin");
      return;
    }

    // Note: Removed auto-logout on tab visibility change to prevent logout when switching tabs

    // Note: Removed beforeunload handler to prevent logout on page refresh

    // Auto-logout after 30 minutes of inactivity
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      
      // Show warning after 25 minutes
      warningTimer = setTimeout(() => {
        setShowSessionWarning(true);
      }, 25 * 60 * 1000); // 25 minutes
      
      // Logout after 30 minutes
      inactivityTimer = setTimeout(() => {
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminUsername");
        navigate("/admin");
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Set up event listeners
    // Note: Removed beforeunload listener to prevent logout on page refresh
    
    // Reset inactivity timer on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Start inactivity timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [navigate]);



  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (file) {
      try {
        // Show loading state
        setImagePreview("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VcGxvYWRpbmcuLi48L3RleHQ+PC9zdmc+");
        
        // Resize image to 300x300
        const resizedFile = await resizeImage(file);
        
        // Upload to GitHub and get URL
        const imageUrl = await uploadImageToGitHub(resizedFile, formData.name || 'product');
        
        setImagePreview(imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
        
        showNotification({
          type: 'success',
          title: 'Image Uploaded',
          message: 'Product image uploaded successfully!',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        
        // Fallback to placeholder image instead of failing completely
        const placeholderUrl = '/images/placeholder.svg';
        setImagePreview(placeholderUrl);
        setFormData(prev => ({ ...prev, imageUrl: placeholderUrl }));
        
        showNotification({
          type: 'warning',
          title: 'Image Upload Failed',
          message: 'Using placeholder image. Product will still be saved.',
        });
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      inStock: true,
      imageUrl: ""
    });
    setImagePreview("");
    setError("");
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (product: AdminProduct) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      inStock: product.inStock,
      imageUrl: product.imageUrl || ""
    });
    setImagePreview(product.imageUrl || "");
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      setError("Name, price, and category are required");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let operationSuccess = false;
      
      if (editingProduct) {
        // Edit existing product
        const success = await updateProduct(editingProduct.id, {
          name: formData.name,
          price,
          category: formData.category,
          description: formData.description,
          inStock: formData.inStock,
          image: formData.imageUrl || "/images/placeholder.svg"
        });
        
        if (success) {
          showNotification({
            type: 'success',
            title: '✅ Product Updated',
            message: `Product "${formData.name}" has been updated successfully!`,
            duration: 4000,
          });
          operationSuccess = true;
        } else {
          showNotification({
            type: 'error',
            title: '❌ Update Failed',
            message: 'Failed to update product. Please try again.',
            duration: 5000,
          });
        }
      } else {
        // Add new product
        const success = await addProduct({
          name: formData.name,
          price,
          category: formData.category,
          description: formData.description,
          inStock: formData.inStock,
          image: formData.imageUrl || "/images/placeholder.svg"
        });
        
        if (success) {
          showNotification({
            type: 'success',
            title: '✅ Product Added',
            message: `New product "${formData.name}" has been added successfully!`,
            duration: 4000,
          });
          operationSuccess = true;
        } else {
          showNotification({
            type: 'error',
            title: '❌ Add Failed',
            message: 'Failed to add product. Please try again.',
            duration: 5000,
          });
        }
      }

      if (operationSuccess) {
        resetForm();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingProduct(null);
      }
    } catch (err) {
      setError("An error occurred while saving the product");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          showNotification({
            type: 'success',
            title: '✅ Product Deleted',
            message: 'Product has been deleted successfully!',
            duration: 4000,
          });
        } else {
          showNotification({
            type: 'error',
            title: '❌ Delete Failed',
            message: 'Failed to delete product. Please try again.',
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('❌ Product delete error:', err);
        showNotification({
          type: 'error',
          title: '❌ Delete Error',
          message: 'An error occurred while deleting the product.',
          duration: 5000,
        });
      }
    }
  };

  // Bulk upload functions
  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkUploadFile(file);
    setBulkUploadError("");
    setBulkUploadSuccess("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setBulkUploadError("Excel file is empty or has no data");
          return;
        }

        // Map Excel columns to product schema
        const products: AdminProduct[] = jsonData.map((row: any, index: number) => ({
          id: `bulk-${Date.now()}-${index}`,
          name: row.Name || row.name || `Product ${index + 1}`,
          price: parseFloat(row.Price || row.price || 0),
          category: row.Category || row.category || 'Uncategorized',
          description: row.Description || row.description || '',
          inStock: row.InStock === 'TRUE' || row.InStock === true || row.inStock === 'TRUE' || row.inStock === true,
          image: row.ImageURL || row.imageURL || row.Image || row.image || '/images/placeholder.svg'
        }));

        // Validate products
        const validProducts = products.filter(product => 
          product.name && product.price > 0 && product.category
        );

        if (validProducts.length === 0) {
          setBulkUploadError("No valid products found. Please check your Excel format.");
          return;
        }

        setParsedProducts(validProducts);
        setBulkUploadSuccess(`Successfully parsed ${validProducts.length} products from Excel file`);
        
        showNotification({
          type: 'success',
          title: '✅ Excel File Parsed',
          message: `Successfully parsed ${validProducts.length} products from Excel file`,
          duration: 4000,
        });

      } catch (error) {
        console.error('Excel parsing error:', error);
        setBulkUploadError("Failed to parse Excel file. Please check the format.");
        showNotification({
          type: 'error',
          title: '❌ Excel Parse Error',
          message: 'Failed to parse Excel file. Please check the format.',
          duration: 5000,
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkUpload = async () => {
    if (parsedProducts.length === 0) {
      setBulkUploadError("No products to upload");
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadProgress(0);
    setBulkUploadError("");

    try {
      console.log(`🚀 Starting bulk upload of ${parsedProducts.length} products`);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setBulkUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const success = await addBulkProducts(parsedProducts);
      
      clearInterval(progressInterval);
      setBulkUploadProgress(100);

      if (success) {
        setBulkUploadSuccess(`Successfully uploaded ${parsedProducts.length} products to GitHub!`);
        setParsedProducts([]);
        setBulkUploadFile(null);
        
        showNotification({
          type: 'success',
          title: '✅ Bulk Upload Complete',
          message: `Successfully uploaded ${parsedProducts.length} products to GitHub!`,
          duration: 5000,
        });
        
        console.log('✅ Bulk upload completed successfully');
      } else {
        setBulkUploadError("Failed to upload products. Please try again.");
        showNotification({
          type: 'error',
          title: '❌ Bulk Upload Failed',
          message: 'Failed to upload products. Please try again.',
          duration: 6000,
        });
        console.log('❌ Bulk upload failed');
      }
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      setBulkUploadError("An error occurred during bulk upload");
      showNotification({
        type: 'error',
        title: '❌ Bulk Upload Error',
        message: 'An error occurred during bulk upload. Please try again.',
        duration: 6000,
      });
    } finally {
      setIsBulkUploading(false);
      setBulkUploadProgress(0);
    }
  };

  const handleClearBulkUpload = () => {
    setBulkUploadFile(null);
    setParsedProducts([]);
    setBulkUploadError("");
    setBulkUploadSuccess("");
    setBulkUploadProgress(0);
  };

  // Clean up products data (remove base64 images)
  const handleCleanProducts = async () => {
    if (window.confirm("This will remove all base64 images from products and replace them with placeholder URLs. Continue?")) {
      try {
        await cleanProductsData();
        setSuccess("Products cleaned successfully! Base64 images removed.");
        setTimeout(() => setSuccess(""), 5000);
        // Refresh the page to reload products
        window.location.reload();
      } catch (err) {
        setError("Failed to clean products data");
        console.error(err);
      }
    }
  };

  // Upload clean products to GitHub
  const handleUploadCleanProducts = async () => {
    if (window.confirm("This will upload the clean products.json to GitHub. Continue?")) {
      try {
        const success = await uploadCleanProducts();
        if (success) {
          setSuccess("Clean products uploaded to GitHub successfully!");
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError("Failed to upload clean products to GitHub");
        }
      } catch (err) {
        setError("Failed to upload clean products");
        console.error(err);
      }
    }
  };

  // Update order status
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log(`🚀 Updating order ${orderId} to status: ${newStatus}`);
      const success = await updateOrderStatus(orderId, newStatus);
      
      if (success) {
        showNotification({
          type: 'success',
          title: '✅ Order Status Updated',
          message: `Order #${orderId} status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          duration: 4000,
        });
        console.log('✅ Order status updated successfully');
      } else {
        showNotification({
          type: 'error',
          title: '❌ Update Failed',
          message: 'Failed to update order status. Data saved locally as fallback.',
          duration: 6000,
        });
        console.log('❌ Order status update failed');
      }
    } catch (err) {
      console.error('❌ Order update error:', err);
      showNotification({
        type: 'error',
        title: '❌ Update Error',
        message: 'An error occurred while updating order status. Please try again.',
        duration: 5000,
      });
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        console.log(`🗑️ Deleting order ${orderId}`);
        const success = await deleteOrder(orderId);
        
        if (success) {
          showNotification({
            type: 'success',
            title: '✅ Order Deleted',
            message: `Order #${orderId} has been successfully deleted from the system.`,
            duration: 4000,
          });
          console.log('✅ Order deleted successfully');
        } else {
          showNotification({
            type: 'error',
            title: '❌ Delete Failed',
            message: 'Failed to delete order. Please try again.',
            duration: 5000,
          });
          console.log('❌ Order delete failed');
        }
      } catch (err) {
        console.error('❌ Order delete error:', err);
        showNotification({
          type: 'error',
          title: '❌ Delete Error',
          message: 'An error occurred while deleting the order.',
          duration: 5000,
        });
      }
    }
  };

  // Reset functions for each metric using offset approach
  // When reset is clicked, we store the current value as an offset
  // Displayed value = actual value - offset (so it shows 0 initially)
  const handleResetProducts = () => {
    const currentValue = products.length;
    setOffsetProducts(currentValue);
    localStorage.setItem('offsetProducts', currentValue.toString());
    setSuccess(`Products count reset to 0! (offset: ${currentValue})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResetOrders = () => {
    const currentValue = orders.length;
    setOffsetOrders(currentValue);
    localStorage.setItem('offsetOrders', currentValue.toString());
    setSuccess(`Orders count reset to 0! (offset: ${currentValue})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResetRevenue = () => {
    const currentValue = totalRevenue;
    setOffsetRevenue(currentValue);
    localStorage.setItem('offsetRevenue', currentValue.toString());
    setSuccess(`Revenue reset to ₹0! (offset: ₹${currentValue.toLocaleString('en-IN')})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResetGrossRevenue = () => {
    const currentValue = totalRevenueIncludingCancelled;
    setOffsetGrossRevenue(currentValue);
    localStorage.setItem('offsetGrossRevenue', currentValue.toString());
    setSuccess(`Gross revenue reset to ₹0! (offset: ₹${currentValue.toLocaleString('en-IN')})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResetPendingOrders = () => {
    const currentValue = orderCounts.pending;
    setOffsetPendingOrders(currentValue);
    localStorage.setItem('offsetPendingOrders', currentValue.toString());
    setSuccess(`Pending orders reset to 0! (offset: ${currentValue})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResetBillingReady = () => {
    const currentValue = products.filter(p => p.inStock).length;
    setOffsetBillingReady(currentValue);
    localStorage.setItem('offsetBillingReady', currentValue.toString());
    setSuccess(`Billing ready count reset to 0! (offset: ${currentValue})`);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Function to restore original values from GitHub data
  const handleRestoreAll = () => {
    // Clear all offsets
    setOffsetProducts(0);
    setOffsetOrders(0);
    setOffsetRevenue(0);
    setOffsetGrossRevenue(0);
    setOffsetPendingOrders(0);
    setOffsetBillingReady(0);
    
    // Clear localStorage
    localStorage.removeItem('offsetProducts');
    localStorage.removeItem('offsetOrders');
    localStorage.removeItem('offsetRevenue');
    localStorage.removeItem('offsetGrossRevenue');
    localStorage.removeItem('offsetPendingOrders');
    localStorage.removeItem('offsetBillingReady');
    
    setSuccess("All metrics restored to original values from GitHub data!");
    setTimeout(() => setSuccess(""), 3000);
  };

