import { useState, useEffect } from "react";
import ProductTable from "../components/ProductTable";
import CheckoutForm from "../components/CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Sparkles, ArrowLeft, ShoppingCart, AlertCircle, Shield } from "lucide-react";
import { Product } from "../types/product";
import { useProducts } from "../hooks/use-products";

interface CartItem extends Product {
  quantity: number;
}

const QuickPurchase = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true);
  const { products, categories, loading, error } = useProducts();
  
  // Minimum order amount
  const MINIMUM_ORDER_AMOUNT = 3000;

  // Check if user has already seen the disclaimer
  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('quickPurchaseDisclaimerSeen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

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

  const isMinimumOrderMet = () => {
    return getTotalPrice() >= MINIMUM_ORDER_AMOUNT;
  };

  const getRemainingAmount = () => {
    return Math.max(0, MINIMUM_ORDER_AMOUNT - getTotalPrice());
  };

  const handleDisclaimerAccept = () => {
    if (disclaimerAccepted) {
      // Save to localStorage that user has seen the disclaimer
      localStorage.setItem('quickPurchaseDisclaimerSeen', 'true');
      setShowDisclaimer(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Disclaimer Popup */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0" />
              <span>Important Safety Notice</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please read and acknowledge the following safety guidelines before proceeding with your purchase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2 sm:py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">⚠️ Safety Guidelines:</h4>
              <ul className="text-sm text-orange-700 space-y-2">
                <li>• Fireworks should only be used by adults (18+ years)</li>
                <li>• Always follow local laws and regulations regarding firework usage</li>
                <li>• Use fireworks in open areas away from buildings and flammable materials</li>
                <li>• Keep a bucket of water or fire extinguisher nearby</li>
                <li>• Never point fireworks at people, animals, or property</li>
                <li>• Dispose of used fireworks properly by soaking in water</li>
                <li>• Store fireworks in a cool, dry place away from children</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Order Information:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Minimum order amount: ₹3,000</li>
                <li>• All orders are subject to availability</li>
                <li>• Delivery charges may apply based on location</li>
                <li>• Please ensure accurate contact information for delivery</li>
              </ul>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="disclaimer-checkbox"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => setDisclaimerAccepted(checked as boolean)}
                className="mt-1 flex-shrink-0 h-5 w-5"
              />
              <label
                htmlFor="disclaimer-checkbox"
                className="text-sm sm:text-base font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and understood the safety guidelines and order information above. I agree to use fireworks responsibly and in accordance with local laws.
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={handleDisclaimerAccept}
              disabled={!disclaimerAccepted}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content - Only show after disclaimer is accepted */}
      {!showDisclaimer && (
        <>
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
          <div className="space-y-8 pb-32">
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

            {/* Minimum Order Alert */}
            {cartItems.length > 0 && !isMinimumOrderMet() && (
              <div className="fixed bottom-20 left-4 right-4 z-0 pointer-events-none">
                <Alert className="border-orange-200 bg-orange-50/90 backdrop-blur-sm shadow-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 font-semibold">
                    <span className="animate-blink">⚠️ Minimum order ₹{MINIMUM_ORDER_AMOUNT} required</span>
                    <br />
                    <span className="text-sm">
                      Add ₹{getRemainingAmount()} more to proceed to checkout
                    </span>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Checkout Button */}
            {cartItems.length > 0 && (
              <div className="sticky bottom-4 z-20">
                <Card className={`card-glow border-primary/20 bg-card/95 backdrop-blur-md ${!isMinimumOrderMet() ? 'opacity-75' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {getTotalItems()} items in cart
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          Total: ₹{getTotalPrice()}
                        </p>
                        {!isMinimumOrderMet() && (
                          <p className="text-sm text-orange-600 font-medium">
                            Need ₹{getRemainingAmount()} more for minimum order
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowCheckout(true)}
                        disabled={!isMinimumOrderMet()}
                        className={`text-lg px-8 py-3 w-full sm:w-auto ${
                          isMinimumOrderMet() 
                            ? 'btn-festive' 
                            : 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                        }`}
                      >
                        {isMinimumOrderMet() ? 'Proceed to Checkout' : 'Minimum ₹3000 Required'}
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
              <div className="flex justify-between items-center">
                <CardTitle>Need Help?</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('quickPurchaseDisclaimerSeen');
                    setShowDisclaimer(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Show Safety Notice Again
                </Button>
              </div>
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
        </>
      )}
    </div>
  );
};

export default QuickPurchase;
