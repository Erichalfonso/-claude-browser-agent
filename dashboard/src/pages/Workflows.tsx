// Workflows list page - shows all workflows with run buttons

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workflowsApi } from '../services/api';
import type { Workflow, ScheduleSettings } from '../types';
import ScheduleModal from '../components/ScheduleModal';
import './Workflows.css';

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    setError('');

    const response = await workflowsApi.list();
    if (response.success && response.data) {
      setWorkflows(response.data.workflows);
    } else {
      setError(response.error || 'Failed to load workflows');
    }

    setLoading(false);
  };

  const handleRunWorkflow = (workflowId: number) => {
    navigate(`/run/${workflowId}`);
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    const response = await workflowsApi.delete(id);
    if (response.success) {
      setWorkflows(workflows.filter(w => w.id !== id));
    } else {
      alert(response.error || 'Failed to delete workflow');
    }
  };

  const handleToggleActive = async (workflow: Workflow) => {
    const newStatus = workflow.status === 'active' ? 'ready' : 'active';

    const response = await workflowsApi.update(workflow.id, { status: newStatus });
    if (response.success && response.data) {
      setWorkflows(workflows.map(w =>
        w.id === workflow.id ? response.data!.workflow : w
      ));
    } else {
      alert(response.error || 'Failed to update workflow status');
    }
  };

  const handleOpenSchedule = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (schedule: ScheduleSettings) => {
    if (!selectedWorkflow) return;

    const response = await workflowsApi.updateSchedule(selectedWorkflow.id, schedule);
    if (response.success && response.data) {
      setWorkflows(workflows.map(w =>
        w.id === selectedWorkflow.id ? response.data!.workflow : w
      ));
    } else {
      throw new Error(response.error || 'Failed to save schedule');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      learning: { text: 'Learning...', className: 'status-learning' },
      ready: { text: 'Ready', className: 'status-ready' },
      active: { text: 'Active', className: 'status-active' },
    };
    return badges[status] || { text: status, className: '' };
  };

  return (
    <div className="workflows-page">
      <header className="page-header">
        <div className="header-content">
          <h1>My Workflows</h1>
          <div className="header-actions">
            <span className="user-info">
              {user?.fullName} ({user?.subscriptionTier})
            </span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="page-content">
        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="empty-state">
            <h2>No Workflows Yet</h2>
            <p>Create your first workflow using the Chrome extension.</p>
            <ol className="instructions">
              <li>Open the Chrome extension</li>
              <li>Navigate to the website you want to automate</li>
              <li>Tell the AI what to do (e.g., "Upload a listing")</li>
              <li>The workflow will appear here when learning is complete</li>
            </ol>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => {
              const badge = getStatusBadge(workflow.status);
              const isReady = workflow.status === 'ready';

              return (
                <div key={workflow.id} className="workflow-card">
                  <div className="workflow-header">
                    <h3>{workflow.name}</h3>
                    <span className={`status-badge ${badge.className}`}>
                      {badge.text}
                    </span>
                  </div>

                  {workflow.description && (
                    <p className="workflow-description">{workflow.description}</p>
                  )}

                  <div className="workflow-meta">
                    <div className="meta-item">
                      <span className="meta-label">Website:</span>
                      <span className="meta-value">{workflow.website}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Created:</span>
                      <span className="meta-value">
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {workflow.recordedActions && (
                      <div className="meta-item">
                        <span className="meta-label">Actions:</span>
                        <span className="meta-value">
                          {(workflow.recordedActions as any[]).length} steps
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="workflow-controls">
                    {isReady && (
                      <div className="activation-section">
                        <label className="activation-toggle">
                          <input
                            type="checkbox"
                            checked={workflow.status === 'active'}
                            onChange={() => handleToggleActive(workflow)}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">
                            {workflow.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                        {workflow.isScheduled && (
                          <div className="schedule-info">
                            <span className="schedule-icon">⏰</span>
                            <span className="schedule-text">
                              {workflow.scheduleStartTime} - {workflow.scheduleEndTime}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="workflow-actions">
                    {isReady ? (
                      <>
                        <button
                          onClick={() => handleRunWorkflow(workflow.id)}
                          className="btn-primary"
                        >
                          Run Now
                        </button>
                        <button
                          onClick={() => handleOpenSchedule(workflow)}
                          className="btn-schedule"
                        >
                          Schedule
                        </button>
                      </>
                    ) : (
                      <button className="btn-disabled" disabled>
                        {workflow.status === 'learning'
                          ? 'Still Learning...'
                          : 'Not Ready'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedWorkflow && (
        <ScheduleModal
          workflow={selectedWorkflow}
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
}
