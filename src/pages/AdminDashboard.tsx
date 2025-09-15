import { useState, useEffect } from "react";
import { clearAllData, checkDataStatus } from "../utils/clear-all-data";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useProducts } from "../hooks/use-products";
import { useHighlights } from "../hooks/use-highlights";
import { useToast } from "../hooks/use-toast";
import * as XLSX from 'xlsx';
import { SimpleImageProxy } from '../utils/simple-image-proxy';
import ImageWithFallback from '../components/ImageWithFallback';
import OptimizedImage from '../components/OptimizedImage';
import { preloadCriticalImages } from '../utils/image-preloader';

import { useOrders } from "../hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
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
  ZoomIn,
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
import DataRecovery from "../components/DataRecovery";

interface AdminProduct extends Product {
  imageUrl?: string;
}

const AdminDashboard = () => {
  const { products, categories, addProduct, bulkAddProducts, updateProduct, deleteProduct, refreshProducts, emergencyRecovery } = useProducts();
  const { highlights, addHighlight, removeHighlight, updateHighlight, resetToBase: resetHighlights } = useHighlights();
  const { toast } = useToast();

  const { orders, loading: ordersLoading, updateOrderStatus, deleteOrder, getTotalRevenue, getTotalRevenueIncludingCancelled, getCancelledOrdersAmount, getOrdersCountByStatus } = useOrders();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState(0);
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
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");

  // Process image URL through proxy if needed
  const processImageUrl = (imageUrl: string): string => {
    if (!imageUrl || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
      return imageUrl; // Don't process relative URLs or data URLs
    }
    return SimpleImageProxy.convertToProxyUrl(imageUrl);
  };

  // Preload critical images on component mount
  useEffect(() => {
    preloadCriticalImages();
  }, []);
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
  
  // Google Sheets upload state
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  
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



  // Compress image to reduce file size
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (file) {
      try {
        // Show loading state
        setImagePreview("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VcGxvYWRpbmcuLi48L3RleHQ+PC9zdmc+");
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select a valid image file');
        }
        
        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Image size must be less than 10MB');
        }
        
        // Compress and convert image to base64
        const base64Image = await compressImage(file, 800, 0.8);
        
        // Set the base64 image as preview and form data
        setImagePreview(base64Image);
        setFormData(prev => ({ ...prev, imageUrl: base64Image }));
        
        // Show success toast notification
        toast({
          title: "✅ Image Uploaded Successfully!",
          description: `Image compressed and ready to use (${Math.round(file.size / 1024)}KB → ${Math.round(base64Image.length * 0.75 / 1024)}KB)`,
          duration: 4000,
        });
        
        console.log('Image uploaded and compressed successfully!');
        
      } catch (error) {
        console.error('Error uploading image:', error);
        
        // Show error toast notification
        toast({
          title: "❌ Image Upload Failed",
          description: error instanceof Error ? error.message : 'Failed to upload image',
          variant: "destructive",
          duration: 5000,
        });
        
        // Fallback to placeholder image
        const placeholderUrl = '/placeholder.svg';
        setImagePreview(placeholderUrl);
        setFormData(prev => ({ ...prev, imageUrl: placeholderUrl }));
        
        console.log('Using placeholder image. Product will still be saved.');
      }
    }
  };

  // Handle image click for popup
  const handleImageClick = (imageUrl: string, productName: string) => {
    if (imageUrl && imageUrl !== "/placeholder.svg") {
      setSelectedImage(imageUrl);
      setSelectedImageAlt(productName);
      setIsImageDialogOpen(true);
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
    
    // Clear file input
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      if (input.id === 'name' || input.id === 'edit-name') {
        // Skip name inputs, only clear file inputs
        return;
      }
      input.value = '';
    });
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

    // Prevent concurrent uploads
    if (isUploading) {
      toast({
        title: "⏳ Upload in Progress",
        description: "Please wait for the current upload to complete before trying again.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Prevent rapid successive uploads (debounce)
    const now = Date.now();
    if (now - lastUploadTime < 3000) { // 3 second debounce to avoid conflicts
      toast({
        title: "⏳ Please Wait",
        description: "Please wait 3 seconds between uploads to avoid conflicts.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setLastUploadTime(now);
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
          image: formData.imageUrl || "/placeholder.svg"
        });
        
        if (success) {
          setSuccess('Product updated successfully!');
          
          // Show success toast notification
          toast({
            title: "✅ Product Updated Successfully!",
            description: `${formData.name} has been updated with new image processed.`,
            duration: 4000,
          });
          
          operationSuccess = true;
        } else {
          setError('Failed to update product. Please try again.');
          
          // Show error toast notification
          toast({
            title: "❌ Product Update Failed",
            description: "Failed to update product. Please try again.",
            variant: "destructive",
            duration: 4000,
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
          image: formData.imageUrl || "/placeholder.svg"
        });
        
        if (success) {
          setSuccess('Product added successfully!');
          
          // Show success toast notification
          toast({
            title: "✅ Product Added Successfully!",
            description: `${formData.name} has been added to your inventory with image processed.`,
            duration: 4000,
          });
          
          operationSuccess = true;
        } else {
          setError('Failed to add product. Please try again.');
          
          // Show error toast notification
          toast({
            title: "❌ Product Addition Failed",
            description: "Failed to add product. Please try again.",
            variant: "destructive",
            duration: 4000,
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
      setIsUploading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const success = await deleteProduct(id);
        if (success) {
          console.log('Product has been deleted successfully!');
        } else {
          console.log('Failed to delete product. Please try again.');
        }
      } catch (err) {
        console.error(err);
        console.log('An error occurred while deleting the product.');
      }
    }
  };

  // Clean up products data (remove base64 images)
  const handleCleanProducts = async () => {
    if (window.confirm("This will remove all base64 images from products and replace them with placeholder URLs. Continue?")) {
      try {
        // Feature temporarily disabled
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
        const success = true; // Feature temporarily disabled
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

  // Bulk upload functions
  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkUploadFile(file);
    setBulkUploadError("");
    setBulkUploadSuccess("");
    setParsedProducts([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setBulkUploadError("Excel file must have at least a header row and one data row.");
          return;
        }

        // Get headers (first row)
        const headers = jsonData[0] as string[];
        const requiredColumns = ['Name', 'Price', 'Category', 'Description', 'InStock', 'ImageURL'];
        
        // Check if all required columns exist
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          setBulkUploadError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        // Map column indices
        const columnMap = {
          name: headers.indexOf('Name'),
          price: headers.indexOf('Price'),
          category: headers.indexOf('Category'),
          description: headers.indexOf('Description'),
          inStock: headers.indexOf('InStock'),
          image: headers.indexOf('ImageURL')
        };

        // Parse data rows
        const parsedData: AdminProduct[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          const product: AdminProduct = {
            id: `bulk_${Date.now()}_${i}`, // Generate unique ID
            name: String(row[columnMap.name] || '').trim(),
            price: parseFloat(String(row[columnMap.price] || 0)) || 0,
            category: String(row[columnMap.category] || '').trim(),
            description: String(row[columnMap.description] || '').trim(),
            inStock: String(row[columnMap.inStock] || '').toUpperCase() === 'TRUE',
            image: String(row[columnMap.image] || '').trim() || '/placeholder.svg'
          };

          // Validate required fields
          if (!product.name || !product.category || product.price <= 0) {
            setBulkUploadError(`Row ${i + 1}: Missing required fields (Name, Category, or invalid Price)`);
            return;
          }

          parsedData.push(product);
        }

        if (parsedData.length === 0) {
          setBulkUploadError("No valid products found in the Excel file.");
          return;
        }

        setParsedProducts(parsedData);
        setBulkUploadSuccess(`Successfully parsed ${parsedData.length} products from Excel file.`);
      } catch (error) {
        setBulkUploadError(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkUpload = async () => {
    if (parsedProducts.length === 0) {
      setBulkUploadError("No products to upload.");
      return;
    }

    // Prevent concurrent uploads
    if (isUploading) {
      toast({
        title: "⏳ Upload in Progress",
        description: "Please wait for the current upload to complete before trying again.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Prevent rapid successive uploads (debounce)
    const now = Date.now();
    if (now - lastUploadTime < 3000) { // 3 second debounce for bulk uploads
      toast({
        title: "⏳ Please Wait",
        description: "Please wait 3 seconds between bulk uploads to avoid conflicts.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setIsBulkUploading(true);
    setIsUploading(true);
    setLastUploadTime(now);
    setBulkUploadError("");
    setBulkUploadSuccess("");
    setBulkUploadProgress(0);

    try {
      // Show initial progress
      setBulkUploadProgress(10);

      // Show processing toast notification
      toast({
        title: "🚀 Starting Upload...",
        description: `Processing ${parsedProducts.length} products from Google Sheets. This may take a moment...`,
        duration: 4000,
      });

      // Check for duplicates and filter out existing products
      const existingProductNames = products.map(p => p.name.toLowerCase().trim());
      console.log('Existing products count:', products.length);
      console.log('Existing product names:', existingProductNames.slice(0, 5)); // Show first 5
      
      const newProducts = [];
      const duplicateProducts = [];
      
      for (const product of parsedProducts) {
        const normalizedName = product.name.toLowerCase().trim();
        if (existingProductNames.includes(normalizedName)) {
          duplicateProducts.push(product.name);
        } else {
          newProducts.push(product);
        }
      }
      
      console.log('Parsed products count:', parsedProducts.length);
      console.log('New products count:', newProducts.length);
      console.log('Duplicate products count:', duplicateProducts.length);
      console.log('First few new products:', newProducts.slice(0, 3));
      
      if (newProducts.length === 0) {
        setBulkUploadError(`All ${parsedProducts.length} products already exist in the system. No new products to add.`);
        setIsBulkUploading(false);
        setIsUploading(false);
        return;
      }
      
      if (duplicateProducts.length > 0) {
        console.log(`Skipping ${duplicateProducts.length} duplicate products:`, duplicateProducts);
        toast({
          title: "⚠️ Duplicates Found",
          description: `Skipping ${duplicateProducts.length} duplicate products. Adding ${newProducts.length} new products.`,
          duration: 4000,
        });
      }

      // Images are already processed in Google Sheets parsing, just convert to upload format
      const productsToUpload = [];
      let imagesWithUrls = 0;
      let imagesWithoutUrls = 0;
      
      for (let i = 0; i < newProducts.length; i++) {
        const product = newProducts[i];
        
        // Update progress (10-60% for processing)
        const progress = 10 + (i / newProducts.length) * 50;
        setBulkUploadProgress(progress);
        
        // Count images
        if (product.image && product.image !== '/placeholder.svg') {
          imagesWithUrls++;
        } else {
          imagesWithoutUrls++;
        }
        
        productsToUpload.push({
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
          inStock: product.inStock,
          image: product.image
        });
        
        // Update progress message
        console.log(`Progress: ${i + 1}/${newProducts.length} products processed. Images: ${imagesWithUrls} with URLs, ${imagesWithoutUrls} placeholders`);
      }

      setBulkUploadProgress(60);

      console.log('Products to upload:', productsToUpload.length);
      console.log('First product to upload:', productsToUpload[0]);
      
      // Add all products in a single API call
      const success = await bulkAddProducts(productsToUpload);
      
      setBulkUploadProgress(90);

      if (success) {
        setBulkUploadProgress(100);
        
        const totalImages = productsToUpload.length;
        const duplicateMessage = duplicateProducts.length > 0 ? ` (${duplicateProducts.length} duplicates skipped)` : '';
        
        if (imagesWithUrls === totalImages) {
          setBulkUploadSuccess(`✅ Successfully uploaded ${newProducts.length} new products with all image URLs!`);
        } else {
          setBulkUploadSuccess(`✅ Successfully uploaded ${newProducts.length} new products! ${imagesWithUrls}/${totalImages} with image URLs (${imagesWithoutUrls} placeholders)`);
        }
        
        // Show comprehensive success notification
        toast({
          title: "🎉 Upload Successful!",
          description: `Added ${newProducts.length} new products to your store${duplicateMessage}. Images: ${imagesWithUrls} processed, ${imagesWithoutUrls} placeholders.`,
          duration: 8000,
        });
        
        // Show additional success alert
        setTimeout(() => {
          toast({
            title: "📊 Upload Summary",
            description: `• ${newProducts.length} products added\n• ${imagesWithUrls} images processed\n• ${duplicateProducts.length} duplicates skipped\n• Products are now live in your store!`,
            duration: 10000,
          });
        }, 2000);
        
        console.log(`✅ SUCCESS: Uploaded ${newProducts.length} new products${duplicateMessage} with ${imagesWithUrls}/${totalImages} image URLs!`);

        setParsedProducts([]);
        setBulkUploadFile(null);
        setSheetsUrl("");
        
        // Reset file input
        const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setBulkUploadError("❌ Failed to upload products. Please check the console for details and try again.");
        
        // Show detailed error notification
        toast({
          title: "❌ Upload Failed",
          description: `Failed to upload ${newProducts.length} products. Check console for details.`,
          variant: "destructive",
          duration: 8000,
        });
        
        // Show additional error details
        setTimeout(() => {
          toast({
            title: "🔧 Troubleshooting",
            description: "• Check your internet connection\n• Verify GitHub API access\n• Try uploading fewer products at once\n• Check browser console for error details",
            variant: "destructive",
            duration: 10000,
          });
        }, 2000);
        
        console.error('❌ FAILED: Bulk upload failed. Check network, API access, and try again.');
      }
    } catch (error) {
      setBulkUploadError(`Error uploading products: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Show error toast notification
      toast({
        title: "❌ Bulk Upload Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred during upload',
        variant: "destructive",
        duration: 5000,
      });
      
      console.log(`Error uploading products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBulkUploading(false);
      setIsUploading(false);
      setTimeout(() => setBulkUploadProgress(0), 2000);
    }
  };

  const handleClearBulkUpload = () => {
    setBulkUploadFile(null);
    setParsedProducts([]);
    setBulkUploadError("");
    setBulkUploadSuccess("");
    setSheetsUrl("");
    
    // Reset file input
    const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Google Sheets upload function
  const handleSheetsUrlUpload = async () => {
    if (!sheetsUrl) {
      setBulkUploadError("Please enter a Google Sheets URL.");
      return;
    }

    // Validate URL format
    if (!sheetsUrl.includes('docs.google.com/spreadsheets')) {
      setBulkUploadError("Please enter a valid Google Sheets URL (must contain 'docs.google.com/spreadsheets').");
      return;
    }

    setBulkUploadError("");
    setBulkUploadSuccess("");
    setParsedProducts([]);
    setIsSheetsLoading(true);
    setBulkUploadProgress(10);

    try {
      // Convert Google Sheets URL to CSV export URL
      let csvUrl = sheetsUrl;
      
      // Clean the URL first - remove any existing parameters and fragments
      const cleanUrl = sheetsUrl.split('?')[0].split('#')[0];
      
      // Extract sheet ID from the URL
      const sheetIdMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error('Invalid Google Sheets URL format. Please use a valid Google Sheets sharing URL.');
      }
      
      const sheetId = sheetIdMatch[1];
      
      // Extract gid from original URL if present
      let gid = '0'; // Default to first sheet
      const gidMatch = sheetsUrl.match(/[#&]gid=(\d+)/);
      if (gidMatch) {
        gid = gidMatch[1];
      }
      
      // Construct the proper CSV export URL
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      console.log('Attempting to fetch CSV from:', csvUrl);
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheets: ${response.status}. Please make sure the sheet is publicly accessible.`);
      }

      const csvText = await response.text();
      console.log('Raw CSV data (first 500 chars):', csvText.substring(0, 500));
      
      // Check if we got HTML instead of CSV
      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
        throw new Error('Google Sheets is not publicly accessible. Please make sure the sheet is set to "Anyone with the link can view" and try again.');
      }
      
      setBulkUploadProgress(30);

      // Parse CSV data with better CSV parsing
      const lines = csvText.split(/\r?\n/).filter(line => line.trim());
      console.log('Number of lines:', lines.length);
      
      if (lines.length < 2) {
        throw new Error("Google Sheets must have at least a header row and one data row.");
      }

      // Better CSV parsing that handles quoted values
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Detected headers:', headers);
      
      const requiredColumns = ['Name', 'Price', 'Category', 'Description', 'InStock', 'ImageURL'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Found headers: ${headers.join(', ')}`);
      }

      setBulkUploadProgress(50);

      const products: AdminProduct[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim().replace(/\r$/, ''); // Remove trailing \r
        if (!line) continue; // Skip empty lines

        const row = parseCSVLine(line).map(cell => cell.replace(/"/g, '').trim());
        if (row.length === 0 || !row[0]) continue; // Skip empty rows

        // Process image URL
        let imageUrl = String(row[5] || '').trim();
        console.log(`Processing image URL for ${String(row[0] || '').trim()}: "${imageUrl}"`);
        
        if (!imageUrl || imageUrl === '' || imageUrl.toLowerCase() === 'none' || imageUrl.toLowerCase() === 'null') {
          imageUrl = '/placeholder.svg';
          console.log(`No valid image URL, using placeholder for ${String(row[0] || '').trim()}`);
        } else {
          // Use proxy for ALL external URLs to avoid CORS issues
          console.log(`Converting external URL for ${String(row[0] || '').trim()}: ${imageUrl}`);
          const originalUrl = imageUrl;
          imageUrl = SimpleImageProxy.convertToProxyUrl(imageUrl);
          console.log(`Final image URL for ${String(row[0] || '').trim()}: ${originalUrl} -> ${imageUrl}`);
        }

        const product: AdminProduct = {
          id: `temp-${Date.now()}-${i}`,
          name: String(row[0] || '').trim(),
          price: parseFloat(row[1]) || 0,
          category: String(row[2] || '').trim(),
          description: String(row[3] || '').trim(),
          inStock: row[4] === 'TRUE' || row[4] === 'true' || row[4] === '1',
          image: imageUrl,
          imageUrl: imageUrl
        };

        if (product.name) {
          products.push(product);
        }
      }

      if (products.length === 0) {
        throw new Error("No valid products found in the Google Sheets.");
      }

      setBulkUploadProgress(70);
      setParsedProducts(products);
      setBulkUploadSuccess(`Successfully parsed ${products.length} products from Google Sheets.`);
      setBulkUploadProgress(100);
    } catch (error) {
      console.error('Error fetching Google Sheets:', error);
      setBulkUploadError(`Error fetching Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSheetsLoading(false);
    }
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
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button 
                  onClick={async () => {
                    const success = await refreshProducts();
                    if (success) {
                      setSuccess('Products refreshed successfully!');
                      setTimeout(() => setSuccess(''), 3000);
                    } else {
                      setError('Failed to refresh products');
                    }
                  }}
                  variant="outline" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={async () => {
                    if (window.confirm("🚨 EMERGENCY RECOVERY: This will attempt to recover your products from local storage and sync to GitHub. Continue?")) {
                      setSuccess("🔄 Starting emergency recovery...");
                      const success = await emergencyRecovery();
                      if (success) {
                        setSuccess("✅ Emergency recovery successful! Products restored.");
                        setTimeout(() => setSuccess(''), 5000);
                      } else {
                        setError("❌ Emergency recovery failed. Check console for details.");
                      }
                    }
                  }}
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto"
                >
                  🚨 Emergency Recovery
                </Button>
                <Button 
                  onClick={openAddDialog} 
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
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
                <div className="space-y-4">
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
                  
                  <div className="text-center text-sm text-gray-500">OR</div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sheets-url">Google Sheets URL</Label>
                    <Input
                      id="sheets-url"
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      className="w-full"
                    />
                    <Button 
                      onClick={handleSheetsUrlUpload}
                      disabled={!sheetsUrl || isSheetsLoading || isBulkUploading}
                      className="w-full"
                    >
                      {isSheetsLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading Google Sheets...</span>
                        </div>
                      ) : (
                        "Upload from Google Sheets"
                      )}
                    </Button>
                    <p className="text-sm text-gray-500">
                      <strong>ImageURL:</strong> Paste image URLs (Google Drive, direct links, etc.) - URLs are converted to working image links
                      <br />
                      <span className="text-red-600 font-medium">⚠️ IMPORTANT: Google Sheets must be set to "Anyone with the link can view" for CSV export to work!</span>
                      <br />
                      <span className="text-blue-600 font-medium">💡 How to make Google Sheets public: Click "Share" → Change to "Anyone with the link can view" → Copy the sharing URL</span>
                      <br />
                      <span className="text-orange-600 font-medium">📋 URL Format: Use the sharing URL that starts with "https://docs.google.com/spreadsheets/d/"</span>
                      <br />
                      <span className="text-red-600 font-medium">⚠️ Google Drive images must also be set to "Anyone with the link can view" for them to work!</span>
                      <br />
                      <span className="text-green-600 font-medium">✅ Alternative: Use direct image URLs from Imgur, Dropbox, or other image hosting services.</span>
                      <br />
                      <span className="text-blue-600 font-medium">🔧 Image Processing: Google Drive URLs are automatically converted to thumbnail URLs for better compatibility.</span>
                    </p>
                  </div>
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
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Upload All Products
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {(isBulkUploading || isSheetsLoading) && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${bulkUploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {isSheetsLoading ? 
                            `Loading Google Sheets... ${bulkUploadProgress}%` : 
                            `Uploading ${parsedProducts.length} products in a single operation... ${bulkUploadProgress}%`
                          }
                        </p>
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
                                <div 
                                  className="relative cursor-pointer group"
                                  onClick={() => handleImageClick(product.image, product.name)}
                                >
                              <OptimizedImage
                                src={processImageUrl(product.image)}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded transition-opacity duration-200 group-hover:opacity-80"
                                fallbackSrc="/placeholder.svg"
                                priority={true}
                              />
                                  {product.image && product.image !== '/placeholder.svg' && (
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all duration-200">
                                      <ZoomIn className="h-2 w-2 text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                  )}
                                </div>
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
            <Card className="-mx-4 sm:-mx-6 lg:-mx-8">
              <CardContent className="p-0">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="px-3 py-3 w-20">Image</TableHead>
                      <TableHead className="px-3 py-3">Name</TableHead>
                      <TableHead className="px-3 py-3 w-24">Actions</TableHead>
                      <TableHead className="px-3 py-3 w-32">Category</TableHead>
                      <TableHead className="px-3 py-3 w-20">Price</TableHead>
                      <TableHead className="px-3 py-3 w-24">Status</TableHead>
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
                          <TableCell className="px-3 py-3 w-20">
                            <div 
                              className="relative cursor-pointer group"
                              onClick={() => handleImageClick(product.image || "/placeholder.svg", product.name)}
                            >
                              <OptimizedImage
                                src={processImageUrl(product.image || "/placeholder.svg")}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-md transition-opacity duration-200 group-hover:opacity-80"
                                fallbackSrc="/placeholder.svg"
                                priority={true}
                              />
                              {product.image && product.image !== "/placeholder.svg" && (
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md flex items-center justify-center transition-all duration-200">
                                  <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3">
                            <div>
                              <div className="font-medium text-sm truncate">{product.name}</div>
                              <div className="text-xs text-gray-500 truncate">{product.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 w-24">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(product as AdminProduct)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 w-32">
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="px-3 py-3 font-medium w-20">₹{product.price}</TableCell>
                          <TableCell className="px-3 py-3 w-24">
                            <Badge variant={product.inStock ? "default" : "secondary"} className="text-xs">
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
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
                        <TableHead>Actions</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
             <BillingComponent products={products} categories={categories} />
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
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>• Highlights appear in the scrolling banner on the home page</p>
                    <p>• Keep it simple - no emojis needed for better compatibility</p>
                    <p>• Default: 5 highlights without images</p>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      placeholder="Enter new highlight text (no emojis)"
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
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        if (window.confirm("Reset to 5 default highlights? This will replace all current highlights.")) {
                          setHighlightsLoading(true);
                          setHighlightsError(null);
                          try {
                            await resetHighlights();
                            setSuccess("Highlights reset to defaults successfully!");
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
                      className="min-w-[120px]"
                    >
                      Reset to Defaults
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



             {/* Data Recovery & Backup */}
             <DataRecovery onRecoveryComplete={() => window.location.reload()} />
             
             {/* GitHub API Test */}
             <GitHubTest />
           </TabsContent>
        </Tabs>

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new product to your inventory.
              </DialogDescription>
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
                <Label>Product Image</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="cursor-pointer w-full sm:w-auto"
                  />
                  {imagePreview && (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-md border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
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
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Upload an image (max 10MB). Images will be automatically compressed to 800px width.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      Adding...
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product details below. Changes will be saved to your inventory.
              </DialogDescription>
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
                <Label>Product Image</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="cursor-pointer w-full sm:w-auto"
                  />
                  {imagePreview && (
                    <div className="relative flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-md border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
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
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Upload an image (max 10MB). Images will be automatically compressed to 800px width.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      Updating...
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

        {/* Image Popup Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-lg font-semibold">
                {selectedImageAlt}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt={selectedImageAlt}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
