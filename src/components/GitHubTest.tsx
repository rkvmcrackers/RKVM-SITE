import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { testGitHubConnection, saveProducts, getProducts } from '../utils/github-api';

const GitHubTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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
          name: 'Test Product',
          price: 100,
          category: 'Test',
          description: 'This is a test product',
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GitHub API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
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
              Test File Creation
            </Button>
            <Button 
              onClick={testFileReading} 
              disabled={isLoading}
              variant="outline"
            >
              Test File Reading
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
  );
};

export default GitHubTest;
