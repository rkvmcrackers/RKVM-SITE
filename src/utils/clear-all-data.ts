import { githubAPI } from './github-api';

// Function to clear all data and create empty files
export const clearAllData = async () => {
  try {
    console.log('🔄 Starting to clear all data...');
    
    // Clear products - create empty array
    const productsResult = await githubAPI.putFile('data/products.json', [], 'Clear all products data');
    if (productsResult) {
      console.log('✅ Products data cleared successfully');
    } else {
      console.log('❌ Failed to clear products data');
    }
    
    // Clear orders - create empty array
    const ordersResult = await githubAPI.putFile('data/orders.json', [], 'Clear all orders data');
    if (ordersResult) {
      console.log('✅ Orders data cleared successfully');
    } else {
      console.log('❌ Failed to clear orders data');
    }
    
    // Clear highlights - create empty array
    const highlightsResult = await githubAPI.putFile('data/highlights.json', { highlights: [] }, 'Clear all highlights data');
    if (highlightsResult) {
      console.log('✅ Highlights data cleared successfully');
    } else {
      console.log('❌ Failed to clear highlights data');
    }
    
    console.log('🎉 All data cleared successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

// Function to check current data status
export const checkDataStatus = async () => {
  try {
    console.log('🔍 Checking current data status...');
    
    const products = await githubAPI.getFile('data/products.json');
    const orders = await githubAPI.getFile('data/orders.json');
    const highlights = await githubAPI.getFile('data/highlights.json');
    
    console.log('📊 Current Data Status:');
    console.log(`Products: ${products ? JSON.parse(products.content).length : 0} items`);
    console.log(`Orders: ${orders ? JSON.parse(orders.content).length : 0} items`);
    console.log(`Highlights: ${highlights ? JSON.parse(highlights.content).highlights.length : 0} items`);
    
    return { products, orders, highlights };
    
  } catch (error) {
    console.error('❌ Error checking data status:', error);
    return null;
  }
};

export default clearAllData;
