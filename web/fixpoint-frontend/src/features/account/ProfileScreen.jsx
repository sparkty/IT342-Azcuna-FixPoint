import React, { useEffect, useState } from 'react';
import { accountService } from '../../shared/api/api';
import Sidebar from '../../shared/components/Sidebar';
import TopNav from '../../shared/components/TopNav';
import '../issues/DashboardScreen.css';
import './AccountScreen.css';

const apiOrigin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ role: 'USER' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteReason, setDeleteReason] = useState('');
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = storedUser.role === 'ADMIN';

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncStoredUser = (nextProfile) => {
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...current,
      firstname: nextProfile.firstname,
      lastname: nextProfile.lastname,
      email: nextProfile.email,
      role: nextProfile.role,
      profilePictureUrl: nextProfile.profilePictureUrl,
    }));
  };

  const showError = (err, fallback) => {
    setError(err.response?.data?.error?.message || fallback);
    setMessage('');
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await accountService.getProfile();
      const data = response.data.data;
      setProfile(data);
      setForm({ role: data.role || 'USER' });
      syncStoredUser(data);
      if (data.role === 'ADMIN') {
        const requests = await accountService.getDeletionRequests();
        setDeletionRequests(requests.data.data ?? []);
      }
    } catch (err) {
      showError(err, 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    try {
      const response = await accountService.updateProfile({
        role: isAdmin ? form.role : profile.role,
      });
      const data = response.data.data;
      setProfile(data);
      syncStoredUser(data);
      setMessage('Profile updated.');
    } catch (err) {
      showError(err, 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Only PNG and JPG images are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);
    setSaving(true);
    setError('');
    try {
      const response = await accountService.updateProfilePicture(formData);
      const data = response.data.data;
      setProfile(data);
      syncStoredUser(data);
      setMessage('Profile picture updated.');
    } catch (err) {
      showError(err, 'Failed to upload profile picture.');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await accountService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed.');
    } catch (err) {
      showError(err, 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletionRequest = async (e) => {
    e.preventDefault();
    if (!deleteReason.trim()) {
      setError('Reason is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await accountService.requestDeletion(deleteReason);
      setProfile(response.data.data);
      setDeleteReason('');
      setMessage('Account deletion request submitted.');
    } catch (err) {
      showError(err, 'Failed to submit account deletion request.');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewDeletion = async (id, action) => {
    setSaving(true);
    setError('');
    try {
      if (action === 'approve') {
        await accountService.approveDeletionRequest(id);
        setMessage('Account deletion approved.');
      } else {
        await accountService.declineDeletionRequest(id);
        setMessage('Account deletion declined.');
      }
      const requests = await accountService.getDeletionRequests();
      setDeletionRequests(requests.data.data ?? []);
    } catch (err) {
      showError(err, 'Failed to review account deletion request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <nav className="top-nav"><TopNav /></nav>
        <div className="content">
          <div className="loading-state">Loading profile...</div>
        </div>
      </div>
    );
  }

  const pictureUrl = profile?.profilePictureUrl ? `${apiOrigin}${profile.profilePictureUrl}` : '';
  const initials = `${profile?.firstname?.charAt(0) || 'U'}${profile?.lastname?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="dashboard-container">
      <nav className="top-nav"><TopNav /></nav>
      <div className="content">
        <div className="app-shell">
          <Sidebar />
          <div className="main-area">
            <div className="app-topbar">
              <div>
                <div className="page-title">Account</div>
                <div className="page-sub">Manage your profile, sign-in options, and account actions</div>
              </div>
            </div>

            <div className="page-body account-page">
              {message && <div className="account-alert success">{message}</div>}
              {error && <div className="account-alert error">{error}</div>}

              <div className="account-grid">
                <section className="account-panel">
                  <div className="account-panel-title">Identity</div>
                  <div className="profile-summary">
                    <div className="profile-avatar-large">
                      {pictureUrl ? <img src={pictureUrl} alt="" /> : initials}
                    </div>
                    <label className="btn-sm ghost profile-upload">
                      Change Photo
                      <input type="file" accept="image/png,image/jpeg" onChange={handlePictureChange} />
                    </label>
                  </div>

                  <div className="account-field">
                    <label>Full Name</label>
                    <input value={profile.fullName} readOnly />
                  </div>
                  <div className="account-field">
                    <label>Email Address</label>
                    <input value={profile.email} readOnly />
                  </div>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="account-field">
                      <label>Role</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                        disabled={!isAdmin}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    {isAdmin && (
                      <button className="btn-sm primary" disabled={saving} type="submit">
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    )}
                  </form>
                </section>

                <section className="account-panel">
                  <div className="account-panel-title">Account Actions</div>
                  <form className="account-stack" onSubmit={handlePasswordSubmit}>
                    <div className="account-field">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="account-field">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="account-field">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <button className="btn-sm ghost" disabled={saving} type="submit">Change Password</button>
                  </form>

                  <div className="account-divider" />
                  {profile.deletionRequest?.status === 'PENDING' ? (
                    <div className="account-pending">Account deletion request pending admin approval.</div>
                  ) : (
                    <form className="account-stack" onSubmit={handleDeletionRequest}>
                      <div className="account-field">
                        <label>Delete Account Request</label>
                        <textarea
                          value={deleteReason}
                          maxLength={500}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Tell admins why you want this account deleted."
                        />
                      </div>
                      <button className="btn-sm ghost danger" disabled={saving} type="submit">
                        Request Account Deletion
                      </button>
                    </form>
                  )}
                </section>
              </div>

              {isAdmin && (
                <section className="account-panel admin-review-panel">
                  <div className="account-panel-title">Pending Account Deletion Requests</div>
                  {deletionRequests.length === 0 ? (
                    <div className="panel-empty">No pending account deletion requests.</div>
                  ) : (
                    deletionRequests.map(request => (
                      <div className="admin-request-row" key={request.id}>
                        <div>
                          <div className="account-action-title">{request.userName}</div>
                          <div className="field-hint">{request.email}</div>
                          <div className="request-reason">{request.reason}</div>
                        </div>
                        <div className="admin-request-actions">
                          <button className="btn-sm ghost" disabled={saving} onClick={() => handleReviewDeletion(request.id, 'decline')}>
                            Decline
                          </button>
                          <button className="btn-sm primary" disabled={saving} onClick={() => handleReviewDeletion(request.id, 'approve')}>
                            Approve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
