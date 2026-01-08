import React, { useState } from 'react';
import type { SyncSession } from '../mls/types';

interface ResultsLogProps {
  sessions: SyncSession[];
  onClearHistory: () => Promise<void>;
}

export default function ResultsLog({ sessions, onClearHistory }: ResultsLogProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all sync history?')) return;
    setIsClearing(true);
    await onClearHistory();
    setIsClearing(false);
  };

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return 'In progress';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (sessions.length === 0) {
    return (
      <div className="results-log empty">
        <div className="empty-state">
          <span className="icon">📋</span>
          <h2>No Sync History</h2>
          <p>Your sync history will appear here after your first sync.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-log">
      <div className="log-header">
        <h2>Sync History</h2>
        <button
          className="btn-secondary"
          onClick={handleClear}
          disabled={isClearing}
        >
          {isClearing ? 'Clearing...' : 'Clear History'}
        </button>
      </div>

      <div className="sessions-list">
        {sessions.map((session) => (
          <div key={session.id} className="session-card">
            <div
              className="session-header"
              onClick={() =>
                setExpandedSession(
                  expandedSession === session.id ? null : session.id
                )
              }
            >
              <div className="session-date">
                <span className="date">
                  {new Date(session.startTime).toLocaleDateString()}
                </span>
                <span className="time">
                  {new Date(session.startTime).toLocaleTimeString()}
                </span>
              </div>

              <div className="session-stats">
                <span className="stat success">
                  <span className="stat-icon">✓</span>
                  {session.posted}
                </span>
                <span className="stat skipped">
                  <span className="stat-icon">⊘</span>
                  {session.skipped}
                </span>
                <span className="stat failed">
                  <span className="stat-icon">✗</span>
                  {session.failed}
                </span>
              </div>

              <div className="session-meta">
                <span className="duration">
                  {formatDuration(session.startTime, session.endTime)}
                </span>
                <span className={`expand-icon ${expandedSession === session.id ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {expandedSession === session.id && (
              <div className="session-details">
                <div className="details-summary">
                  <span>Total: {session.totalListings} listings</span>
                  <span>
                    Success rate:{' '}
                    {session.totalListings > 0
                      ? Math.round((session.posted / session.totalListings) * 100)
                      : 0}
                    %
                  </span>
                </div>

                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>MLS #</th>
                        <th>Address</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.results.map((result, index) => (
                        <tr key={index} className={result.status}>
                          <td>
                            <span className={`status-badge ${result.status}`}>
                              {result.status === 'success'
                                ? '✓'
                                : result.status === 'skipped'
                                ? '⊘'
                                : '✗'}
                            </span>
                          </td>
                          <td>{result.mlsNumber}</td>
                          <td>{result.address}</td>
                          <td>{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
