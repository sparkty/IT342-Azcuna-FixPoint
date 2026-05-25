import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationService, authService } from '../../shared/api/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;
  const profilePictureUrl = user.profilePictureUrl
    ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${user.profilePictureUrl}`
    : '';

  useEffect(() => {
    fetchUnreadCount();

    window.addEventListener('notificationsUpdated', fetchUnreadCount);
    return () => {
      window.removeEventListener('notificationsUpdated', fetchUnreadCount);
    };
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getNotifications();
      const data = response.data.data ?? [];
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      // Keep navigation usable if notifications are temporarily unavailable.
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('API logout failed, performing local logout:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-account">
        <button
          type="button"
          className="sidebar-user sidebar-user-button"
          onClick={() => setAccountMenuOpen(prev => !prev)}
          aria-expanded={accountMenuOpen}
        >
          <div className="sidebar-avatar">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt="" className="sidebar-avatar-img" />
            ) : (
              userInitials
            )}
          </div>
          <div className="sidebar-user-copy">
            <div className="sidebar-username">{userName}</div>
            <div className="sidebar-role">{user.role || 'USER'}</div>
          </div>
          <div className="sidebar-user-chevron">{accountMenuOpen ? '-' : '+'}</div>
        </button>

        {accountMenuOpen && (
          <div className="sidebar-account-menu">
            <button
              type="button"
              className={`sidebar-account-link ${isActive('/profile') ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              Account
            </button>
            <button
              type="button"
              className={`sidebar-account-link ${isActive('/settings') ? 'active' : ''}`}
              onClick={() => navigate('/settings')}
            >
              Settings
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-section">MAIN</div>

        <div
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="sidebar-icon">[]</span> My Issues
        </div>

        <div
          className={`sidebar-item ${isActive('/create-issue') ? 'active' : ''}`}
          onClick={() => navigate('/create-issue')}
        >
          <span className="sidebar-icon">+</span> New Issue
        </div>

        <div
          className={`sidebar-item ${isActive('/notifications') ? 'active' : ''}`}
          onClick={() => navigate('/notifications')}
        >
          <span className="sidebar-icon">!</span> Notifications
          {unreadCount > 0 && (
            <span className="sidebar-count red">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-item sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon"></span>Logout
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
