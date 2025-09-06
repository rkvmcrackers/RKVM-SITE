import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { testGitHubConnection, saveProducts, getProducts, saveHighlights, getHighlights, saveConfig, getConfig } from '../utils/github-api';

const GitHubTestPage = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testProduct, setTestProduct] = useState({
    name: 'Test Product',
    price: 100,
    category: 'Test',
    description: 'This is a test product'
  });

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testGitHubConnection();
      if (result.exists) {
        setTestResult('✅ GitHub connection successful! Repository is accessible.');
      } else {
        setTestResult(`❌ GitHub connection failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error testing connection: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileCreation = async () => {
    setIsLoading(true);
    try {
      const testProducts = [
        {
          id: 'test-1',
          ...testProduct,
          inStock: true
        }
      ];
      
      const result = await saveProducts(testProducts);
      if (result) {
        setTestResult('✅ Test file created successfully! Check your GitHub repository.');
      } else {
        setTestResult('❌ Failed to create test file. Check console for details.');
      }
    } catch (error) {
      setTestResult(`❌ Error creating test file: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileReading = async () => {
    setIsLoading(true);
    try {
      const products = await getProducts();
      setTestResult(`✅ Successfully read ${products.length} products from GitHub.`);
    } catch (error) {
      setTestResult(`❌ Error reading products: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHighlights = async () => {
    setIsLoading(true);
    try {
      const testHighlights = ['🎆 New Year Special Offers!', '🎇 Diwali Festival Sale', '✨ Premium Quality Guaranteed'];
      const result = await saveHighlights(testHighlights);
      if (result) {
        setTestResult('✅ Highlights saved successfully! Check your GitHub repository.');
      } else {
        setTestResult('❌ Failed to save highlights. Check console for details.');
      }
    } catch (error) {
      setTestResult(`❌ Error saving highlights: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConfig = async () => {
    setIsLoading(true);
    try {
      const testConfig = {
        companyName: 'RKVM Crackers Test',
        contactPhone: '+91 98765 43210',
        contactEmail: 'test@rkvmcrackers.com',
        address: 'Test Address, Mumbai'
      };
      const result = await saveConfig(testConfig);
      if (result) {
        setTestResult('✅ Configuration saved successfully! Check your GitHub repository.');
      } else {
        setTestResult('❌ Failed to save configuration. Check console for details.');
      }
    } catch (error) {
      setTestResult(`❌ Error saving configuration: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">GitHub API Test Page</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Product Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={testProduct.name}
                    onChange={(e) => setTestProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={testProduct.price}
                    onChange={(e) => setTestProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={testProduct.category}
                    onChange={(e) => setTestProduct(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={testProduct.description}
                    onChange={(e) => setTestProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GitHub API Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                             <div className="flex flex-wrap gap-2">
                 <Button 
                   onClick={testConnection} 
                   disabled={isLoading}
                   variant="outline"
                 >
                   Test Connection
                 </Button>
                 <Button 
                   onClick={testFileCreation} 
                   disabled={isLoading}
                   variant="outline"
                 >
                   Test Products
                 </Button>
                 <Button 
                   onClick={testFileReading} 
                   disabled={isLoading}
                   variant="outline"
                 >
                   Test Reading
                 </Button>
                 <Button 
                   onClick={testHighlights} 
                   disabled={isLoading}
                   variant="outline"
                 >
                   Test Highlights
                 </Button>
                 <Button 
                   onClick={testConfig} 
                   disabled={isLoading}
                   variant="outline"
                 >
                   Test Config
                 </Button>
               </div>
              
              {testResult && (
                <Alert>
                  <AlertDescription>{testResult}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-gray-600">
                <p><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>First, test the connection to verify your GitHub setup</li>
                  <li>If connection works, test file creation</li>
                  <li>Finally, test file reading to ensure data persistence</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GitHubTestPage;
