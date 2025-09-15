/**
 * Simple Image Proxy Service
 * Handles image URL conversion and CORS proxy for external images
 */

// List of reliable proxy services (ordered by speed and reliability)
const PROXY_SERVICES = [
  'https://images.weserv.nl/?url=', // Fastest and most reliable
  'https://corsproxy.io/?', // Fast alternative
  'https://api.allorigins.win/raw?url=', // Good fallback
  'https://cors-anywhere.herokuapp.com/', // Last resort
  'https://thingproxy.freeboard.io/fetch/' // Backup
];

/**
 * Convert Google Drive sharing URL to direct download URL
 */
export const convertGoogleDriveUrl = (url: string): string => {
  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/
  ];
  
  let fileId = '';
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  if (!fileId) {
    console.warn('Could not extract file ID from Google Drive URL:', url);
    return url; // Return original URL if no file ID found
  }
  
  // Try multiple approaches for Google Drive images
  const approaches = [
    // Approach 1: Direct thumbnail URL (works for most images)
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
    // Approach 2: Direct download URL
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    // Approach 3: View URL
    `https://drive.google.com/file/d/${fileId}/view`,
    // Approach 4: Original URL with proxy
    convertToProxyUrl(`https://drive.google.com/uc?export=download&id=${fileId}`)
  ];
  
  // Use the first approach (thumbnail) as it's most reliable
  const finalUrl = approaches[0];
  console.log(`Google Drive URL converted: ${url} -> ${finalUrl}`);
  return finalUrl;
};

/**
 * Convert any URL to use a proxy service
 */
export const convertToProxyUrl = (url: string): string => {
  if (!url || url.startsWith('data:') || url.startsWith('/')) {
    return url; // Don't proxy data URLs or relative URLs
  }
  
  // For Google Drive URLs, try a different approach
  if (url.includes('drive.google.com')) {
    // Extract file ID and create a more accessible URL
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /\/open\?id=([a-zA-Z0-9-_]+)/
    ];
    
    let fileId = '';
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        fileId = match[1];
        break;
      }
    }
    
    if (fileId) {
      // Use a more reliable Google Drive URL format
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return `${PROXY_SERVICES[0]}${encodeURIComponent(directUrl)}`;
    }
  }
  
  // Use the first proxy service (weserv.nl is most reliable)
  return `${PROXY_SERVICES[0]}${encodeURIComponent(url)}`;
};

/**
 * Get multiple fallback URLs for an image
 */
export const getImageFallbacks = (url: string): string[] => {
  if (!url || url.startsWith('data:') || url.startsWith('/')) {
    return [url];
  }
  
  const fallbacks = [url];
  
  // Add proxy versions
  for (const proxy of PROXY_SERVICES) {
    fallbacks.push(`${proxy}${encodeURIComponent(url)}`);
  }
  
  return fallbacks;
};

/**
 * Check if a Google Drive URL is likely private
 */
export const isLikelyPrivateGoogleDriveUrl = (url: string): boolean => {
  return url.includes('drive.google.com') && 
         (url.includes('/view?usp=sharing') || url.includes('/file/d/'));
};

/**
 * Get warning message for private Google Drive URLs
 */
export const getPrivateImageWarning = (url: string): string => {
  return '⚠️ This Google Drive image appears to be private. Please make it public by right-clicking → Share → "Anyone with the link can view"';
};

/**
 * Simple Image Proxy Service Class
 */
export class SimpleImageProxy {
  static convertGoogleDriveUrl = convertGoogleDriveUrl;
  static convertToProxyUrl = convertToProxyUrl;
  static isLikelyPrivateGoogleDriveUrl = isLikelyPrivateGoogleDriveUrl;
  static getPrivateImageWarning = getPrivateImageWarning;
}
