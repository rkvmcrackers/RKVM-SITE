import { useState, useRef, useEffect } from "react";
import { useProducts } from "../hooks/use-products";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Search, Download, Sparkles, ZoomIn, Filter, SortAsc, SortDesc } from "lucide-react";
import PersistentImage from "../components/PersistentImage";
import { usePersistentImageCache } from "../hooks/usePersistentImageCache";

const PriceList = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [sortField, setSortField] = useState<"name" | "price" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { products, categories, loading, error } = useProducts();
  const { getCacheStats, cachedImagesCount } = usePersistentImageCache();
  
  // Ref for scrolling to products section
  const productsSectionRef = useRef<HTMLDivElement>(null);

  // Images will be cached persistently, no URL processing needed

  // Images are now cached persistently, no need for local preloading
  useEffect(() => {
    if (products.length > 0) {
      console.log(`📊 PriceList: ${products.length} products loaded, images should be cached persistently`);
    }
  }, [products]);

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field: "name" | "price" | "category") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Function to scroll to products section
  const scrollToProducts = () => {
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Enhanced category filter handler with scroll
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    // Small delay to ensure state update before scrolling
    setTimeout(() => {
      scrollToProducts();
    }, 100);
  };

  // Enhanced search handler with scroll
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Small delay to ensure state update before scrolling
    setTimeout(() => {
      scrollToProducts();
    }, 100);
  };

  // Handle image click for popup
  const handleImageClick = (imageUrl: string, productName: string) => {
    if (imageUrl && imageUrl !== "https://via.placeholder.com/300x200?text=No+Image") {
      setSelectedImage(imageUrl);
      setSelectedImageAlt(productName);
      setIsImageDialogOpen(true);
    }
  };

  const downloadPriceList = () => {
    // Create a link to download the PDF file
    const link = document.createElement("a");
    link.href = "/RKVM_Pricelist_2025_Colour.pdf";
    link.download = "RKVM_Pricelist_2025_Colour.pdf";
    link.target = "_blank"; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Price List
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transparent pricing for all our premium fireworks and crackers. No
            hidden charges, no surprises!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={downloadPriceList} className="btn-festive">
              <Download className="h-4 w-4 mr-2" />
              Download PDF Price List
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:9750153358">Call for Bulk Orders</a>
            </Button>
          </div>
          
          {/* Cache Status Indicator */}
          {cachedImagesCount > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                <Sparkles className="h-3 w-3 mr-1" />
                {cachedImagesCount} images cached for instant loading
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Category:</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className={selectedCategory === category ? "btn-festive" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-lg text-destructive mb-4">Error loading products: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        )}

        {/* Results Count and Summary */}
        {!loading && !error && (
          <div className="mb-6">
            {/* Active Filters Indicator */}
            {(selectedCategory !== "All" || searchTerm) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-blue-700 font-medium">Active Filters:</span>
                  {selectedCategory !== "All" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Category: {selectedCategory}
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchTerm("");
                      scrollToProducts();
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* Mobile-First Product Display */}
        {!loading && !error && (
          <div ref={productsSectionRef} className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-b-2 border-gray-200">
                          <TableHead className="w-16 px-4 py-4 text-center font-semibold text-gray-700">
                            Image
                          </TableHead>
                          <TableHead 
                            className="px-4 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center gap-2">
                              Product Name
                              {sortField === "name" && (
                                sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="px-4 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleSort("category")}
                          >
                            <div className="flex items-center gap-2">
                              Category
                              {sortField === "category" && (
                                sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="px-4 py-4 font-semibold text-gray-700">
                            Description
                          </TableHead>
                          <TableHead 
                            className="px-4 py-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                            onClick={() => handleSort("price")}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Price
                              {sortField === "price" && (
                                sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="px-4 py-4 font-semibold text-gray-700 text-center">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product, index) => (
                          <TableRow 
                            key={product.id} 
                            className={`border-b hover:bg-gray-50 transition-colors ${
                              !product.inStock ? 'opacity-60' : ''
                            } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                          >
                            <TableCell className="px-4 py-4 text-center">
                              <div 
                                className="relative cursor-pointer group inline-block"
                                onClick={() => handleImageClick(product.image || "https://via.placeholder.com/300x200?text=No+Image", product.name)}
                              >
                                <PersistentImage
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 transition-all duration-200 group-hover:border-primary group-hover:shadow-md"
                                  fallbackSrc="/placeholder.svg"
                                  loading={index < 10 ? 'eager' : 'lazy'}
                                />
                                {product.image && product.image !== "https://via.placeholder.com/300x200?text=No+Image" && (
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-200">
                                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="font-semibold text-gray-900 text-lg">
                                {product.name}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="text-sm text-gray-600 max-w-xs">
                                {product.description}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-right">
                              <div className="text-2xl font-bold text-primary">
                                ₹{product.price.toLocaleString('en-IN')}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                product.inStock 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    !product.inStock ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-24 h-24 p-3">
                      <div 
                        className="relative cursor-pointer group w-full h-full"
                        onClick={() => handleImageClick(product.image || "https://via.placeholder.com/300x200?text=No+Image", product.name)}
                      >
                        <PersistentImage
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-200 transition-all duration-200 group-hover:border-primary group-hover:shadow-md"
                          fallbackSrc="/placeholder.svg"
                          loading="lazy"
                        />
                        {product.image && product.image !== "https://via.placeholder.com/300x200?text=No+Image" && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-200">
                            <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                            {product.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs mb-2">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-xl font-bold text-primary">
                            ₹{product.price.toLocaleString('en-IN')}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No products found matching your criteria.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
                scrollToProducts();
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Important Notes */}
        <Card className="mt-12 card-glow">
          <CardHeader>
            <CardTitle className="text-xl">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Pricing Notes:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Prices may vary during festival seasons</li>
                  <li>• Bulk discounts available on large orders</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Safety & Quality:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Quality tested before delivery</li>
                  <li>• Follow safety instructions carefully</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

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

export default PriceList;
