// GitHub API service for data persistence
// This service uses GitHub's API to store and retrieve data as JSON files in a repository

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

interface GitHubFile {
  path: string;
  mode: string;
  type: string;
  sha?: string;
  content?: string;
}

class GitHubAPI {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Unicode-safe base64 encoding function
   * Handles characters outside the Latin1 range that btoa() can't handle
   */
  private unicodeSafeBase64Encode(str: string): string {
    try {
      // First try the standard btoa
      return btoa(str);
    } catch (e) {
      // If btoa fails, use a Unicode-safe approach
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }

  /**
   * Unicode-safe base64 decoding function
   * Handles characters outside the Latin1 range that atob() can't handle
   */
  private unicodeSafeBase64Decode(str: string): string {
    try {
      // First try the standard atob
      return atob(str);
    } catch (e) {
      // If atob fails, use a Unicode-safe approach
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    }
  }

  // Get file content and metadata from GitHub
  async getFile(path: string): Promise<{ content: any; sha: string } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // File doesn't exist
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      const content = this.unicodeSafeBase64Decode(data.content);
      return {
        content: JSON.parse(content),
        sha: data.sha
      };
    } catch (error) {
      console.error('Error fetching file from GitHub:', error);
      return null;
    }
  }

  // Create or update file in GitHub
  async putFile(path: string, content: any, message: string = 'Update data'): Promise<boolean> {
    const maxRetries = 5; // Increased retries
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`Attempt ${attempt}/${maxRetries} to update file: ${path}`);
        
        // Always get fresh file data for each attempt
        const existingFile = await this.getFile(path);
        let sha: string | undefined;

        if (existingFile && existingFile.sha) {
          // Check if content is actually different
          const existingContent = JSON.stringify(existingFile.content, null, 2);
          const newContent = JSON.stringify(content, null, 2);
          
          if (existingContent === newContent) {
            console.log('File content is identical, no update needed');
            return true;
          }
          
          sha = existingFile.sha;
          console.log(`File exists, using SHA: ${sha}`);
        } else {
          console.log('File does not exist, creating new file');
        }

        // Use Unicode-safe base64 encoding
        const fileContent = this.unicodeSafeBase64Encode(JSON.stringify(content, null, 2));
        
        const requestBody: any = {
          message: `${message} - ${new Date().toISOString()}`,
          content: fileContent,
          branch: this.config.branch,
        };
        
        // Add a small delay to avoid race conditions
        if (attempt > 1) {
          const delay = 500 + (attempt * 500); // Progressive delay: 1s, 1.5s, 2s
          console.log(`Adding delay: ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Only include SHA if file exists
        if (sha) {
          requestBody.sha = sha;
        }
        
        console.log('Request body prepared for:', path);
        
        const response = await fetch(
          `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${this.config.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('GitHub API response:', response.status, errorText);
          
          // Handle 409 conflict (stale SHA) - just continue to next attempt
          if (response.status === 409) {
            console.log('SHA conflict detected, will retry with fresh data...');
            // Just continue to next iteration - we'll get fresh SHA at the start of next attempt
            if (attempt < maxRetries) {
              const waitTime = 1000 + (attempt * 1000); // Progressive delay: 1s, 2s, 3s, 4s
              console.log(`Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          
          // If it's a 422 error, it might be because the parent directory doesn't exist
          if (response.status === 422) {
            console.log('File creation failed, trying to create parent directory...');
            const parentPath = path.split('/').slice(0, -1).join('/');
            if (parentPath) {
              try {
                const placeholderResponse = await fetch(
                  `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${parentPath}/.gitkeep`,
                  {
                    method: 'PUT',
                    headers: {
                      'Authorization': `token ${this.config.token}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: 'Create data directory',
                      content: btoa(''),
                      branch: this.config.branch,
                    }),
                  }
                );
                
                if (placeholderResponse.ok) {
                  console.log('Parent directory created');
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              } catch (dirError) {
                console.log('Could not create parent directory:', dirError);
              }
            }
          }
          
          // If this is not the last attempt, wait and continue to next iteration
          if (attempt < maxRetries) {
            const waitTime = 1000 + (attempt * 1000); // Progressive delay: 1s, 2s, 3s, 4s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }

        return true;
      } catch (error) {
        console.error(`Error updating file in GitHub (attempt ${attempt}):`, error);
        
        // If this is not the last attempt, wait and continue to next iteration
        if (attempt < maxRetries) {
          const waitTime = 1000 + (attempt * 1000); // Progressive delay: 1s, 2s, 3s, 4s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return false;
      }
    }
    
    return false;
  }

  // Fast upload method with fewer retries for single operations
  async putFileFast(path: string, content: any, message: string = 'Update data'): Promise<boolean> {
    const maxRetries = 2; // Only 2 retries for fast uploads
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fast attempt ${attempt}/${maxRetries} to update file: ${path}`);
        
        // Always get fresh file data for each attempt
        const existingFile = await this.getFile(path);
        let sha: string | undefined;

        if (existingFile && existingFile.sha) {
          // Check if content is actually different
          const existingContent = JSON.stringify(existingFile.content, null, 2);
          const newContent = JSON.stringify(content, null, 2);
          
          if (existingContent === newContent) {
            console.log('File content is identical, no update needed');
            return true;
          }
          
          sha = existingFile.sha;
          console.log(`File exists, using fresh SHA: ${sha}`);
        } else {
          console.log('File does not exist, creating new file');
        }

        // Use Unicode-safe base64 encoding
        const fileContent = this.unicodeSafeBase64Encode(JSON.stringify(content, null, 2));
        
        const requestBody: any = {
          message: `${message} - ${new Date().toISOString()}`,
          content: fileContent,
          branch: this.config.branch,
        };
        
        // Add delay between attempts (except first)
        if (attempt > 1) {
          const delay = 2000 + (attempt * 1000); // 2s, 3s
          console.log(`Adding fast delay: ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Only include SHA if file exists
        if (sha) {
          requestBody.sha = sha;
        }
        
        console.log('Fast request body prepared for:', path);
        
        const response = await fetch(
          `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${this.config.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          console.log('Fast file updated successfully on attempt', attempt);
          return true;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fast GitHub API response:', response.status, errorText);
          
          // Handle 409 conflict (stale SHA) - just continue to next attempt
          if (response.status === 409) {
            console.log('Fast SHA conflict detected, will retry with fresh data...');
            if (attempt < maxRetries) {
              continue;
            }
          }
          
          // If this is not the last attempt, wait and continue to next iteration
          if (attempt < maxRetries) {
            const waitTime = 2000 + (attempt * 1000); // 2s, 3s
            console.log(`Waiting ${waitTime}ms before fast retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error(`Fast GitHub API error: ${response.status} - ${errorText}`);
        }

        return true;
      } catch (error) {
        console.error(`Error in fast file update (attempt ${attempt}):`, error);
        
        // If this is not the last attempt, wait and continue to next iteration
        if (attempt < maxRetries) {
          const waitTime = 2000 + (attempt * 1000); // 2s, 3s
          console.log(`Waiting ${waitTime}ms before fast retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return false;
      }
    }
    
    return false;
  }

  // Check if repository exists and is accessible
  async checkRepositoryAccess(): Promise<{ exists: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        return { exists: true };
      } else if (response.status === 404) {
        return { exists: false, error: 'Repository not found' };
      } else if (response.status === 401) {
        return { exists: false, error: 'Invalid token or insufficient permissions' };
      } else if (response.status === 403) {
        return { exists: false, error: 'Access denied to repository' };
      } else {
        return { exists: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { exists: false, error: 'Network error' };
    }
  }

  // Delete file from GitHub
  async deleteFile(path: string, message: string = 'Delete file'): Promise<boolean> {
    try {
      const existingFile = await this.getFile(path);
      if (!existingFile || !existingFile.sha) {
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sha: existingFile.sha,
            branch: this.config.branch,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file in GitHub:', error);
      return false;
    }
  }
}

import { GITHUB_CONFIG } from '../config/github';

// Use configuration from config file
const defaultConfig: GitHubConfig = GITHUB_CONFIG;

// Create and export the GitHub API instance
export const githubAPI = new GitHubAPI(defaultConfig);

// Helper functions for specific data types
export const saveProducts = async (products: any[]) => {
  return await githubAPI.putFile('data/products.json', products, 'Update products');
};

// Fast upload for single product additions (fewer retries)
export const saveProductsFast = async (products: any[]) => {
  return await githubAPI.putFileFast('data/products.json', products, 'Add product');
};

export const getProducts = async () => {
  const result = await githubAPI.getFile('data/products.json');
  return result ? result.content : [];
};

export const saveOrders = async (orders: any[]) => {
  return await githubAPI.putFile('data/orders.json', orders, 'Update orders');
};

export const getOrders = async () => {
  const result = await githubAPI.getFile('data/orders.json');
  return result ? result.content : [];
};

// Highlights persistence
export const saveHighlights = async (highlights: string[]) => {
  return await githubAPI.putFile('data/highlights.json', highlights, 'Update highlights');
};

export const getHighlights = async () => {
  const result = await githubAPI.getFile('data/highlights.json');
  return result ? result.content : [];
};

// Configuration persistence
export const saveConfig = async (config: any) => {
  return await githubAPI.putFile('data/config.json', config, 'Update configuration');
};

export const getConfig = async () => {
  const result = await githubAPI.getFile('data/config.json');
  return result ? result.content : null;
};

// Test GitHub connection
export const testGitHubConnection = async () => {
  return await githubAPI.checkRepositoryAccess();
};

export default GitHubAPI;

