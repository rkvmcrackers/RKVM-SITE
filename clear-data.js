// Simple script to clear all data from GitHub repository
// Run this with: node clear-data.js

import { clearAllData, checkDataStatus } from './src/utils/clear-all-data.js';

console.log('🚀 Starting data clearing process...\n');

// First check current status
console.log('📊 Checking current data status...');
const status = await checkDataStatus();

if (status) {
  console.log('\n🔄 Clearing all data...');
  const result = await clearAllData();
  
  if (result) {
    console.log('\n✅ All data cleared successfully!');
    console.log('🔄 Checking final status...');
    await checkDataStatus();
  } else {
    console.log('\n❌ Failed to clear data. Check the errors above.');
  }
} else {
  console.log('\n❌ Failed to check data status. Cannot proceed.');
}

console.log('\n✨ Script completed!');
