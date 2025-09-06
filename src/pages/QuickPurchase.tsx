import { useState } from "react";
import ProductTable from "../components/ProductTable";
import CheckoutForm from "../components/CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, ArrowLeft, ShoppingCart } from "lucide-react";
import { Product } from "../types/product";
import { useProducts } from "../hooks/use-products";

interface CartItem extends Product {
  quantity: number;
}

const QuickPurchase = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const { products, categories, loading, error } = useProducts();

  const handleCartUpdate = (items: CartItem[]) => {
    setCartItems(items);
  };

  const handleOrderComplete = () => {
    setCartItems([]);
    setShowCheckout(false);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <ShoppingCart className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Quick Purchase
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your favorite fireworks, add them to cart, and checkout in
            minutes!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showCheckout ? (
          <div className="space-y-8">
            {/* Product Selection */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span>Select Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                
                {!loading && !error && (
                  <ProductTable
                    onCartUpdate={handleCartUpdate}
                    cartItems={cartItems}
                    products={products}
                    categories={categories}
                  />
                )}
              </CardContent>
            </Card>

            {/* Checkout Button */}
            {cartItems.length > 0 && (
              <div className="sticky bottom-4 z-10">
                <Card className="card-glow border-primary/20 bg-card/95 backdrop-blur-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {getTotalItems()} items in cart
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          Total: ₹{getTotalPrice()}
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowCheckout(true)}
                        className="btn-festive text-lg px-8 py-3 w-full sm:w-auto"
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              onClick={() => setShowCheckout(false)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Products</span>
            </Button>

            {/* Checkout Form */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  <span>Checkout</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm
                  cartItems={cartItems}
                  onOrderComplete={handleOrderComplete}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        {!showCheckout && (
          <Card className="mt-12 card-glow">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Phone Orders</h4>
                  <p className="text-muted-foreground text-sm">
                    Call us directly for immediate assistance
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="tel:9750153358">9750153358</a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Customer Support</h4>
                  <p className="text-muted-foreground text-sm">
                    Dedicated support for all your queries
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="tel:7010918595">7010918595</a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Email Orders</h4>
                  <p className="text-muted-foreground text-sm">
                    Send us your requirements via email
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:rkvmcrackers@gmail.com">Send Email</a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Bulk Orders</h4>
                  <p className="text-muted-foreground text-sm">
                    Special pricing for large quantity orders
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/contact">Contact Us</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuickPurchase;
