





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
