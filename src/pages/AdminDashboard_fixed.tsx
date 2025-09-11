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







  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    navigate("/");
  };

  // Extend session manually
  const extendSession = () => {
    setShowSessionWarning(false);
    // Reset the inactivity timer by dispatching a click event
    document.dispatchEvent(new Event('click'));
    setSuccess("Session extended successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const orderCounts = getOrdersCountByStatus();
  const totalRevenue = getTotalRevenue();
  const totalRevenueIncludingCancelled = getTotalRevenueIncludingCancelled();
  const cancelledOrdersAmount = getCancelledOrdersAmount();








  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {showSessionWarning && (
                <div className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                  ⏰ Session expires in 5 min
                </div>
              )}
              <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto flex items-center justify-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Session Timeout Warning */}
        {showSessionWarning && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              ⚠️ <strong>Session Timeout Warning:</strong> Your session will expire in 5 minutes due to inactivity. 
              Please save your work and refresh the page to extend your session.
            </AlertDescription>
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={extendSession}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                Extend Session
              </Button>
            </div>
          </Alert>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setError("")}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Dismiss
              </Button>
            </div>
          </Alert>
        )}

                 {/* Dashboard Stats */}
         <div className="mb-6 space-y-4">
           {/* Mobile-first button layout */}
           <div className="flex flex-col sm:flex-row gap-3">
             <Button
               variant="outline"
               onClick={handleRestoreAll}
               className="w-full sm:w-auto hover:bg-green-50 hover:text-green-600 hover:border-green-300"
             >
               <Package className="h-4 w-4 mr-2" />
               Restore All
             </Button>
             <Button
               variant="outline"
               onClick={() => {
                 // Set offsets to current values for all metrics
                 setOffsetProducts(products.length);
                 setOffsetOrders(orders.length);
                 setOffsetRevenue(totalRevenue);
                 setOffsetGrossRevenue(totalRevenueIncludingCancelled);
                 setOffsetPendingOrders(orderCounts.pending);
                 setOffsetBillingReady(products.filter(p => p.inStock).length);
                 
                 // Save to localStorage
                 localStorage.setItem('offsetProducts', products.length.toString());
                 localStorage.setItem('offsetProducts', orders.length.toString());
                 localStorage.setItem('offsetRevenue', totalRevenue.toString());
                 localStorage.setItem('offsetGrossRevenue', totalRevenueIncludingCancelled.toString());
                 localStorage.setItem('offsetPendingOrders', orderCounts.pending.toString());
                 localStorage.setItem('offsetBillingReady', products.filter(p => p.inStock).length.toString());
                 
                 setSuccess("All metrics reset to 0!");
                 setTimeout(() => setSuccess(""), 3000);
               }}
               className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600 hover:border-red-300"
             >
               <RotateCcw className="h-4 w-4 mr-2" />
               Reset All Metrics
             </Button>
             <Button
               variant="outline"
               onClick={async () => {
                 if (window.confirm("⚠️ Are you sure you want to clear ALL data? This will remove all products, orders, and highlights from your GitHub repository. This action cannot be undone!")) {
                   setSuccess("🔄 Clearing all data...");
                   const result = await clearAllData();
                   if (result) {
                     setSuccess("✅ All data cleared successfully! Refreshing page...");
                     setTimeout(() => window.location.reload(), 2000);
                   } else {
                     setError("❌ Failed to clear data. Check console for details.");
                   }
                 }
               }}
               className="w-full sm:w-auto hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
             >
               🗑️ Clear All Data
             </Button>
           </div>
         </div>
         
         {/* Mobile-first responsive grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                    <p className={`text-xl sm:text-2xl font-bold ${offsetProducts > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {Math.max(0, products.length - offsetProducts)}
                    </p>
                    {offsetProducts > 0 && (
                      <p className="text-xs text-red-500 font-medium">RESET</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetProducts}
                  className="w-full sm:w-auto h-8 px-3 sm:px-0 sm:h-8 sm:w-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                  title="Reset to 0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sm:hidden ml-2">Reset</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                    <p className={`text-xl sm:text-2xl font-bold ${offsetOrders > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {Math.max(0, orders.length - offsetOrders)}
                    </p>
                    {offsetOrders > 0 && (
                      <p className="text-xs text-red-500 font-medium">RESET</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetOrders}
                  className="w-full sm:w-auto h-8 px-3 sm:px-0 sm:h-8 sm:w-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                  title="Reset to 0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sm:hidden ml-2">Reset</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className={`text-2xl font-bold ${offsetRevenue > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {formatCurrency(Math.max(0, totalRevenue - offsetRevenue))}
                    </p>
                    {offsetRevenue > 0 && (
                      <p className="text-xs text-red-500 font-medium">RESET</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Net (excluding cancelled: {formatCurrency(cancelledOrdersAmount)})
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetRevenue}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  title="Reset to ₹0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                    <p className={`text-2xl font-bold ${offsetGrossRevenue > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {formatCurrency(Math.max(0, totalRevenueIncludingCancelled - offsetGrossRevenue))}
                    </p>
                    {offsetGrossRevenue > 0 && (
                      <p className="text-xs text-red-500 font-medium">RESET</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Including cancelled orders
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetGrossRevenue}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  title="Reset to ₹0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

                     <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <Users className="h-8 w-8 text-orange-600" />
                   <div>
                     <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                     <p className={`text-2xl font-bold ${offsetPendingOrders > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                       {Math.max(0, orderCounts.pending - offsetPendingOrders)}
                     </p>
                     {offsetPendingOrders > 0 && (
                       <p className="text-xs text-red-500 font-medium">RESET</p>
                     )}
                   </div>
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={handleResetPendingOrders}
                   className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                   title="Reset to 0"
                 >
                   <RotateCcw className="h-4 w-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <Receipt className="h-8 w-8 text-indigo-600" />
                   <div>
                     <p className="text-sm font-medium text-gray-600">Billing Ready</p>
                                                               <p className={`text-2xl font-bold ${offsetBillingReady > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                       {Math.max(0, products.filter(p => p.inStock).length - offsetBillingReady)}
                     </p>
                     {offsetBillingReady > 0 && (
                       <p className="text-xs text-red-500 font-medium">RESET</p>
                     )}
                     <p className="text-xs text-gray-500">Products in stock</p>
                   </div>
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={handleResetBillingReady}
                   className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                   title="Reset to 0"
                 >
                   <RotateCcw className="h-4 w-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Revenue Information Note */}
        <div className="mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Revenue Calculation</h3>
                  <p className="text-sm text-blue-700">
                    <strong>Net Revenue</strong> automatically excludes cancelled orders to show your actual earnings. 
                    <strong>Gross Revenue</strong> includes all orders for reference. 
                    When you cancel an order, its amount is automatically subtracted from the net revenue calculation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                   <TabsList className="grid w-full grid-cols-4">
           <TabsTrigger value="products">Products</TabsTrigger>
           <TabsTrigger value="orders">Orders</TabsTrigger>
           <TabsTrigger value="billing">Billing</TabsTrigger>
           <TabsTrigger value="settings">Settings</TabsTrigger>
         </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Add Product Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
              <div className="flex gap-2">
                {/* <Button 
                  onClick={handleCleanProducts} 
                  variant="outline" 
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clean Images
                </Button>
                <Button 
                  onClick={handleUploadCleanProducts} 
                  variant="outline" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Upload Clean Data
                </Button> */}
                <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </div>
            </div>

            {/* Bulk Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bulk Upload Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-upload-file">Upload Excel File (.xlsx or .xls)</Label>
                  <Input
                    id="bulk-upload-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500">
                    Excel file must have columns: Name, Price, Category, Description, InStock, ImageURL
                  </p>
                </div>

                {bulkUploadError && (
                  <Alert variant="destructive">
                    <AlertDescription>{bulkUploadError}</AlertDescription>
                  </Alert>
                )}

                {bulkUploadSuccess && (
                  <Alert>
                    <AlertDescription className="text-green-600">{bulkUploadSuccess}</AlertDescription>
                  </Alert>
                )}

                {parsedProducts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Preview ({parsedProducts.length} products)</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleClearBulkUpload}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                        <Button
                          onClick={handleBulkUpload}
                          disabled={isBulkUploading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isBulkUploading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Upload to GitHub
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {isBulkUploading && (
                      <div className="space-y-2">
                        <ProgressBar
                          progress={bulkUploadProgress}
                          text="Uploading products..."
                          showPercentage={true}
                        />
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>In Stock</TableHead>
                            <TableHead>Image</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedProducts.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>₹{product.price}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>
                                <Badge variant={product.inStock ? "default" : "secondary"}>
                                  {product.inStock ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-8 h-8 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No products available. Add your first product to get started!
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id} className="transition-all duration-200 hover:bg-gray-50">
                          <TableCell>
                            <img 
                              src={product.image || "/images/placeholder.svg"} 
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.svg";
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{product.price}</TableCell>
                          <TableCell>
                            <Badge variant={product.inStock ? "default" : "secondary"}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(product as AdminProduct)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Bulk Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bulk Upload Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="bulk-upload">Upload Excel File (.xlsx, .xls)</Label>
                  <Input
                    id="bulk-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkFileUpload}
                    disabled={isBulkUploading}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500">
                    Excel format: Name, Price, Category, Description, InStock (TRUE/FALSE), ImageURL
                  </p>
                </div>

                {/* Error/Success Messages */}
                {bulkUploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{bulkUploadError}</p>
                  </div>
                )}
                {bulkUploadSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{bulkUploadSuccess}</p>
                  </div>
                )}

                {/* Preview Table */}
                {parsedProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Preview ({parsedProducts.length} products)</h4>
                    <div className="border rounded-md max-h-60 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Price</th>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-left">In Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedProducts.slice(0, 10).map((product, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{product.name}</td>
                              <td className="px-3 py-2">₹{product.price}</td>
                              <td className="px-3 py-2">{product.category}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  product.inStock 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.inStock ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {parsedProducts.length > 10 && (
                            <tr className="border-t bg-gray-50">
                              <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                                ... and {parsedProducts.length - 10} more products
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {isBulkUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading products...</span>
                      <span>{bulkUploadProgress}%</span>
                    </div>
                    <ProgressBar progress={bulkUploadProgress} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkUpload}
                    disabled={parsedProducts.length === 0 || isBulkUploading}
                    className="flex items-center gap-2"
                  >
                    {isBulkUploading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload to GitHub
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClearBulkUpload}
                    variant="outline"
                    disabled={isBulkUploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
            
            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(orderCounts).map(([status, count]) => (
                <Card key={status}>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Information */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-800">Revenue Calculation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Net Revenue:</span>
                    <span className="text-blue-900 font-bold ml-2">{formatCurrency(totalRevenue)}</span>
                    <p className="text-blue-600 text-xs">(excluding cancelled orders)</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Gross Revenue:</span>
                    <span className="text-blue-900 font-bold ml-2">{formatCurrency(totalRevenueIncludingCancelled)}</span>
                    <p className="text-blue-600 text-xs">(including all orders)</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Cancelled Amount:</span>
                    <span className="text-blue-900 font-bold ml-2">{formatCurrency(cancelledOrdersAmount)}</span>
                    <p className="text-blue-600 text-xs">(automatically excluded from net)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Loading orders...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No orders available yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">#{order.id.slice(-6)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-gray-500">{order.customerPhone}</div>
                                {order.customerEmail && (
                                  <div className="text-sm text-gray-500">{order.customerEmail}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {order.orderItems.map((item, index) => (
                                  <div key={index}>
                                    {item.productName} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className={`${order.status === 'cancelled' ? 'text-red-600 line-through' : ''}`}>
                                {formatCurrency(order.orderTotal)}
                              </div>
                              {order.status === 'cancelled' && (
                                <div className="text-xs text-red-500">
                                  Excluded from revenue
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(value: Order['status']) => handleOrderStatusUpdate(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
                     </TabsContent>

           {/* Billing Tab */}
           <TabsContent value="billing" className="space-y-6">
             <h2 className="text-xl font-semibold text-gray-900">Billing & Invoicing</h2>
             <BillingComponent products={products} />
           </TabsContent>

           {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            
            {/* Highlights Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Megaphone className="h-6 w-6 text-primary" />
                  <span>Highlights Management</span>
                  {highlightsLoading && (
                    <div className="flex items-center space-x-2 ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-500">Saving...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      placeholder="Enter new highlight text"
                      className="flex-1"
                      disabled={highlightsLoading}
                    />
                    <Button 
                      onClick={async () => {
                        if (newHighlight.trim()) {
                          setHighlightsLoading(true);
                          setHighlightsError(null);
                          try {
                            await addHighlight(newHighlight.trim());
                            setNewHighlight("");
                            setSuccess("Highlight added successfully!");
                            setTimeout(() => setSuccess(""), 3000);
                          } catch (err) {
                            setHighlightsError("Failed to add highlight. Please try again.");
                            console.error("Error adding highlight:", err);
                          } finally {
                            setHighlightsLoading(false);
                          }
                        }
                      }}
                      disabled={highlightsLoading || !newHighlight.trim()}
                      className="min-w-[120px]"
                    >
                      {highlightsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        "Add Highlight"
                      )}
                    </Button>
                  </div>

                  {/* Error Display */}
                  {highlightsError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{highlightsError}</AlertDescription>
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setHighlightsError(null)}
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    {highlightsLoading && highlights.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading highlights...</p>
                      </div>
                    ) : highlights.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>No highlights available. Add your first highlight above!</p>
                      </div>
                    ) : (
                      highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {editingHighlightIndex === index ? (
                          <>
                            <Input
                              value={editingHighlightText}
                              onChange={(e) => setEditingHighlightText(e.target.value)}
                              className="flex-1"
                            />
                                                                                     <Button
                              size="sm"
                              onClick={async () => {
                                setHighlightsLoading(true);
                                setHighlightsError(null);
                                try {
                                  await updateHighlight(index, editingHighlightText);
                                  setEditingHighlightIndex(null);
                                  setEditingHighlightText("");
                                  setSuccess("Highlight updated successfully!");
                                  setTimeout(() => setSuccess(""), 3000);
                                } catch (err) {
                                  setHighlightsError("Failed to update highlight. Please try again.");
                                  console.error("Error updating highlight:", err);
                                } finally {
                                  setHighlightsLoading(false);
                                }
                              }}
                              disabled={highlightsLoading}
                            >
                              {highlightsLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingHighlightIndex(null);
                                setEditingHighlightText("");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1">{highlight}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingHighlightIndex(index);
                                setEditingHighlightText(highlight);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to remove this highlight?")) {
                                  setHighlightsLoading(true);
                                  setHighlightsError(null);
                                  try {
                                    await removeHighlight(index);
                                    setSuccess("Highlight removed successfully!");
                                    setTimeout(() => setSuccess(""), 3000);
                                  } catch (err) {
                                    setHighlightsError("Failed to remove highlight. Please try again.");
                                    console.error("Error removing highlight:", err);
                                  } finally {
                                    setHighlightsLoading(false);
                                  }
                                }
                              }}
                              disabled={highlightsLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))
                    )}
                  </div>
                  
                                                         <Button 
                      variant="outline" 
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to reset all highlights to default? This cannot be undone.")) {
                          setHighlightsLoading(true);
                          setHighlightsError(null);
                          try {
                            await resetHighlights();
                            setSuccess("Highlights reset to default successfully!");
                            setTimeout(() => setSuccess(""), 3000);
                          } catch (err) {
                            setHighlightsError("Failed to reset highlights. Please try again.");
                            console.error("Error resetting highlights:", err);
                          } finally {
                            setHighlightsLoading(false);
                          }
                        }
                      }}
                      disabled={highlightsLoading}
                      className="w-full"
                    >
                      {highlightsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resetting...
                        </>
                      ) : (
                        "Reset to Default"
                      )}
                    </Button>
                </CardContent>
              </Card>



             {/* GitHub API Test */}
             <GitHubTest />
           </TabsContent>
        </Tabs>

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="One crackers sound">One crackers sound</SelectItem>
                      <SelectItem value="Flower pots">Flower pots</SelectItem>
                      <SelectItem value="Ground crackers">Ground crackers</SelectItem>
                      <SelectItem value="Rockets">Rockets</SelectItem>
                      <SelectItem value="Twinkling star">Twinkling star</SelectItem>
                      <SelectItem value="Bijli Crackers">Bijli Crackers</SelectItem>
                      <SelectItem value="Festival zone - special">Festival zone - special</SelectItem>
                      <SelectItem value="Deluxe - special">Deluxe - special</SelectItem>
                      <SelectItem value="Bullet & Auto Bombs">Bullet & Auto Bombs</SelectItem>
                      <SelectItem value="Fountain & Blast">Fountain & Blast</SelectItem>
                      <SelectItem value="Paper bomb">Paper bomb</SelectItem>
                      <SelectItem value="Cartoon's & Fancy">Cartoon's & Fancy</SelectItem>
                      <SelectItem value="Magical Happy showers & Fountain">Magical Happy showers & Fountain</SelectItem>
                      <SelectItem value="Feather fantasy">Feather fantasy</SelectItem>
                      <SelectItem value="Glitter hand shower">Glitter hand shower</SelectItem>
                      <SelectItem value="Discover the new age of crackers">Discover the new age of crackers</SelectItem>
                      <SelectItem value="Children special">Children special</SelectItem>
                      <SelectItem value="Sparklers">Sparklers</SelectItem>
                      <SelectItem value="Single shot fancy">Single shot fancy</SelectItem>
                      <SelectItem value="Repeating multi colour">Repeating multi colour</SelectItem>
                      <SelectItem value="Blue star fancy">Blue star fancy</SelectItem>
                      <SelectItem value="Aerial crackling">Aerial crackling</SelectItem>
                      <SelectItem value="Gift boxes net rate">Gift boxes net rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inStock">Stock Status</Label>
                  <Select
                    value={formData.inStock.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, inStock: value === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">In Stock</SelectItem>
                      <SelectItem value="false">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image (300x300)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => {
                          setImagePreview("");
                          setFormData(prev => ({ ...prev, imageUrl: "" }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Adding...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="One crackers sound">One crackers sound</SelectItem>
                      <SelectItem value="Flower pots">Flower pots</SelectItem>
                      <SelectItem value="Ground crackers">Ground crackers</SelectItem>
                      <SelectItem value="Rockets">Rockets</SelectItem>
                      <SelectItem value="Twinkling star">Twinkling star</SelectItem>
                      <SelectItem value="Bijli Crackers">Bijli Crackers</SelectItem>
                      <SelectItem value="Festival zone - special">Festival zone - special</SelectItem>
                      <SelectItem value="Deluxe - special">Deluxe - special</SelectItem>
                      <SelectItem value="Bullet & Auto Bombs">Bullet & Auto Bombs</SelectItem>
                      <SelectItem value="Fountain & Blast">Fountain & Blast</SelectItem>
                      <SelectItem value="Paper bomb">Paper bomb</SelectItem>
                      <SelectItem value="Cartoon's & Fancy">Cartoon's & Fancy</SelectItem>
                      <SelectItem value="Magical Happy showers & Fountain">Magical Happy showers & Fountain</SelectItem>
                      <SelectItem value="Feather fantasy">Feather fantasy</SelectItem>
                      <SelectItem value="Glitter hand shower">Glitter hand shower</SelectItem>
                      <SelectItem value="Discover the new age of crackers">Discover the new age of crackers</SelectItem>
                      <SelectItem value="Children special">Children special</SelectItem>
                      <SelectItem value="Sparklers">Sparklers</SelectItem>
                      <SelectItem value="Single shot fancy">Single shot fancy</SelectItem>
                      <SelectItem value="Repeating multi colour">Repeating multi colour</SelectItem>
                      <SelectItem value="Blue star fancy">Blue star fancy</SelectItem>
                      <SelectItem value="Aerial crackling">Aerial crackling</SelectItem>
                      <SelectItem value="Gift boxes net rate">Gift boxes net rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-inStock">Stock Status</Label>
                  <Select
                    value={formData.inStock.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, inStock: value === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">In Stock</SelectItem>
                      <SelectItem value="false">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image (300x300)</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => {
                          setImagePreview("");
                          setFormData(prev => ({ ...prev, imageUrl: "" }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
