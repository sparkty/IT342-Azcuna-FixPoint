// NotificationsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, authService } from '../../shared/api/api';
import { useToast } from '../../shared/components/Toast';
import './NotificationsScreen.css';
import Sidebar from '../../shared/components/Sidebar';
import TopNav from '../../shared/components/TopNav';

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [deletingRead, setDeletingRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const response = await notificationService.getNotifications();
      const data = response.data.data ?? [];
      setNotifications(data);
    } catch (err) {
      const status = err.response?.status;
      if (!status || status === 404) {
        setNotifications([]); // endpoint not built yet — show empty silently
      } else if (showLoader) {
        setError('Failed to load notifications.');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    try {
      await notificationService.markAsRead(notificationId);
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      setNotifications(previousNotifications);
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await notificationService.markAllAsRead();
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      setNotifications(previousNotifications);
      console.error('Failed to mark all as read:', err);
      showToast('Failed to mark all notifications as read.', 'error');
    }
  };

  const handleDeleteAllRead = async () => {
    const previousNotifications = notifications;
    setDeletingRead(true);
    setNotifications(prev => prev.filter(n => !n.isRead));
    try {
      await notificationService.deleteAllRead();
      await fetchNotifications({ showLoader: false });
      window.dispatchEvent(new Event('notificationsUpdated'));
      showToast('Read notifications deleted.', 'success');
    } catch (err) {
      setNotifications(previousNotifications);
      console.error('Failed to delete read notifications:', err);
      showToast('Failed to delete read notifications.', 'error');
    } finally {
      setDeletingRead(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.issueId) {
      navigate(`/issue/${notification.issueId}`);
    }
  };

  // Sidebar navigation
  const handleMyIssues    = () => navigate('/dashboard');
  const handleNewIssue    = () => navigate('/create-issue');
  const handleNotifications = () => navigate('/notifications');
  const handleProfile     = () => navigate('/profile');
  const handleSettings    = () => navigate('/settings');
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

  const getFilteredNotifications = () => {
    switch (selectedTab) {
      case 'unread':  return notifications.filter(n => !n.isRead);
      case 'issues':  return notifications.filter(n => n.type === 'STATUS_UPDATE' || n.type === 'COMMENT');
      case 'system':  return notifications.filter(n => n.type === 'SYSTEM');
      default:        return notifications;
    }
  };

  const getUnreadCount = () => notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'STATUS_UPDATE': return { icon: '🔄', className: 'blue' };
      case 'COMMENT':       return { icon: '💬', className: 'yellow' };
      case 'SYSTEM':        return { icon: '📧', className: 'red' };
      default:              return { icon: '📢', className: 'blue' };
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1)   return 'Just now';
    if (diffMins < 60)  return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7)   return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = getUnreadCount();

  if (loading) {
    return (
      <div className="notifications-container">
        <nav className="top-nav">
          <TopNav />
        </nav>
        <div className="content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <nav className="top-nav">
        <TopNav />
      </nav>

      <div className="content">
        <div className="app-shell">
          <Sidebar />

          <div className="main-area">
            <div className="app-topbar">
              <div>
                <div className="page-title">Notifications</div>
                <div className="page-sub">System and issue update notifications</div>
              </div>
              <div className="topbar-actions">
                {unreadCount > 0 && (
                  <button className="btn-sm ghost" onClick={handleMarkAllAsRead}>
                    Mark all read
                  </button>
                )}
                {notifications.some(n => n.isRead) && (
                  <button className="btn-sm ghost" onClick={handleDeleteAllRead} disabled={deletingRead}>
                    {deletingRead ? 'Deleting...' : 'Delete read'}
                  </button>
                )}
              </div>
            </div>

            <div className="page-body">
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px', margin: '16px', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}

              <div className="filter-tabs">
                {['all', 'unread', 'issues', 'system'].map(tab => (
                  <button
                    key={tab}
                    className={`filter-tab ${selectedTab === tab ? 'active' : ''}`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'all' && notifications.length > 0 && (
                      <span className="tab-count">{notifications.length}</span>
                    )}
                    {tab === 'unread' && unreadCount > 0 && (
                      <span className="tab-count unread">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                  <div className="empty-notifications">
                    <div className="empty-icon">🔔</div>
                    <div className="empty-title">No notifications</div>
                    <div className="empty-message">
                      {selectedTab === 'unread'
                        ? "You don't have any unread notifications."
                        : "You're all caught up! New notifications will appear here."}
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const { icon, className } = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-dot"></div>
                        <div className={`notification-icon ${className}`}>{icon}</div>
                        <div className="notification-body">
                          <div className="notification-text">{notification.message}</div>
                          <div className="notification-time">{getRelativeTime(notification.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsScreen;
