import { useState } from "react";
import { useProducts } from "../hooks/use-products";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Search, Download, Sparkles } from "lucide-react";

const PriceList = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { products, categories, loading, error } = useProducts();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const downloadPriceList = () => {
    let priceListText = `
RKVM CRACKERS - PRICE LIST
==========================
Date: ${new Date().toLocaleDateString()}

Contact Information:
Phone: 9750153358
Customer Support: 7010918595
Email: rkvmcrackers@gmail.com

PRODUCTS & PRICES:
==================

`;

    categories
      .slice(1)
      .forEach((category) => {
        const categoryProducts = products.filter(
          (p) => p.category === category
        );
        if (categoryProducts.length > 0) {
          priceListText += `\n${category.toUpperCase()}:\n`;
          priceListText += "".padEnd(category.length + 1, "-") + "\n";

          categoryProducts.forEach((product, index) => {
            priceListText += `${index + 1}. ${product.name.padEnd(25)} - ₹${product.price}\n`;
            priceListText += `   ${product.description}\n\n`;
          });
        }
      });

    priceListText += `
NOTES:
======
- All prices are in Indian Rupees (₹)
- Prices are subject to change during festival seasons
- Bulk discounts available on large orders
- Free delivery on orders above ₹500

For orders and inquiries:
Call: 9750153358
Email: rkvmcrackers@gmail.com

Thank you for choosing RKVM Crackers! 🎆
`;

    const blob = new Blob([priceListText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RKVM_PriceList_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              Download Price List
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:9750153358">Call for Bulk Orders</a>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={selectedCategory === category ? "btn-festive" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

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

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`card-glow hover:scale-105 transition-all duration-300 ${!product.inStock ? 'opacity-75' : ''}`}
              >
                <div className="relative">
                  {/* ✅ Show Admin Uploaded Image OR fallback placeholder */}
                  <img
                    src={product.image || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-t-2xl"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-2xl">
                      <span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg leading-tight">
                      {product.name}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      ₹{product.price}
                    </div>
                    <span className={`text-sm px-2 py-1 rounded font-medium ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  <li>• All prices are in Indian Rupees (₹)</li>
                  <li>• Prices may vary during festival seasons</li>
                  <li>• Bulk discounts available on large orders</li>
                  <li>• Free delivery on orders above ₹500</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Safety & Quality:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• All products are safety certified</li>
                  <li>• Quality tested before delivery</li>
                  <li>• Follow safety instructions carefully</li>
                  <li>• Keep away from children</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriceList;
