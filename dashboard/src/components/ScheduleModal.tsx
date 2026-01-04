// Schedule settings modal component

import { useState, useEffect } from 'react';
import type { Workflow, ScheduleSettings } from '../types';
import './ScheduleModal.css';

interface ScheduleModalProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ScheduleSettings) => Promise<void>;
}

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
  'America/Anchorage',
];

export default function ScheduleModal({ workflow, isOpen, onClose, onSave }: ScheduleModalProps) {
  const [isScheduled, setIsScheduled] = useState(workflow.isScheduled || false);
  const [startTime, setStartTime] = useState(workflow.scheduleStartTime || '09:00');
  const [endTime, setEndTime] = useState(workflow.scheduleEndTime || '17:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(
    workflow.scheduleDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  );
  const [timezone, setTimezone] = useState(workflow.scheduleTimezone || 'America/New_York');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Update state when workflow changes
    setIsScheduled(workflow.isScheduled || false);
    setStartTime(workflow.scheduleStartTime || '09:00');
    setEndTime(workflow.scheduleEndTime || '17:00');
    setSelectedDays(workflow.scheduleDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    setTimezone(workflow.scheduleTimezone || 'America/New_York');
  }, [workflow]);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setError('');

    // Validate
    if (isScheduled) {
      if (!startTime || !endTime) {
        setError('Please set both start and end times');
        return;
      }
      if (selectedDays.length === 0) {
        setError('Please select at least one day');
        return;
      }
      if (startTime >= endTime) {
        setError('End time must be after start time');
        return;
      }
    }

    setSaving(true);

    try {
      await onSave({
        isScheduled,
        scheduleStartTime: startTime,
        scheduleEndTime: endTime,
        scheduleDays: selectedDays,
        scheduleTimezone: timezone,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Schedule Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <span>Enable Scheduled Runs</span>
            </label>
            <p className="help-text">
              When enabled, workflow will run automatically during the specified time window
            </p>
          </div>

          {isScheduled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="time-input"
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Active Days</label>
                <div className="days-grid">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`day-btn ${selectedDays.includes(day.value) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="timezone-select"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {workflow.lastScheduledRun && (
                <div className="info-box">
                  <strong>Last Run:</strong>{' '}
                  {new Date(workflow.lastScheduledRun).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
