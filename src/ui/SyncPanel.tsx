import React, { useState, useEffect } from 'react';
import type { AppSettings, SyncSession, SyncResult } from '../mls/types';

interface SyncPanelProps {
  settings: AppSettings;
  isConfigured: boolean;
  currentSession: SyncSession | null;
  onGoToSettings: () => void;
}

interface SyncProgress {
  current: number;
  total: number;
  address: string;
}

export default function SyncPanel({
  settings,
  isConfigured,
  currentSession,
  onGoToSettings,
}: SyncPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [liveResults, setLiveResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for progress updates
    window.electronAPI.onSyncProgress((prog) => {
      setProgress(prog);
    });

    window.electronAPI.onSyncError((err) => {
      setError(err);
      setIsSyncing(false);
    });

    window.electronAPI.onSyncComplete(() => {
      setIsSyncing(false);
      setProgress(null);
    });
  }, []);

  const handleStartSync = async () => {
    setIsSyncing(true);
    setError(null);
    setLiveResults([]);
    setProgress({ current: 0, total: 0, address: 'Connecting to MLS...' });

    // TODO: Call actual sync engine
    // For now, simulate progress
    await simulateSync();
  };

  const simulateSync = async () => {
    // This will be replaced with actual sync logic
    const mockAddresses = [
      '123 Main Street, Tampa FL',
      '456 Oak Avenue, Orlando FL',
      '789 Palm Drive, Miami FL',
    ];

    for (let i = 0; i < mockAddresses.length; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      setProgress({
        current: i + 1,
        total: mockAddresses.length,
        address: mockAddresses[i],
      });

      setLiveResults((prev) => [
        ...prev,
        {
          mlsNumber: `MLS${1000 + i}`,
          address: mockAddresses[i],
          status: Math.random() > 0.2 ? 'success' : 'skipped',
          message: Math.random() > 0.2 ? 'Posted successfully' : 'Already exists on VLS',
          timestamp: new Date(),
        },
      ]);
    }

    setIsSyncing(false);
    setProgress(null);
    await window.electronAPI.showNotification(
      'Sync Complete',
      `Processed ${mockAddresses.length} listings`
    );
  };

  const handleStopSync = () => {
    // TODO: Implement actual stop logic
    setIsSyncing(false);
    setProgress(null);
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="sync-panel not-configured">
        <div className="setup-prompt">
          <span className="icon">⚙️</span>
          <h2>Setup Required</h2>
          <p>Please configure your MLS API and VLS Homes credentials to start syncing.</p>
          <button className="btn-primary" onClick={onGoToSettings}>
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sync-panel">
      {/* Status Cards */}
      <div className="status-cards">
        <div className="status-card">
          <span className="status-icon">🔗</span>
          <div className="status-info">
            <span className="status-label">MLS</span>
            <span className="status-value">
              {settings.mlsCredentials?.mlsName || 'Connected'}
            </span>
          </div>
        </div>

        <div className="status-card">
          <span className="status-icon">🏠</span>
          <div className="status-info">
            <span className="status-label">VLS Homes</span>
            <span className="status-value">Ready</span>
          </div>
        </div>

        <div className="status-card">
          <span className="status-icon">🔍</span>
          <div className="status-info">
            <span className="status-label">Search</span>
            <span className="status-value">
              {settings.searchCriteria.cities?.join(', ') || 'All areas'}
            </span>
          </div>
        </div>
      </div>

      {/* Price Range Display */}
      {(settings.searchCriteria.minPrice || settings.searchCriteria.maxPrice) && (
        <div className="search-summary">
          Price: ${settings.searchCriteria.minPrice?.toLocaleString() || '0'} -{' '}
          ${settings.searchCriteria.maxPrice?.toLocaleString() || '∞'}
          {settings.searchCriteria.minBeds && ` | ${settings.searchCriteria.minBeds}+ beds`}
        </div>
      )}

      {/* Sync Button */}
      <div className="sync-actions">
        {!isSyncing ? (
          <button className="btn-sync" onClick={handleStartSync}>
            <span className="btn-icon">▶</span>
            Sync Now
          </button>
        ) : (
          <button className="btn-stop" onClick={handleStopSync}>
            <span className="btn-icon">⏹</span>
            Stop
          </button>
        )}
      </div>

      {/* Progress */}
      {progress && (
        <div className="sync-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
          <div className="progress-text">
            {progress.total > 0
              ? `${progress.current} of ${progress.total}`
              : progress.address}
          </div>
          <div className="progress-address">{progress.address}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="sync-error">
          <span className="error-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Live Results */}
      {liveResults.length > 0 && (
        <div className="live-results">
          <h3>Results</h3>
          <div className="results-list">
            {liveResults.map((result, index) => (
              <div key={index} className={`result-item ${result.status}`}>
                <span className="result-icon">
                  {result.status === 'success' ? '✓' : result.status === 'skipped' ? '⊘' : '✗'}
                </span>
                <span className="result-address">{result.address}</span>
                <span className="result-message">{result.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Sync Info */}
      {settings.lastSyncTime && !isSyncing && liveResults.length === 0 && (
        <div className="last-sync">
          Last sync: {new Date(settings.lastSyncTime).toLocaleString()}
        </div>
      )}
    </div>
  );
}
