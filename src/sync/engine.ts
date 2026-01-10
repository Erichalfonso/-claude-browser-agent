/**
 * Sync Engine
 *
 * Orchestrates the MLS → VLS Homes sync process
 */

import type {
  MLSListing,
  SyncResult,
  SyncSession,
  SearchCriteria,
  MLSCredentials,
  VLSCredentials,
} from '../mls/types';
import { v4 as uuidv4 } from 'uuid';
import { VLSPoster } from '../vls/poster';
import { ImageDownloader } from '../mls/image-downloader';
// import { MLSApiClient } from '../mls/api-client'; // TODO: Implement when credentials available

export interface SyncEngineConfig {
  mlsCredentials: MLSCredentials;
  vlsCredentials: VLSCredentials;
  searchCriteria: SearchCriteria;
  tempImageDir: string;
  onProgress?: (current: number, total: number, address: string) => void;
  onResult?: (result: SyncResult) => void;
}

export interface SyncEngineState {
  isRunning: boolean;
  shouldStop: boolean;
  currentSession: SyncSession | null;
}

export class SyncEngine {
  private config: SyncEngineConfig;
  private state: SyncEngineState;
  private vlsPoster: VLSPoster | null = null;
  private imageDownloader: ImageDownloader;

  constructor(config: SyncEngineConfig) {
    this.config = config;
    this.state = {
      isRunning: false,
      shouldStop: false,
      currentSession: null,
    };
    this.imageDownloader = new ImageDownloader({ tempDir: config.tempImageDir });
  }

  /**
   * Start a new sync session
   */
  async start(): Promise<SyncSession> {
    if (this.state.isRunning) {
      throw new Error('Sync is already running');
    }

    this.state.isRunning = true;
    this.state.shouldStop = false;

    const session: SyncSession = {
      id: uuidv4(),
      startTime: new Date(),
      totalListings: 0,
      posted: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };

    this.state.currentSession = session;

    try {
      // Step 1: Fetch listings from MLS
      this.reportProgress(0, 0, 'Connecting to MLS...');
      const listings = await this.fetchListings();
      session.totalListings = listings.length;

      if (listings.length === 0) {
        this.reportProgress(0, 0, 'No listings found matching criteria');
        session.endTime = new Date();
        return session;
      }

      this.reportProgress(0, listings.length, `Found ${listings.length} listings`);

      // Step 2: Process each listing
      for (let i = 0; i < listings.length; i++) {
        if (this.state.shouldStop) {
          break;
        }

        const listing = listings[i];
        this.reportProgress(i + 1, listings.length, listing.address);

        const result = await this.processListing(listing);
        session.results.push(result);

        if (result.status === 'success') {
          session.posted++;
        } else if (result.status === 'skipped') {
          session.skipped++;
        } else {
          session.failed++;
        }

        this.config.onResult?.(result);

        // Small delay between listings to avoid rate limiting
        await this.delay(1000);
      }

      session.endTime = new Date();
      return session;
    } finally {
      this.state.isRunning = false;
      this.state.currentSession = null;
    }
  }

  /**
   * Stop the current sync
   */
  stop(): void {
    this.state.shouldStop = true;
  }

  /**
   * Check if sync is running
   */
  isRunning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Fetch listings from MLS API
   */
  private async fetchListings(): Promise<MLSListing[]> {
    // TODO: Implement with real MLS API client
    // const client = new MLSApiClient(this.config.mlsCredentials);
    // return client.fetchListings(this.config.searchCriteria);

    // For now, return empty array (placeholder)
    console.log('MLS API not yet implemented - returning empty listings');
    return [];
  }

  /**
   * Process a single listing
   */
  private async processListing(listing: MLSListing): Promise<SyncResult> {
    try {
      // Step 1: Check if already posted (duplicate detection)
      const isDuplicate = await this.checkDuplicate(listing);
      if (isDuplicate) {
        return {
          mlsNumber: listing.mlsNumber,
          address: listing.address,
          status: 'skipped',
          message: 'Already exists on VLS Homes',
          timestamp: new Date(),
        };
      }

      // Step 2: Download images
      const localImages = await this.downloadImages(listing);

      // Step 3: Post to VLS Homes
      const vlsListingId = await this.postToVLS(listing, localImages);

      // Step 4: Clean up temp images
      await this.cleanupImages(localImages);

      return {
        mlsNumber: listing.mlsNumber,
        address: listing.address,
        status: 'success',
        message: 'Posted successfully',
        timestamp: new Date(),
        vlsListingId,
      };
    } catch (error) {
      return {
        mlsNumber: listing.mlsNumber,
        address: listing.address,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Check if listing already exists on VLS Homes
   */
  private async checkDuplicate(listing: MLSListing): Promise<boolean> {
    try {
      if (!this.vlsPoster) {
        this.vlsPoster = new VLSPoster({ credentials: this.config.vlsCredentials });
      }
      return await this.vlsPoster.checkDuplicate(listing.mlsNumber);
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return false;
    }
  }

  /**
   * Download listing images to temp directory
   */
  private async downloadImages(listing: MLSListing): Promise<string[]> {
    if (!listing.imageUrls || listing.imageUrls.length === 0) {
      return [];
    }

    const results = await this.imageDownloader.downloadAll(listing.imageUrls, listing.mlsNumber);
    return results
      .filter((r) => r.success)
      .map((r) => r.localPath);
  }

  /**
   * Post listing to VLS Homes
   */
  private async postToVLS(listing: MLSListing, imagePaths: string[]): Promise<string> {
    if (!this.vlsPoster) {
      this.vlsPoster = new VLSPoster({ credentials: this.config.vlsCredentials });
    }

    const result = await this.vlsPoster.postListing(listing, imagePaths);

    if (!result.success) {
      throw new Error(result.error || 'Failed to post listing');
    }

    return result.vlsListingId || '';
  }

  /**
   * Clean up temporary image files
   */
  private async cleanupImages(imagePaths: string[]): Promise<void> {
    const results = imagePaths.map((localPath) => ({
      url: '',
      localPath,
      success: true,
    }));
    await this.imageDownloader.cleanup(results);
  }

  /**
   * Cleanup resources when done
   */
  async cleanup(): Promise<void> {
    if (this.vlsPoster) {
      await this.vlsPoster.close();
      this.vlsPoster = null;
    }
    await this.imageDownloader.cleanupAll();
  }

  /**
   * Report progress to callback
   */
  private reportProgress(current: number, total: number, address: string): void {
    this.config.onProgress?.(current, total, address);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a sync engine instance
 */
export function createSyncEngine(config: SyncEngineConfig): SyncEngine {
  return new SyncEngine(config);
}
