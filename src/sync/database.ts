/**
 * JSON File Storage for Sync Tracking
 *
 * Tracks which MLS listings have been synced to VLS Homes
 * to prevent duplicates and maintain sync history.
 *
 * Uses JSON file storage to avoid native module dependencies.
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface SyncedListing {
  mlsNumber: string;
  vlsListingId: string;
  address: string;
  city: string;
  price: number;
  syncedAt: string;
  updatedAt: string;
  status: 'active' | 'deleted' | 'expired';
}

export interface SyncLogEntry {
  mlsNumber: string;
  action: 'posted' | 'updated' | 'skipped' | 'failed' | 'deleted';
  message: string;
  timestamp: string;
}

interface SyncDatabase {
  listings: Record<string, SyncedListing>;
  log: SyncLogEntry[];
}

let dbCache: SyncDatabase | null = null;
let dbPath: string | null = null;

/**
 * Get the database file path
 */
function getDbPath(): string {
  if (dbPath) return dbPath;

  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'sync-tracking.json');
  return dbPath;
}

/**
 * Load the database from file
 */
function loadDatabase(): SyncDatabase {
  if (dbCache) return dbCache;

  const filePath = getDbPath();
  console.log('[Database] Loading:', filePath);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      dbCache = JSON.parse(data);
      console.log('[Database] Loaded existing data');
    } else {
      dbCache = { listings: {}, log: [] };
      console.log('[Database] Created new database');
    }
  } catch (error) {
    console.error('[Database] Error loading:', error);
    dbCache = { listings: {}, log: [] };
  }

  return dbCache!;
}

/**
 * Save the database to file
 */
function saveDatabase(): void {
  if (!dbCache) return;

  const filePath = getDbPath();
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Database] Error saving:', error);
  }
}

/**
 * Check if a listing has already been synced
 */
export function isListingSynced(mlsNumber: string): boolean {
  const db = loadDatabase();
  const listing = db.listings[mlsNumber];
  return listing?.status === 'active';
}

/**
 * Get synced listing info by MLS number
 */
export function getSyncedListing(mlsNumber: string): SyncedListing | null {
  const db = loadDatabase();
  return db.listings[mlsNumber] || null;
}

/**
 * Record a newly synced listing
 */
export function recordSyncedListing(
  mlsNumber: string,
  vlsListingId: string,
  address: string,
  city: string,
  price: number
): void {
  const db = loadDatabase();
  const now = new Date().toISOString();

  db.listings[mlsNumber] = {
    mlsNumber,
    vlsListingId,
    address,
    city,
    price,
    syncedAt: db.listings[mlsNumber]?.syncedAt || now,
    updatedAt: now,
    status: 'active',
  };

  saveDatabase();

  // Log the action
  logSyncAction(mlsNumber, 'posted', `Posted to VLS as ${vlsListingId}`);
}

/**
 * Mark a listing as deleted
 */
export function markListingDeleted(mlsNumber: string): void {
  const db = loadDatabase();
  const now = new Date().toISOString();

  if (db.listings[mlsNumber]) {
    db.listings[mlsNumber].status = 'deleted';
    db.listings[mlsNumber].updatedAt = now;
    saveDatabase();
  }

  logSyncAction(mlsNumber, 'deleted', 'Listing marked as deleted');
}

/**
 * Log a sync action
 */
export function logSyncAction(
  mlsNumber: string,
  action: SyncLogEntry['action'],
  message: string
): void {
  const db = loadDatabase();
  const now = new Date().toISOString();

  db.log.push({
    mlsNumber,
    action,
    message,
    timestamp: now,
  });

  // Keep only last 1000 log entries to prevent file bloat
  if (db.log.length > 1000) {
    db.log = db.log.slice(-1000);
  }

  saveDatabase();
}

/**
 * Get all synced listings
 */
export function getAllSyncedListings(status: string = 'active'): SyncedListing[] {
  const db = loadDatabase();
  return Object.values(db.listings)
    .filter((listing) => listing.status === status)
    .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
}

/**
 * Get sync stats
 */
export function getSyncStats(): { total: number; active: number; deleted: number } {
  const db = loadDatabase();
  const listings = Object.values(db.listings);

  return {
    total: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    deleted: listings.filter((l) => l.status === 'deleted').length,
  };
}

/**
 * Get recent sync log entries
 */
export function getRecentSyncLog(limit: number = 100): SyncLogEntry[] {
  const db = loadDatabase();
  return db.log.slice(-limit).reverse();
}

/**
 * Close/clear the database cache
 */
export function closeDatabase(): void {
  if (dbCache) {
    saveDatabase();
    dbCache = null;
    console.log('[Database] Closed');
  }
}
