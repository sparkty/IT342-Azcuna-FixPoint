import React, { useEffect, useState } from 'react';
import { accountService } from '../../shared/api/api';
import Sidebar from '../../shared/components/Sidebar';
import TopNav from '../../shared/components/TopNav';
import '../issues/DashboardScreen.css';
import './AccountScreen.css';

const SettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotificationsEnabled: true,
    systemAnnouncementsEnabled: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await accountService.getSettings();
      const data = response.data.data;
      setSettings({
        emailNotificationsEnabled: Boolean(data.emailNotificationsEnabled),
        systemAnnouncementsEnabled: Boolean(data.systemAnnouncementsEnabled),
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await accountService.updateSettings(settings);
      const data = response.data.data;
      setSettings({
        emailNotificationsEnabled: Boolean(data.emailNotificationsEnabled),
        systemAnnouncementsEnabled: Boolean(data.systemAnnouncementsEnabled),
      });
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <nav className="top-nav"><TopNav /></nav>
        <div className="content">
          <div className="loading-state">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="top-nav"><TopNav /></nav>
      <div className="content">
        <div className="app-shell">
          <Sidebar />
          <div className="main-area">
            <div className="app-topbar">
              <div>
                <div className="page-title">Settings</div>
                <div className="page-sub">Control your notification preferences</div>
              </div>
            </div>

            <div className="page-body account-page">
              {message && <div className="account-alert success">{message}</div>}
              {error && <div className="account-alert error">{error}</div>}

              <form className="account-panel settings-panel" onSubmit={handleSubmit}>
                <div className="account-panel-title">Notification Settings</div>

                <label className="setting-toggle">
                  <div>
                    <div className="account-action-title">Email Notifications</div>
                    <div className="field-hint">Receive important issue updates by email.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotificationsEnabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      emailNotificationsEnabled: e.target.checked,
                    }))}
                  />
                </label>

                <label className="setting-toggle">
                  <div>
                    <div className="account-action-title">System Announcements</div>
                    <div className="field-hint">Show product and system messages in notifications.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.systemAnnouncementsEnabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      systemAnnouncementsEnabled: e.target.checked,
                    }))}
                  />
                </label>

                <div className="settings-actions">
                  <button className="btn-sm primary" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
