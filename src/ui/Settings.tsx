import React, { useState } from 'react';
import type { AppSettings, PropertyType } from '../mls/types';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

export default function Settings({ settings, onSave }: SettingsProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showMlsPassword, setShowMlsPassword] = useState(false);
  const [showVlsPassword, setShowVlsPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onSave(formData);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const propertyTypes: PropertyType[] = [
    'Single Family',
    'Condo',
    'Townhouse',
    'Multi-Family',
    'Land',
    'Commercial',
  ];

  return (
    <div className="settings">
      <section className="settings-section">
        <h2>MLS API Credentials</h2>
        <p className="section-description">
          Contact your MLS provider to get API access credentials.
        </p>

        <div className="form-group">
          <label>MLS Name</label>
          <input
            type="text"
            placeholder="e.g., Stellar MLS"
            value={formData.mlsCredentials?.mlsName || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                mlsCredentials: {
                  ...formData.mlsCredentials!,
                  mlsName: e.target.value,
                  clientId: formData.mlsCredentials?.clientId || '',
                  clientSecret: formData.mlsCredentials?.clientSecret || '',
                  tokenEndpoint: formData.mlsCredentials?.tokenEndpoint || '',
                  apiBaseUrl: formData.mlsCredentials?.apiBaseUrl || '',
                },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Client ID</label>
          <input
            type="text"
            placeholder="Your API Client ID"
            value={formData.mlsCredentials?.clientId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                mlsCredentials: {
                  ...formData.mlsCredentials!,
                  clientId: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Client Secret</label>
          <div className="password-input">
            <input
              type={showMlsPassword ? 'text' : 'password'}
              placeholder="Your API Client Secret"
              value={formData.mlsCredentials?.clientSecret || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mlsCredentials: {
                    ...formData.mlsCredentials!,
                    clientSecret: e.target.value,
                  },
                })
              }
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowMlsPassword(!showMlsPassword)}
            >
              {showMlsPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Token Endpoint URL</label>
          <input
            type="text"
            placeholder="https://api.mls.com/oauth/token"
            value={formData.mlsCredentials?.tokenEndpoint || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                mlsCredentials: {
                  ...formData.mlsCredentials!,
                  tokenEndpoint: e.target.value,
                },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>API Base URL</label>
          <input
            type="text"
            placeholder="https://api.mls.com/reso/odata"
            value={formData.mlsCredentials?.apiBaseUrl || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                mlsCredentials: {
                  ...formData.mlsCredentials!,
                  apiBaseUrl: e.target.value,
                },
              })
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>VLS Homes Login</h2>
        <p className="section-description">
          Your VLS Homes account credentials for posting listings.
        </p>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={formData.vlsCredentials?.email || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                vlsCredentials: {
                  ...formData.vlsCredentials!,
                  email: e.target.value,
                  password: formData.vlsCredentials?.password || '',
                },
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="password-input">
            <input
              type={showVlsPassword ? 'text' : 'password'}
              placeholder="Your VLS Homes password"
              value={formData.vlsCredentials?.password || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vlsCredentials: {
                    ...formData.vlsCredentials!,
                    password: e.target.value,
                  },
                })
              }
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowVlsPassword(!showVlsPassword)}
            >
              {showVlsPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Search Criteria</h2>
        <p className="section-description">
          Filter which listings to fetch from MLS.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Cities (comma separated)</label>
            <input
              type="text"
              placeholder="Tampa, Orlando, Miami"
              value={formData.searchCriteria.cities?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    cities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label>ZIP Codes (comma separated)</label>
            <input
              type="text"
              placeholder="33602, 33603, 33604"
              value={formData.searchCriteria.zipCodes?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    zipCodes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Min Price ($)</label>
            <input
              type="number"
              placeholder="100000"
              value={formData.searchCriteria.minPrice || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Max Price ($)</label>
            <input
              type="number"
              placeholder="500000"
              value={formData.searchCriteria.maxPrice || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Min Beds</label>
            <input
              type="number"
              placeholder="2"
              min="0"
              max="10"
              value={formData.searchCriteria.minBeds || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    minBeds: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Max Beds</label>
            <input
              type="number"
              placeholder="5"
              min="0"
              max="10"
              value={formData.searchCriteria.maxBeds || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    maxBeds: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Min Baths</label>
            <input
              type="number"
              placeholder="1"
              min="0"
              max="10"
              step="0.5"
              value={formData.searchCriteria.minBaths || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  searchCriteria: {
                    ...formData.searchCriteria,
                    minBaths: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Property Types</label>
          <div className="checkbox-group">
            {propertyTypes.map((type) => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.searchCriteria.propertyTypes?.includes(type) || false}
                  onChange={(e) => {
                    const current = formData.searchCriteria.propertyTypes || [];
                    const updated = e.target.checked
                      ? [...current, type]
                      : current.filter((t) => t !== type);
                    setFormData({
                      ...formData,
                      searchCriteria: {
                        ...formData.searchCriteria,
                        propertyTypes: updated.length > 0 ? updated : undefined,
                      },
                    });
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Auto-Sync</h2>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.autoSync}
            onChange={(e) =>
              setFormData({
                ...formData,
                autoSync: e.target.checked,
              })
            }
          />
          Enable automatic syncing
        </label>

        {formData.autoSync && (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Sync every (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={formData.syncIntervalHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  syncIntervalHours: Number(e.target.value) || 24,
                })
              }
            />
          </div>
        )}
      </section>

      <div className="settings-actions">
        {saveMessage && (
          <span className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
            {saveMessage}
          </span>
        )}
        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
