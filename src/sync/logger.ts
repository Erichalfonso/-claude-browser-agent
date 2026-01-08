/**
 * Sync Logger
 *
 * Logs sync sessions and results to files
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SyncSession, SyncResult } from '../mls/types';

export interface LoggerConfig {
  logDir: string;
  maxLogFiles?: number;
}

export class SyncLogger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = {
      maxLogFiles: 30,
      ...config,
    };

    // Ensure log directory exists
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Log a sync session
   */
  logSession(session: SyncSession): void {
    const filename = this.getLogFilename(session.startTime);
    const filePath = path.join(this.config.logDir, filename);

    const logEntry = {
      ...session,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2), 'utf-8');

    // Clean up old logs
    this.cleanupOldLogs();
  }

  /**
   * Get all logged sessions
   */
  getSessions(): SyncSession[] {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .reverse();

      return files.map((file) => {
        const content = fs.readFileSync(
          path.join(this.config.logDir, file),
          'utf-8'
        );
        const data = JSON.parse(content);
        return {
          ...data,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        };
      });
    } catch (error) {
      console.error('Failed to read sessions:', error);
      return [];
    }
  }

  /**
   * Get a specific session by ID
   */
  getSession(id: string): SyncSession | null {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id) || null;
  }

  /**
   * Export sessions to CSV
   */
  exportToCSV(sessions: SyncSession[]): string {
    const headers = [
      'Session ID',
      'Start Time',
      'End Time',
      'Total Listings',
      'Posted',
      'Skipped',
      'Failed',
    ];

    const rows = sessions.map((session) => [
      session.id,
      session.startTime.toISOString(),
      session.endTime?.toISOString() || '',
      session.totalListings.toString(),
      session.posted.toString(),
      session.skipped.toString(),
      session.failed.toString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export results to CSV
   */
  exportResultsToCSV(results: SyncResult[]): string {
    const headers = ['MLS Number', 'Address', 'Status', 'Message', 'Timestamp'];

    const rows = results.map((result) => [
      result.mlsNumber,
      `"${result.address.replace(/"/g, '""')}"`,
      result.status,
      `"${result.message.replace(/"/g, '""')}"`,
      result.timestamp.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Generate log filename from date
   */
  private getLogFilename(date: Date): string {
    const iso = date.toISOString().replace(/[:.]/g, '-');
    return `sync-${iso}.json`;
  }

  /**
   * Clean up old log files
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter((f) => f.endsWith('.json'))
        .sort();

      const maxFiles = this.config.maxLogFiles || 30;

      if (files.length > maxFiles) {
        const toDelete = files.slice(0, files.length - maxFiles);
        for (const file of toDelete) {
          fs.unlinkSync(path.join(this.config.logDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

/**
 * Create a sync logger instance
 */
export function createSyncLogger(logDir: string): SyncLogger {
  return new SyncLogger({ logDir });
}
