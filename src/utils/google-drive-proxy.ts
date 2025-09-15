/**
 * Google Drive Image Proxy
 * Converts Google Drive URLs to direct image URLs that work without CORS
 */

export class GoogleDriveProxy {
  /**
   * Convert Google Drive URL to direct image URL
   */
  static convertToDirectUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }

    // Handle Google Drive thumbnail URLs
    if (url.includes('drive.google.com/thumbnail')) {
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const fileId = idMatch[1];
        // Convert to direct Google Drive image URL
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    // Handle Google Drive file URLs
    if (url.includes('drive.google.com/file/d/')) {
      const idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const fileId = idMatch[1];
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    // Handle Google Drive sharing URLs
    if (url.includes('drive.google.com/open')) {
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const fileId = idMatch[1];
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    // Return original URL if not a Google Drive URL
    return url;
  }

  /**
   * Get multiple proxy strategies for Google Drive images
   */
  static getProxyStrategies(originalUrl: string): string[] {
    const strategies = [];

    // Strategy 1: Direct Google Drive URL
    const directUrl = this.convertToDirectUrl(originalUrl);
    if (directUrl !== originalUrl) {
      strategies.push(directUrl);
    }

    // Strategy 2: Google Drive thumbnail with different sizes
    if (originalUrl.includes('drive.google.com')) {
      const idMatch = originalUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const fileId = idMatch[1];
        strategies.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`);
        strategies.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w800`);
        strategies.push(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`);
      }
    }

    // Strategy 3: Alternative Google Drive formats
    if (originalUrl.includes('drive.google.com')) {
      const idMatch = originalUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        const fileId = idMatch[1];
        strategies.push(`https://lh3.googleusercontent.com/d/${fileId}`);
        strategies.push(`https://lh4.googleusercontent.com/d/${fileId}`);
        strategies.push(`https://lh5.googleusercontent.com/d/${fileId}`);
        strategies.push(`https://lh6.googleusercontent.com/d/${fileId}`);
      }
    }

    // Strategy 4: Proxy services (as fallback)
    if (originalUrl.includes('drive.google.com')) {
      const directUrl = this.convertToDirectUrl(originalUrl);
      strategies.push(`https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}&q=85&f=webp`);
      strategies.push(`https://corsproxy.io/?${encodeURIComponent(directUrl)}`);
      strategies.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`);
    }

    return strategies;
  }

  /**
   * Check if URL is a Google Drive URL
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('googleusercontent.com');
  }
}
