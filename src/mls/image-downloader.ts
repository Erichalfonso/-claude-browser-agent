/**
 * Image Downloader
 *
 * Downloads listing images from MLS URLs to local temp directory
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

export interface DownloadResult {
  url: string;
  localPath: string;
  success: boolean;
  error?: string;
}

export interface DownloaderConfig {
  tempDir: string;
  maxConcurrent?: number;
  timeout?: number;
  retries?: number;
}

export class ImageDownloader {
  private config: DownloaderConfig;

  constructor(config: DownloaderConfig) {
    this.config = {
      maxConcurrent: 3,
      timeout: 30000,
      retries: 2,
      ...config,
    };

    // Ensure temp directory exists
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true });
    }
  }

  /**
   * Download all images for a listing
   */
  async downloadAll(imageUrls: string[], mlsNumber: string): Promise<DownloadResult[]> {
    const results: DownloadResult[] = [];

    // Process in batches to avoid overwhelming the server
    const batchSize = this.config.maxConcurrent || 3;

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url, index) =>
          this.downloadImage(url, mlsNumber, i + index)
        )
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Download a single image
   */
  async downloadImage(
    url: string,
    mlsNumber: string,
    index: number
  ): Promise<DownloadResult> {
    const extension = this.getExtension(url);
    const filename = `${mlsNumber}_${index}${extension}`;
    const localPath = path.join(this.config.tempDir, filename);

    let lastError: Error | null = null;
    const retries = this.config.retries || 2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.download(url, localPath);
        return {
          url,
          localPath,
          success: true,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`[ImageDownloader] Attempt ${attempt + 1} failed for ${url}: ${lastError.message}`);

        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await this.delay(1000 * Math.pow(2, attempt));
        }
      }
    }
    console.log(`[ImageDownloader] All attempts failed for ${url}`);


    return {
      url,
      localPath,
      success: false,
      error: lastError?.message || 'Download failed',
    };
  }

  /**
   * Perform the actual download
   */
  private download(url: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, { timeout: this.config.timeout }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.download(redirectUrl, localPath)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const fileStream = fs.createWriteStream(localPath);

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          fs.unlink(localPath, () => {}); // Delete partial file
          reject(error);
        });
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      request.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Clean up downloaded images
   */
  async cleanup(results: DownloadResult[]): Promise<void> {
    for (const result of results) {
      if (result.success && fs.existsSync(result.localPath)) {
        try {
          fs.unlinkSync(result.localPath);
        } catch (error) {
          console.error(`Failed to delete ${result.localPath}:`, error);
        }
      }
    }
  }

  /**
   * Clean up all files in temp directory
   */
  async cleanupAll(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.tempDir);
      for (const file of files) {
        const filePath = path.join(this.config.tempDir, file);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * Get file extension from URL
   */
  private getExtension(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const ext = path.extname(pathname).toLowerCase();

      // Default to .jpg if no extension
      if (!ext || !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return '.jpg';
      }

      return ext;
    } catch {
      return '.jpg';
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create an image downloader instance
 */
export function createImageDownloader(tempDir: string): ImageDownloader {
  return new ImageDownloader({ tempDir });
}
