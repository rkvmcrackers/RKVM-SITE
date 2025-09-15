import { useState, useEffect, useRef } from "react";
import { Product } from "../types/product";
import { Plus, Minus, ShoppingCart, ZoomIn } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "../hooks/use-toast";
import { SimpleImageProxy } from "../utils/simple-image-proxy";
import InstantLoadingImage from "./InstantLoadingImage";
import { aggressivePreloader } from "../utils/aggressive-preloader";

interface CartItem extends Product {
  quantity: number;
}

interface ProductTableProps {
  onCartUpdate?: (items: CartItem[]) => void;
  cartItems?: CartItem[];
  products: Product[];
  categories: string[];
}

const ProductTable = ({ onCartUpdate, cartItems = [], products, categories }: ProductTableProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>(cartItems);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const { toast } = useToast();
  const productsSectionRef = useRef<HTMLDivElement>(null);
  
  // Process image URL through proxy if needed
  const processImageUrl = (imageUrl: string): string => {
    if (!imageUrl || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
      return imageUrl; // Don't process relative URLs or data URLs
    }
    return SimpleImageProxy.convertToProxyUrl(imageUrl);
  };

  // Aggressively preload all images when products load
  useEffect(() => {
    if (products.length > 0) {
      console.log(`🚀 ProductTable: Starting aggressive preload of ${products.length} images...`);
      aggressivePreloader.preloadAllImages(products);
    }
  }, [products]);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  // Category filter handler
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    
    // Scroll to products section after a short delay to allow state update
    setTimeout(() => {
      if (productsSectionRef.current) {
        productsSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const getQuantityInCart = (productId: string) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const updateQuantity = (product: Product, change: number) => {
    const currentQuantity = getQuantityInCart(product.id);
    const newQuantity = Math.max(0, currentQuantity + change);

    let updatedCart;
    if (newQuantity === 0) {
      updatedCart = cart.filter((item) => item.id !== product.id);
    } else {
      const existingItem = cart.find((item) => item.id === product.id);
      if (existingItem) {
        updatedCart = cart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        updatedCart = [...cart, { ...product, quantity: newQuantity }];
      }
    }

    setCart(updatedCart);
    onCartUpdate?.(updatedCart);

    if (change > 0) {
      toast({
        title: "Added to Cart",
        description: `${product.name} added to cart`,
        duration: 2000,
      });
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Handle image click for popup
  const handleImageClick = (imageUrl: string, productName: string) => {
    if (imageUrl && imageUrl !== "/placeholder.png") {
      setSelectedImage(imageUrl);
      setSelectedImageAlt(productName);
      setIsImageDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="card-glow sticky top-4 z-10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Cart Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>{getTotalItems()} items</span>
              <span className="text-primary">₹{getTotalPrice()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => handleCategoryFilter("All")}
          variant={selectedCategory === "All" ? "default" : "outline"}
          className={`${selectedCategory === "All" ? "btn-festive" : ""} transition-all duration-200 hover:scale-105`}
        >
          All
        </Button>
        {categories.slice(1).map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryFilter(category)}
            variant={selectedCategory === category ? "default" : "outline"}
            className={`${selectedCategory === category ? "btn-festive" : ""} transition-all duration-200 hover:scale-105`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Price List Style Product Cards */}
      <div ref={productsSectionRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product, index) => {
          const qty = getQuantityInCart(product.id);
          return (
            <Card key={product.id} className={`card-glow flex flex-col ${!product.inStock ? 'opacity-75' : ''}`}>
              <div className="relative">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => handleImageClick(product.image || "/placeholder.svg", product.name)}
                >
                  <InstantLoadingImage
                    src={processImageUrl(product.image || "/placeholder.svg")}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-t-lg transition-opacity duration-200 group-hover:opacity-80"
                    fallbackSrc="/placeholder.svg"
                    priority={index < 6} // Prioritize first 6 images
                  />
                  {product.image && product.image !== "/placeholder.svg" && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-t-lg flex items-center justify-center transition-all duration-200">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                </div>
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                    <span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>

              <CardContent className="flex flex-col flex-grow p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>

                <div className="text-xl font-bold text-primary">
                  ₹{product.price}
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm px-2 py-1 rounded font-medium ${
                    product.inStock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  
                  {/* Subtotal */}
                  {qty > 0 && (
                    <span className="font-semibold text-festive">
                      ₹{product.price * qty}
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(product, -1)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{qty}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(product, 1)}
                      disabled={!product.inStock}
                      className={!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Image Popup Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-semibold">
              {selectedImageAlt}
            </DialogTitle>
          </DialogHeader>
          <div className="sr-only">
            <p>Product image viewer for {selectedImageAlt}</p>
          </div>
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
  );
};

export default ProductTable;
