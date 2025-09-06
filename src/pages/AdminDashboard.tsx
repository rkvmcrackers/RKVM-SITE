import { useState, useEffect } from "react";
import { clearAllData, checkDataStatus } from "../utils/clear-all-data";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useProducts } from "../hooks/use-products";
import { useHighlights } from "../hooks/use-highlights";

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
  Receipt
} from "lucide-react";
import { Product } from "../types/product";
import { Order } from "../hooks/use-orders";
import GitHubTest from "../components/GitHubTest";
import BillingComponent from "../components/BillingComponent";

interface AdminProduct extends Product {
  imageUrl?: string;
}

const AdminDashboard = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts();
  const { highlights, addHighlight, removeHighlight, updateHighlight, resetToBase: resetHighlights } = useHighlights();

  const { orders, loading: ordersLoading, updateOrderStatus, deleteOrder, getTotalRevenue, getTotalRevenueIncludingCancelled, getCancelledOrdersAmount, getOrdersCountByStatus } = useOrders();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
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

    // Auto-logout when tab is closed or becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden (minimized, switched, or closed)
        localStorage.removeItem("adminLoggedIn");
        localStorage.removeItem("adminUsername");
        navigate("/admin");
      }
    };

    // Auto-logout when tab is closed
    const handleBeforeUnload = () => {
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminUsername");
    };

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
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Reset inactivity timer on user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Start inactivity timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [navigate]);



  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 300;
          canvas.height = 300;
          
          // Calculate scaling to maintain aspect ratio
          const scale = Math.min(300 / img.width, 300 / img.height);
          const x = (300 - img.width * scale) / 2;
          const y = (300 - img.height * scale) / 2;
          
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
          
          const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(resizedImageUrl);
          setFormData(prev => ({ ...prev, imageUrl: resizedImageUrl }));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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
    
    if (!formData.name || !formData.price || !formData.category || !formData.description) {
      setError("All fields are required");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

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
          image: formData.imageUrl
        });
        
        if (success) {
          setSuccess("Product updated successfully!");
          operationSuccess = true;
        } else {
          setError("Failed to update product. This might be due to a temporary GitHub API issue. Please try again in a few moments.");
        }
      } else {
        // Add new product
        const success = await addProduct({
          name: formData.name,
          price,
          category: formData.category,
          description: formData.description,
          inStock: formData.inStock,
          image: formData.imageUrl
        });
        
        if (success) {
          setSuccess("Product added successfully!");
          operationSuccess = true;
        } else {
          setError("Failed to add product. This might be due to a temporary GitHub API issue. Please try again in a few moments.");
        }
      }

      if (operationSuccess) {
        resetForm();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("An error occurred while saving the product");
      console.error(err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          setSuccess("Product deleted successfully!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Failed to delete product");
        }
      } catch (err) {
        setError("An error occurred while deleting the product");
        console.error(err);
      }
    }
  };

  // Update order status
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        setSuccess("Order status updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update order status");
      }
    } catch (err) {
      setError("An error occurred while updating order status");
      console.error(err);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const success = await deleteOrder(orderId);
        if (success) {
          setSuccess("Order deleted successfully!");
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError("Failed to delete order");
        }
      } catch (err) {
        setError("An error occurred while deleting the order");
        console.error(err);
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
              <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </div>

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
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                  required
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
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Add Product
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
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                  required
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
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Update Product
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
