import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationService, authService } from '../../shared/api/api';
 
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
 
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;
 
  // Fetch unread count on mount and whenever route changes
  useEffect(() => {
    fetchUnreadCount();

    // Listen for custom event to sync unread badge in real-time
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
      // Silently fail — don't break the sidebar if notifications endpoint is down
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
      <div className="sidebar-user">
        <div className="sidebar-avatar">{userInitials}</div>
        <div>
          <div className="sidebar-username">{userName}</div>
          <div className="sidebar-role">{user.role || 'USER'}</div>
        </div>
      </div>
 
      <div className="sidebar-nav">
        <div className="sidebar-section">MAIN</div>
 
        <div
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="sidebar-icon">📋</span> My Issues
        </div>
 
        <div
          className={`sidebar-item ${isActive('/create-issue') ? 'active' : ''}`}
          onClick={() => navigate('/create-issue')}
        >
          <span className="sidebar-icon">➕</span> New Issue
        </div>
 
        <div
          className={`sidebar-item ${isActive('/notifications') ? 'active' : ''}`}
          onClick={() => navigate('/notifications')}
        >
          <span className="sidebar-icon">🔔</span> Notifications
          {unreadCount > 0 && (
            <span className="sidebar-count red">{unreadCount}</span>
          )}
        </div>
 
        <div className="sidebar-section" style={{ marginTop: '12px' }}>ACCOUNT</div>
 
        <div
          className={`sidebar-item ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <span className="sidebar-icon">👤</span> Profile
        </div>
 
        <div
          className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <span className="sidebar-icon">⚙️</span> Settings
        </div>
      </div>
 
      <div className="sidebar-bottom">
        <div className="sidebar-item" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span> Logout
        </div>
      </div>
    </aside>
  );
};
 
export default Sidebar;