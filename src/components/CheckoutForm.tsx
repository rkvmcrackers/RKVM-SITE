import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Product } from "../types/product";
import { useOrders } from "../hooks/use-orders";
import {
  Phone as PhoneIcon,
  Send,
  Mail,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import toast, { Toaster } from "react-hot-toast";

/**
 * ===========================
 *   EmailJS CONFIG (EDIT)
 * ===========================
 * Ensure you have this setup in EmailJS:
 * - Service ID
 * - Template ID
 * - Public Key
 *
 * Template Variables (matching your template):
 * - name (customer name)
 * - phone (customer phone)
 * - email (customer email)
 * - subject (email subject)
 * - message (detailed order message)
 */
const EMAILJS_SERVICE_ID = "service_co73phf";   // ✅ your service id
const EMAILJS_TEMPLATE_ID = "template_yxde0f5"; // ✅ your template id
const EMAILJS_PUBLIC_KEY = "H2UJsW0orsgcU1lX5"; // ✅ your public key



interface CartItem extends Product {
  quantity: number;
}

interface CheckoutFormProps {
  cartItems: CartItem[];
  onOrderComplete: () => void;
}

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const ownerDisplayName = "RKVM Crackers"; // used in emails/whatsapp text

const CheckoutForm = ({ cartItems, onOrderComplete }: CheckoutFormProps) => {
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { addOrder } = useOrders();

  /**
   * ----------------------------------
   * Helpers: currency, phone, items
   * ----------------------------------
   */
  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const sanitizePhone = (raw: string) =>
    raw.replace(/[^\d]/g, "").slice(0, 15); // digits only, max 15

  const getTotalPrice = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cartItems]
  );

  const handleInputChange = (field: keyof FormState, value: string) => {
    const v = field === "phone" ? sanitizePhone(value) : value;
    setFormData((prev) => ({ ...prev, [field]: v }));
  };

  /**
   * -----------------------
   * Validation
   * -----------------------
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error("Valid phone number is required");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return false;
    }
    return true;
  };

  /**
   * -----------------------
   * Order text builders
   * -----------------------
   */
  const formatOrderItems = () =>
    cartItems
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} (x${item.quantity}) - ${formatCurrency(
            item.price * item.quantity
          )}`
      )
      .join("\n");

  const buildOrderHeader = () => {
    const orderDate = new Date();
    const id = `RKV${Date.now().toString().slice(-6)}`;
    return {
      id,
      date: orderDate.toLocaleDateString(),
      time: orderDate.toLocaleTimeString(),
    };
  };

  /**
   * -----------------------
   * WhatsApp share builder
   * -----------------------
   * Free + optional: opens WhatsApp with prefilled text
   */
  const buildWhatsAppText = () => {
    const { id, date, time } = buildOrderHeader();

    const lines = [
      `*${ownerDisplayName} - New Order* 🎇`,
      "",
      `*Order ID:* ${id}`,
      `*Date:* ${date} ${time}`,
      "",
      `*Customer:* ${formData.name}`,
      `*Phone:* ${formData.phone}`,
      `*Email:* ${formData.email || "Not provided"}`,
      `*Address:* ${formData.address}`,
      "",
      `*Items:*`,
      formatOrderItems(),
      "",
      `*Total:* ${formatCurrency(getTotalPrice)}`,
      formData.notes ? `*Notes:* ${formData.notes}` : "",
      "",
      `— Sent from RKVM Fireworks website`,
    ]
      .filter(Boolean)
      .join("\n");

    return encodeURIComponent(lines);
  };

  const openWhatsAppWithOrder = () => {
    const ownerWhatsApp = "919750153358"; // RKVM Crackers WhatsApp number
    const text = buildWhatsAppText();
    const url = `https://wa.me/${ownerWhatsApp}?text=${text}`;
    
    // Try to open WhatsApp
    try {
      // For mobile devices, try to open WhatsApp app directly
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Try WhatsApp app first
        const whatsappAppUrl = `whatsapp://send?phone=${ownerWhatsApp}&text=${text}`;
        window.location.href = whatsappAppUrl;
        
        // Fallback to web WhatsApp after a short delay
        setTimeout(() => {
          window.open(url, "_blank");
        }, 1000);
      } else {
        // For desktop, open WhatsApp Web
        window.open(url, "_blank");
      }
      
      console.log("WhatsApp opened with order details:", url);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const openCallForBulkOrder = () => {
    const phoneNumber = "919750153358"; // RKVM Crackers phone number
    const callUrl = `tel:${phoneNumber}`;
    
    try {
      // For mobile devices, try to open phone app
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = callUrl;
      } else {
        // For desktop, show the number
        alert(`Please call: +91 9750153358\n\nFor bulk orders and inquiries, please contact us directly.\n\nYou can also save this number: +91 9750153358`);
      }
    } catch (error) {
      console.error("Error opening call:", error);
      // Fallback: show the number
      alert(`Please call: +91 9750153358\n\nFor bulk orders and inquiries, please contact us directly.\n\nYou can also save this number: +91 9750153358`);
    }
  };

  /**
   * -----------------------
   * EmailJS: send to owner
   * -----------------------
   */
  const sendEmailToOwner = async () => {
    try {
      // Validate EmailJS configuration
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.error("EmailJS configuration is incomplete");
        return false;
      }

      // Prepare template parameters matching your EmailJS template
      const templateParams = {
        name: formData.name?.trim() || "Unknown Customer",
        phone: formData.phone?.trim() || "Not provided",
        email: formData.email?.trim() || "Not provided",
        subject: `New Order from ${formData.name?.trim() || "Customer"} - Order #RKV${Date.now().toString().slice(-6)}`,
        message: `Order Details:
- Customer Name: ${formData.name?.trim() || "Not provided"}
- Phone: ${formData.phone?.trim() || "Not provided"}
- Email: ${formData.email?.trim() || "Not provided"}
- Address: ${formData.address?.trim() || "Not provided"}

Order Items:
${formatOrderItems() || "No items"}

Total Amount: ₹${getTotalPrice?.toLocaleString("en-IN") || "0"}

Special Notes: ${formData.notes?.trim() || "None"}

Please contact the customer to confirm delivery details and payment.`
      };

      console.log("Sending email with parameters:", templateParams);

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("Email sent successfully:", response);
      return true;
    } catch (err: any) {
      console.error("Email send failed:", err);
      
      // Log specific error details for debugging
      if (err.status) {
        console.error("EmailJS Error Status:", err.status);
        console.error("EmailJS Error Text:", err.text);
      }
      
      // Handle specific error cases
      if (err.status === 422) {
        console.error("EmailJS 422 Error: Template parameter mismatch or recipients address is empty");
        toast.error("Email template configuration error. Please check template parameters.");
      } else if (err.status === 400) {
        console.error("EmailJS 400 Error: Bad request - check service ID and template ID");
        toast.error("Email service configuration error.");
      } else if (err.status === 401) {
        console.error("EmailJS 401 Error: Unauthorized - check public key");
        toast.error("Email authentication error.");
      } else {
        toast.error("Failed to send email. Please try WhatsApp instead.");
      }
      
      return false;
    }
  };

  /**
   * -----------------------
   * Submit handler
   * -----------------------
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    // Save order to system
    const orderData = {
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: formData.email || undefined,
      customerAddress: formData.address,
      customerNotes: formData.notes || undefined,
      orderItems: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      orderTotal: getTotalPrice
    };

    try {
      const orderSaved = await addOrder(orderData);
      if (!orderSaved) {
        toast.error("Order placed locally, but couldn't be saved to system.");
      }
    } catch (err) {
      console.error("Error saving order:", err);
    }

    // Send owner email (with fallback)
    let mailOk = false;
    try {
      mailOk = await sendEmailToOwner();
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      mailOk = false;
    }

    if (!mailOk) {
      console.log("Email failed, but order was saved locally. Customer can use WhatsApp as fallback.");
      // Don't show error toast here as it's handled in sendEmailToOwner
    }

    // Set success state and order details
    const orderId = `RKV${Date.now().toString().slice(-6)}`;
    setOrderDetails({
      customerName: formData.name,
      orderTotal: getTotalPrice,
      orderId: orderId,
      orderDate: new Date().toLocaleDateString(),
      orderTime: new Date().toLocaleTimeString()
    });
    setOrderSuccess(true);
    
    // Show success toast
    toast.success(`Order #${orderId} placed successfully! Thank you ${formData.name}! 🎆`);

    // Don't automatically open WhatsApp - let customer choose
    setIsSubmitting(false);
  };

  /**
   * -----------------------
   * Success Screen
   * -----------------------
   */
  if (orderSuccess && orderDetails) {
    return (
      <div className="space-y-6">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 5000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Card className="card-glow border-green-200 bg-green-50">
          <CardContent className="p-4 sm:p-8 text-center">
            {/* Animated Success Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center success-icon-bounce">
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-300 rounded-full success-ring-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-200 rounded-full success-ring-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-3 sm:mb-4 success-fade-in">
              Order Placed Successfully! 🎆
            </h2>
            
            <p className="text-base sm:text-lg text-green-700 mb-4 sm:mb-6 success-fade-in" style={{ animationDelay: '0.2s' }}>
              Thank you <strong>{orderDetails.customerName}</strong>! 
              Your order has been received and we'll contact you soon.
            </p>

            {/* Order Details */}
            <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-green-200 success-slide-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Order Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="text-left">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono font-bold text-gray-800 ml-1 sm:ml-2 break-all">{orderDetails.orderId}</span>
                </div>
                <div className="text-left">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600 ml-1 sm:ml-2">{formatCurrency(orderDetails.orderTotal)}</span>
                </div>
                <div className="text-left">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-800 ml-1 sm:ml-2">{orderDetails.orderDate}</span>
                </div>
                <div className="text-left">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-800 ml-1 sm:ml-2">{orderDetails.orderTime}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <div className="mb-4 sm:mb-6 success-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 sm:p-6 text-center">
                <h4 className="font-semibold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">📱 Connect via WhatsApp</h4>
                <Button 
                  onClick={openWhatsAppWithOrder}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-8 w-full shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">Send Order Details via WhatsApp</span>
                  <span className="sm:hidden">Send via WhatsApp</span>
                </Button>
                <p className="text-xs sm:text-sm text-green-700 mt-2 sm:mt-3">
                  Click to send your order details directly to our WhatsApp for faster communication
                </p>
              </div>
            </div>

            {/* Call Button for Bulk Orders */}
            <div className="mb-4 sm:mb-6 success-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6 text-center">
                <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">📞 Call for Bulk Orders</h4>
                <Button 
                  onClick={openCallForBulkOrder}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-8 w-full shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Call +91 9750153358
                </Button>
                <p className="text-xs sm:text-sm text-blue-700 mt-2 sm:mt-3">
                  For bulk orders, special pricing, and direct inquiries - call us now!
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-200 success-slide-up" style={{ animationDelay: '0.9s' }}>
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">What happens next?</h4>
              <ul className="text-xs sm:text-sm text-blue-700 text-left space-y-1">
                <li>• We've sent your order details to our team</li>
                <li>• You can send order details via WhatsApp (optional)</li>
                <li>• Our team will contact you within 24 hours</li>
                <li>• We'll confirm delivery details and payment</li>
                <li>• Feel free to contact us if you have any questions</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center success-slide-up" style={{ animationDelay: '1.1s' }}>
              <Button 
                onClick={() => {
                  setOrderSuccess(false);
                  setOrderDetails(null);
                  setFormData(initialForm);
                  onOrderComplete();
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Place Another Order
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setOrderSuccess(false);
                  setOrderDetails(null);
                  setFormData(initialForm);
                  onOrderComplete();
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * -----------------------
   * Empty cart UI
   * -----------------------
   */
  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Your cart is empty. Add some products to proceed with checkout.
          </p>
        </CardContent>
      </Card>
    );
  }

  /**
   * -----------------------
   * Render
   * -----------------------
   */
  return (
    <div className="space-y-6">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 5000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Order Summary */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground ml-2">
                    x{item.quantity}
                  </span>
                </div>
                <span className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">
                {formatCurrency(getTotalPrice)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call for Bulk Orders */}
      <Card className="card-glow border-blue-200 bg-blue-50">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">📞 Need Bulk Orders or Special Pricing?</h3>
              <p className="text-blue-700 text-xs sm:text-sm mb-3">
                For bulk orders, wholesale pricing, and special inquiries - call us directly!
              </p>
            </div>
            <Button 
              onClick={openCallForBulkOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 w-full sm:w-auto"
            >
              <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Call +91 9750153358
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Form */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        
        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out animate-pulse" style={{ width: '100%' }}></div>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="hidden sm:inline">Validating</span>
                <span className="sm:hidden">Val</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-primary"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="hidden sm:inline">Saving</span>
                <span className="sm:hidden">Save</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-primary"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="hidden sm:inline">Sending</span>
                <span className="sm:hidden">Send</span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 mt-3 text-center">Processing your order...</p>
          </div>
        )}
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="10-digit mobile number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@example.com"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete delivery address with landmarks"
                rows={3}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any special instructions for your order"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="btn-festive flex-1 relative overflow-hidden w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Processing Order...</span>
                    <span className="sm:hidden">Processing...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Place Order - {formatCurrency(getTotalPrice)}</span>
                    <span className="sm:hidden">Place Order</span>
                  </>
                )}
                
                {/* Loading bar animation */}
                {isSubmitting && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse" style={{ width: '100%' }}></div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutForm;
