import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Printer, Download, Eye, X } from 'lucide-react';
import { Product } from '../types/product';
import jsPDF from 'jspdf';

interface BillingItem {
  product: Product;
  quantity: number;
  price: number;
}

interface BillingComponentProps {
  products: Product[];
}

const BillingComponent: React.FC<BillingComponentProps> = ({ products }) => {
  const [selectedItems, setSelectedItems] = useState<BillingItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [billNumber, setBillNumber] = useState(`BILL-${Date.now().toString().slice(-6)}`);
  const [billDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Company details (static)
  const companyDetails = {
    name: 'RKVM CRACKERS',
    phone: '9750153358',
    email: 'rkvmpyrotech2021@gmail.com',
    address: 'RKVM Crackers, India'
  };

  const handleProductSelect = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, { product, quantity: 1, price: product.price }]);
    } else {
      setSelectedItems(prev => prev.filter(item => item.product.id !== product.id));
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    setSelectedItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity, price: item.product.price * quantity }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // No GST, total equals subtotal
  };

  const generatePDF = async () => {
    if (selectedItems.length === 0) return;

    try {
      // Show loading state
      setIsGeneratingPDF(true);
      setSuccess("🔄 Generating PDF...");
      setError("");
      
      // Create a hidden, print-optimized bill content for PDF generation
      const printBillContent = createPrintOptimizedBill();
      
      // Wait for the content to be rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Make the element visible temporarily for capture
      printBillContent.style.visibility = 'visible';
      printBillContent.style.position = 'fixed';
      printBillContent.style.left = '0';
      printBillContent.style.top = '0';
      printBillContent.style.zIndex = '9999';
      
      // Wait for the element to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture the print-optimized bill content as canvas
      const canvas = await html2canvas(printBillContent, {
        scale: 1.5, // Good balance between quality and performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: printBillContent.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging to debug issues
        removeContainer: false,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all styles are properly applied in the cloned document
          const clonedElement = clonedDoc.querySelector('#pdf-generation-temp') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Arial, sans-serif';
            clonedElement.style.fontSize = '14px';
            clonedElement.style.lineHeight = '1.4';
            clonedElement.style.color = '#000000';
            clonedElement.style.backgroundColor = '#ffffff';
          }
        }
      });
      
      // Hide the element again
      printBillContent.style.visibility = 'hidden';
      printBillContent.style.zIndex = '-1';

      // Validate canvas before proceeding
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty or invalid');
      }
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Convert canvas to PDF using jsPDF
      const imgData = canvas.toDataURL('image/png');
      
      // Validate image data
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data from canvas');
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit the content properly
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('PDF dimensions:', pageWidth, 'x', pageHeight);
      console.log('Image dimensions:', imgWidth, 'x', imgHeight);
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Clean up the temporary element
      if (printBillContent && printBillContent.parentNode) {
        document.body.removeChild(printBillContent);
      }
      
      // Save PDF
      pdf.save(`RKVM_Bill_${billNumber}.pdf`);
      
      setSuccess("✅ PDF generated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Clean up in case of error
      try {
        const printBillContent = document.getElementById('pdf-generation-temp');
        if (printBillContent && printBillContent.parentNode) {
          document.body.removeChild(printBillContent);
        }
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }
      
      // Try fallback method using the existing bill content
      try {
        console.log('Trying fallback PDF generation method...');
        await generatePDFFallback();
        return;
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
      }
      
      setError("❌ Failed to generate PDF. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFFallback = async () => {
    // Fallback method using the existing bill content
    const billContent = document.getElementById('bill-content');
    if (!billContent) {
      throw new Error('Bill content not found for fallback');
    }

    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default;
    
    // Capture the existing bill content as canvas
    const canvas = await html2canvas(billContent, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true
    });

    // Validate canvas
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Fallback canvas is empty or invalid');
    }

    // Convert canvas to PDF using jsPDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit the content properly
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Save PDF
    pdf.save(`RKVM_Bill_${billNumber}.pdf`);
    
    setSuccess("✅ PDF generated successfully (fallback method)!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const createPrintOptimizedBill = () => {
    // Create a temporary div for print-optimized bill content
    const printDiv = document.createElement('div');
    printDiv.id = 'pdf-generation-temp';
    printDiv.style.position = 'fixed';
    printDiv.style.left = '0';
    printDiv.style.top = '0';
    printDiv.style.width = '800px';
    printDiv.style.height = 'auto';
    printDiv.style.backgroundColor = '#ffffff';
    printDiv.style.fontFamily = 'Arial, sans-serif';
    printDiv.style.fontSize = '14px';
    printDiv.style.lineHeight = '1.4';
    printDiv.style.color = '#000000';
    printDiv.style.zIndex = '-1';
    printDiv.style.visibility = 'hidden';
    printDiv.style.overflow = 'visible';
    
    printDiv.innerHTML = `
      <div style="padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px;">
          <h1 style="font-size: 36px; font-weight: bold; color: #333; margin: 0 0 15px 0;">${companyDetails.name}</h1>
          <div style="color: #666; font-size: 16px;">
            <p style="margin: 5px 0;">Phone: ${companyDetails.phone}</p>
            <p style="margin: 5px 0;">Email: ${companyDetails.email}</p>
            <p style="margin: 5px 0; font-weight: bold;">${companyDetails.address}</p>
          </div>
        </div>

        <!-- Bill Details -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 28px; font-weight: bold; color: #333; margin: 0 0 20px 0;">INVOICE</h2>
          <div style="display: flex; justify-content: space-between; background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: bold;">
            <span><strong>Bill No:</strong> ${billNumber}</span>
            <span><strong>Date:</strong> ${billDate}</span>
          </div>
        </div>

        <!-- Customer Details -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border: 2px solid #2196f3; margin-bottom: 40px;">
          <h3 style="font-size: 20px; font-weight: bold; color: #1976d2; margin: 0 0 15px 0;">Bill To:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; color: #333; font-size: 14px;">
            <div><strong>Name:</strong> ${customerName || 'N/A'}</div>
            <div><strong>Phone:</strong> ${customerPhone || 'N/A'}</div>
            <div><strong>Address:</strong> ${customerAddress || 'N/A'}</div>
          </div>
        </div>

        <!-- Products Table -->
        <div style="margin-bottom: 40px;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #333;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="border: 2px solid #333; padding: 12px; text-align: left; font-weight: bold; color: #333;">S.No</th>
                <th style="border: 2px solid #333; padding: 12px; text-align: left; font-weight: bold; color: #333;">Product</th>
                <th style="border: 2px solid #333; padding: 12px; text-align: center; font-weight: bold; color: #333;">Qty</th>
                <th style="border: 2px solid #333; padding: 12px; text-align: right; font-weight: bold; color: #333;">Price</th>
                <th style="border: 2px solid #333; padding: 12px; text-align: right; font-weight: bold; color: #333;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedItems.map((item, index) => `
                <tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f9f9f9;'}">
                  <td style="border: 2px solid #333; padding: 12px; font-weight: bold;">${index + 1}</td>
                  <td style="border: 2px solid #333; padding: 12px; font-weight: bold;">${item.product.name}</td>
                  <td style="border: 2px solid #333; padding: 12px; text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td style="border: 2px solid #333; padding: 12px; text-align: right; font-weight: bold;">₹${item.product.price}</td>
                  <td style="border: 2px solid #333; padding: 12px; text-align: right; font-weight: bold;">₹${item.price}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="text-align: right; background: #f5f5f5; padding: 30px; border-radius: 8px; border: 2px solid #333;">
          <div style="font-size: 18px; margin-bottom: 15px;">
            <span style="font-weight: bold; color: #333;">Subtotal:</span>
            <span style="margin-left: 20px; font-weight: bold; color: #333;">₹${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div style="font-size: 24px; border-top: 2px solid #333; padding-top: 15px;">
            <span style="font-weight: bold; color: #333;">Total:</span>
            <span style="margin-left: 20px; font-weight: bold; color: #1976d2;">₹${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 50px; color: #666; border-top: 2px solid #333; padding-top: 20px;">
          <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">Thank you for your business!</p>
          <p style="font-size: 14px; margin: 0;">For any queries, please contact us</p>
        </div>
      </div>
    `;
    
    // Append to body temporarily
    document.body.appendChild(printDiv);
    
    // Debug: Log the content to verify it's created
    console.log('Print-optimized bill content created:', printDiv.innerHTML.substring(0, 200) + '...');
    console.log('Print div dimensions:', printDiv.offsetWidth, 'x', printDiv.offsetHeight);
    
    return printDiv;
  };

  const previewBill = () => {
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="h-6 w-6 text-primary" />
            <span>Billing & Invoice Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Details - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone"
                className="w-full"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Input
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter customer address"
                className="w-full"
              />
            </div>
          </div>

          {/* Bill Details - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Bill number"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Bill Date</Label>
              <Input value={billDate} disabled className="w-full" />
            </div>
          </div>

          {/* Product Selection - Mobile First */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const isSelected = selectedItems.some(item => item.product.id === product.id);
                const selectedItem = selectedItems.find(item => item.product.id === product.id);

                return (
                  <Card key={product.id} className={`${isSelected ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleProductSelect(product, checked as boolean)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <Badge variant={product.inStock ? "default" : "secondary"}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{product.description}</p>
                          <p className="font-semibold text-primary">₹{product.price}</p>

                          {isSelected && (
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`qty-${product.id}`} className="text-xs">Qty:</Label>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="1"
                                value={selectedItem?.quantity || 1}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeItem(product.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bill Summary */}
          {selectedItems.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {selectedItems.map((item, index) => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <span className="text-sm">
                        {index + 1}. {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium">₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={previewBill} variant="outline" className="flex-1 w-full sm:w-auto">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Bill
                  </Button>
                  <Button onClick={generatePDF} className="flex-1 w-full sm:w-auto" disabled={isGeneratingPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Bill Preview Modal - Mobile First */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold">Bill Preview</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>

            {/* Bill Content - Mobile Responsive */}
            <div id="bill-content" className="border-2 border-gray-300 p-4 sm:p-8 bg-white max-w-4xl mx-auto">
              {/* Company Header */}
              <div className="text-center mb-6 sm:mb-8 border-b-2 border-gray-300 pb-4 sm:pb-6">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">{companyDetails.name}</h1>
                <div className="space-y-1 text-gray-700">
                  <p className="text-sm sm:text-lg">Phone: {companyDetails.phone}</p>
                  <p className="text-sm sm:text-lg">Email: {companyDetails.email}</p>
                  <p className="text-sm sm:text-lg font-medium">{companyDetails.address}</p>
                </div>
              </div>

              {/* Bill Details */}
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">INVOICE</h2>
                <div className="flex flex-col sm:flex-row justify-between text-sm sm:text-lg font-medium bg-gray-50 p-3 sm:p-4 rounded-lg gap-2 sm:gap-0">
                  <span><strong>Bill No:</strong> {billNumber}</span>
                  <span><strong>Date:</strong> {billDate}</span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6 sm:mb-8 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-blue-800">Bill To:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-gray-700 text-sm sm:text-base">
                  <div><strong>Name:</strong> {customerName || 'N/A'}</div>
                  <div><strong>Phone:</strong> {customerPhone || 'N/A'}</div>
                  <div className="sm:col-span-2 lg:col-span-1"><strong>Address:</strong> {customerAddress || 'N/A'}</div>
                </div>
              </div>

              {/* Products Table - Mobile Responsive */}
              <div className="mb-6 sm:mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-2 border-gray-400 min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border-2 border-gray-400 p-2 sm:p-3 text-left font-bold text-gray-800 text-xs sm:text-sm">S.No</th>
                        <th className="border-2 border-gray-400 p-2 sm:p-3 text-left font-bold text-gray-800 text-xs sm:text-sm">Product</th>
                        <th className="border-2 border-gray-400 p-2 sm:p-3 text-center font-bold text-gray-800 text-xs sm:text-sm">Qty</th>
                        <th className="border-2 border-gray-400 p-2 sm:p-3 text-right font-bold text-gray-800 text-xs sm:text-sm">Price</th>
                        <th className="border-2 border-gray-400 p-2 sm:p-3 text-right font-bold text-gray-800 text-xs sm:text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => (
                        <tr key={item.product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border-2 border-gray-400 p-2 sm:p-3 font-medium text-xs sm:text-sm">{index + 1}</td>
                          <td className="border-2 border-gray-400 p-2 sm:p-3 font-medium text-xs sm:text-sm">{item.product.name}</td>
                          <td className="border-2 border-gray-400 p-2 sm:p-3 text-center font-medium text-xs sm:text-sm">{item.quantity}</td>
                          <td className="border-2 border-gray-400 p-2 sm:p-3 text-right font-medium text-xs sm:text-sm">₹{item.product.price}</td>
                          <td className="border-2 border-gray-400 p-2 sm:p-3 text-right font-bold text-xs sm:text-sm">₹{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="text-right space-y-2 sm:space-y-3 bg-gray-100 p-4 sm:p-6 rounded-lg border-2 border-gray-300">
                <div className="text-lg sm:text-xl">
                  <span className="font-bold text-gray-800">Subtotal:</span>
                  <span className="ml-2 sm:ml-4 font-bold text-gray-800">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="text-xl sm:text-2xl border-t-2 border-gray-400 pt-2 sm:pt-3">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="ml-2 sm:ml-4 font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 sm:mt-10 text-gray-600 border-t-2 border-gray-300 pt-4 sm:pt-6">
                <p className="text-base sm:text-lg font-medium">Thank you for your business!</p>
                <p className="text-xs sm:text-sm mt-1 sm:mt-2">For any queries, please contact us</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="w-full sm:w-auto">
                Close
              </Button>
              <Button onClick={generatePDF} disabled={isGeneratingPDF} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingComponent;
