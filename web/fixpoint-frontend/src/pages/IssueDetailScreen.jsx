// IssueDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueService } from '../services/api';
import '../styles/IssueDetailScreen.css';

const IssueDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get issue ID from URL (e.g., /issue/42)
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issue, setIssue] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch issue on component mount
  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
  setLoading(true);
  setError('');
  try {
    const response = await issueService.getIssueById(id);
    const issueData = response.data.data;
    setIssue(issueData);
    setSelectedStatus(issueData.status);
  } catch (err) {
    if (err.response?.status === 403) {
      setError('You do not have permission to view this issue.');
    } else {
      setError('Failed to load issue details.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleStatusUpdate = async (newStatus) => {
  setUpdatingStatus(true);
  try {
    const response = await issueService.updateIssue(id, { status: newStatus });
    const updated = response.data.data;
    setIssue(updated);
    setSelectedStatus(updated.status);
  } catch (err) {
    setError('Failed to update status.');
  } finally {
    setUpdatingStatus(false);
  }
};

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      // TODO: Uncomment when backend is ready
      // const response = await commentService.addComment(id, { content: newComment });
      // const newCommentData = response.data.data;
      // setIssue({
      //   ...issue,
      //   comments: [...(issue.comments || []), newCommentData]
      // });
      // setNewComment('');
      
      console.log('Comment added:', newComment);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleEdit = () => {
    navigate(`/edit-issue/${id}`);
  };

  // Navigation handlers for sidebar
  const handleMyIssues = () => {
    navigate('/dashboard');
  };

  const handleNewIssue = () => {
    navigate('/create-issue');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;
  const isAdmin = user.role === 'ADMIN';

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'PENDING':
      case 'Pending': return 'badge pending';
      case 'IN_PROGRESS':
      case 'In Progress': return 'badge inprogress';
      case 'RESOLVED':
      case 'Resolved': return 'badge resolved';
      default: return 'badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 'HIGH':
      case 'High': return 'badge high';
      case 'MEDIUM':
      case 'Medium': return 'badge medium';
      case 'LOW':
      case 'Low': return 'badge low';
      default: return 'badge';
    }
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'RESOLVED': return 'Resolved';
      default: return status;
    }
  };

  const getPriorityDisplay = (priority) => {
    switch(priority) {
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      default: return priority;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' · ' + date.toLocaleTimeString();
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="issue-detail-container">
        <nav className="top-nav">
          <div className="nav-logo">FIX<span style={{ color: 'var(--text2)' }}>POINT</span></div>
        </nav>
        <div className="content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>Loading issue details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-detail-container">
      <nav className="top-nav">
        <div className="nav-logo">
          FIX<span style={{ color: 'var(--text2)' }}>POINT</span>
        </div>
      </nav>

      <div className="content">
        <div className="app-shell">
          {/* Sidebar Navigation */}
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
              <div className="sidebar-item active" onClick={handleMyIssues}>
                <span className="sidebar-icon">📋</span> My Issues
              </div>
              <div className="sidebar-item" onClick={handleNewIssue}>
                <span className="sidebar-icon">➕</span> New Issue
              </div>
              <div className="sidebar-item" onClick={handleNotifications}>
                <span className="sidebar-icon">🔔</span> Notifications
              </div>
              <div className="sidebar-section" style={{ marginTop: '12px' }}>ACCOUNT</div>
              <div className="sidebar-item" onClick={handleProfile}>
                <span className="sidebar-icon">👤</span> Profile
              </div>
              <div className="sidebar-item" onClick={handleSettings}>
                <span className="sidebar-icon">⚙️</span> Settings
              </div>
            </div>
            <div className="sidebar-bottom">
              <div className="sidebar-item" onClick={handleLogout}>
                <span className="sidebar-icon">🚪</span> Logout
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-area">
            {/* Top Bar */}
            <div className="app-topbar">
              <div>
                <div className="page-title">Issue #{id}</div>
                <div className="page-sub">{issue?.title || 'Loading...'}</div>
              </div>
              <div className="topbar-actions">
                <button className="btn-sm ghost" onClick={handleBack}>
                  ← Back
                </button>
                {isAdmin && (
                  <button className="btn-sm ghost" onClick={handleEdit}>
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Page Body */}
            <div className="page-body">
              {error && (
                <div className="error-message" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}

              {!issue && !error && (
                <div className="no-issue" style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div>No issue data available.</div>
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>Connect to backend to view issue details.</div>
                </div>
              )}

              {issue && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
                  {/* Left Column - Main Content */}
                  <div>
                    {/* Issue Header */}
                    <div className="issue-detail-header">
                      <div className="issue-detail-id">
                        ISSUE-{issue.id} · Created {formatDate(issue.createdAt)}
                      </div>
                      <div className="issue-detail-title">{issue.title}</div>
                      <div className="issue-meta-row">
                        <div className="issue-meta-item">📁 {issue.category}</div>
                        <div className="issue-meta-item">
                          ⚡ <span style={{ color: issue.priority === 'HIGH' ? 'var(--accent)' : 'inherit' }}>
                            {getPriorityDisplay(issue.priority)} Priority
                          </span>
                        </div>
                        <div className="issue-meta-item">👤 {issue.reporterName || userName}</div>
                        <div className="issue-meta-item">🕐 Updated {getRelativeTime(issue.updatedAt)}</div>
                      </div>
                    </div>

                    {/* Description Card */}
                    <div className="form-card">
                      <div className="form-card-title">Description</div>
                      <div className="issue-description">
                        {issue.description}
                      </div>
                      {issue.attachments && issue.attachments.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="form-label">ATTACHMENTS</div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {issue.attachments.map((file, idx) => (
                              <div key={idx} className="attachment-chip">
                                🖼️ {file.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activity Timeline Card */}
                    <div className="form-card">
                      <div className="form-card-title">Activity Timeline</div>
                      <div className="timeline">
                        {/* Issue Created Event */}
                        <div className="timeline-item">
                          <div className="timeline-dot red">📝</div>
                          <div className="timeline-content">
                            <div className="timeline-event">
                              Issue submitted by {issue.reporterName || userName}
                            </div>
                            <div className="timeline-time">{formatDate(issue.createdAt)}</div>
                          </div>
                        </div>

                        {/* Status Change Events */}
                        {issue.statusHistory && issue.statusHistory.map((event, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-dot blue">🔄</div>
                            <div className="timeline-content">
                              <div className="timeline-event">
                                Status changed: <span style={{ color: 'var(--accent2)' }}>{event.oldStatus}</span> →{' '}
                                <span style={{ color: 'var(--accent3)' }}>{event.newStatus}</span>
                              </div>
                              <div className="timeline-time">
                                {formatDate(event.changedAt)} · by {event.changedBy}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Comments */}
                        {issue.comments && issue.comments.map((comment, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className="timeline-dot">💬</div>
                            <div className="timeline-content">
                              <div className="timeline-event">
                                <strong>{comment.authorName}</strong> commented
                              </div>
                              <div className="timeline-comment">{comment.content}</div>
                              <div className="timeline-time">{formatDate(comment.createdAt)}</div>
                            </div>
                          </div>
                        ))}

                        {/* No Activity Message */}
                        {(!issue.statusHistory || issue.statusHistory.length === 0) && 
                         (!issue.comments || issue.comments.length === 0) && (
                          <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <div className="timeline-event" style={{ color: 'var(--text3)' }}>
                                No additional activity yet.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Comment Section */}
                      <div style={{ marginTop: '16px' }}>
                        <div className="form-label">ADD COMMENT</div>
                        <textarea
                          className="comment-input-area"
                          placeholder="Write a comment or additional info…"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows="3"
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button className="btn-sm primary" onClick={handleAddComment}>
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Sidebar Info */}
                  <div>
                    <div className="form-card sticky-preview">
                      <div className="form-card-title">Issue Status</div>
                      <div className="preview-content">
                        <div>
                          <div className="form-label">CURRENT STATUS</div>
                          <div className="preview-status" style={{ marginTop: '6px' }}>
                            <span className={getStatusBadgeClass(issue.status)}>
                              {getStatusDisplay(issue.status)}
                            </span>
                          </div>
                        </div>

                        {/* Status Update Dropdown (Admin only) */}
                        {isAdmin && (
                          <div className="preview-section">
                            <div className="form-label">UPDATE STATUS</div>
                            <select
                              className="status-select"
                              value={selectedStatus}
                              onChange={(e) => handleStatusUpdate(e.target.value)}
                              disabled={updatingStatus}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                          </div>
                        )}

                        <div className="preview-section">
                          <div className="form-label">PRIORITY</div>
                          <div className="preview-status" style={{ marginTop: '6px' }}>
                            <span className={getPriorityBadgeClass(issue.priority)}>
                              {getPriorityDisplay(issue.priority)}
                            </span>
                          </div>
                        </div>

                        <div className="preview-section">
                          <div className="form-label">CATEGORY</div>
                          <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text2)' }}>
                            {issue.category}
                          </div>
                        </div>

                        <div className="preview-section">
                          <div className="form-label">REPORTER</div>
                          <div className="submitted-by" style={{ marginTop: '6px' }}>
                            <div className="preview-avatar">{issue.reporterInitials || userInitials}</div>
                            <span>{issue.reporterName || userName}</span>
                          </div>
                        </div>

                        <div className="preview-section">
                          <div className="form-label">CREATED</div>
                          <div className="preview-date">{formatDate(issue.createdAt)}</div>
                          <div className="form-label" style={{ marginTop: '10px' }}>LAST UPDATED</div>
                          <div className="preview-date">{formatDate(issue.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailScreen;