import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { issueService, deleteRequestService, commentService } from '../../shared/api/api';
import './IssueDetailScreen.css';
import Sidebar from '../../shared/components/Sidebar';

const IssueDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get issue ID from URL (e.g., /issue/42)
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issue, setIssue] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const [deleteRequest, setDeleteRequest] = useState(null);   // pending request data
  const [showDeleteForm, setShowDeleteForm] = useState(false); // toggle inline form
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  
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
      
      // Fetch any pending delete request for this issue
      try {
        const drRes = await deleteRequestService.getPending(id);
        setDeleteRequest(drRes.data.data ?? null);
      } catch {
        // No pending request — that's fine
      }
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
      setIssue({
        ...updated,
        comments: updated.comments ?? issue.comments ?? []
      });
      setSelectedStatus(updated.status);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await commentService.addComment(id, { content: newComment });
      const newCommentData = response.data.data;
      setIssue({
        ...issue,
        comments: [...(issue.comments || []), newCommentData],
        updatedAt: newCommentData.createdAt || issue.updatedAt
      });
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSubmitDeleteRequest = async () => {

    console.log('=== SUBMITTING DELETE REQUEST ===');
  console.log('Issue ID:', id);
  console.log('Reason:', deleteReason);
  console.log('User:', user);
  console.log('User ID:', user.id);
  console.log('Issue User ID:', issue?.userId);
  console.log('Is Owner:', issue?.userId === user.id);



    if (!deleteReason.trim()) {
      setDeleteMsg('Please provide a reason.');
      return;
    }
    setDeleteLoading(true);
    setDeleteMsg('');
    try {
      await deleteRequestService.submit(id, deleteReason);
      setDeleteMsg('✓ Deletion request submitted. An admin will review it shortly.');
      setShowDeleteForm(false);
      setDeleteReason('');
      // Refresh to show the pending state
      const drRes = await deleteRequestService.getPending(id);
      setDeleteRequest(drRes.data.data ?? null);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Failed to submit request.';
      setDeleteMsg(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!deleteRequest) return;
    setDeleteLoading(true);
    try {
      await deleteRequestService.approve(deleteRequest.id);
      navigate('/dashboard'); // issue is gone, go back
    } catch (err) {
      setDeleteMsg('Failed to approve deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!deleteRequest) return;
    setDeleteLoading(true);
    try {
      await deleteRequestService.decline(deleteRequest.id);
      setDeleteRequest(null);
      setDeleteMsg('Delete request declined. User has been notified.');
    } catch (err) {
      setDeleteMsg('Failed to decline request.');
    } finally {
      setDeleteLoading(false);
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
          <Sidebar />

          {/* Main Content Area */}
          <div className="main-area">
            {/* Top Bar */}
            <div className="app-topbar">
              <div>
                <div className="page-title">Issue Details</div>
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
                        ISSUE-{issue.displayId ?? issue.id} · Created {formatDate(issue.createdAt)}
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
                      {issue.attachment && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="form-label">ATTACHMENT</div>

                          <div style={{ marginTop: '8px' }}>
                            {/* Image files */}
                            {/\.(png|jpg|jpeg|gif|webp)$/i.test(issue.attachment.filename) ? (
                              <div>
                                <img
                                  src={issue.attachment.url}
                                  alt={issue.attachment.filename}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    objectFit: 'contain',
                                    display: 'block',
                                    marginBottom: '8px'
                                  }}
                                />

                                <a
                                  href={issue.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="attachment-chip"
                                  style={{
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  🖼️ {issue.attachment.filename} — open full size
                                </a>
                              </div>
                            ) : (
                              /* Other files (PDF, docs, etc.) */
                              <a
                                href={issue.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-chip"
                                style={{
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                📄 {issue.attachment.filename} — view / download
                              </a>
                            )}
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
                          <button
                            className="btn-sm primary"
                            onClick={handleAddComment}
                            disabled={commentLoading || !newComment.trim()}
                          >
                            {commentLoading ? 'Posting...' : 'Post Comment'}
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

                    {/* ── Delete Request Section ─────────────────────────────────────── */}

                    {/* Regular user — owns the issue, no pending request yet */}
                    {!isAdmin && issue.userId === user.id && !deleteRequest && (
                      <div className="form-card" style={{ borderColor: 'rgba(239,68,68,0.2)', marginTop: '16px' }}>
                        <div className="form-card-title">Danger Zone</div>

                        {!showDeleteForm ? (
                          <button
                            className="btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            onClick={() => setShowDeleteForm(true)}
                          >
                            Request Deletion
                          </button>
                        ) : (
                          <div>
                            <div className="form-label" style={{ marginBottom: '8px' }}>
                              REASON FOR DELETION *
                            </div>
                            <textarea
                              className="comment-input-area"
                              placeholder="Explain why you want this issue deleted…"
                              value={deleteReason}
                              onChange={(e) => setDeleteReason(e.target.value)}
                              rows={3}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button
                                className="btn-sm primary"
                                onClick={handleSubmitDeleteRequest}
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? 'Submitting…' : 'Submit Request'}
                              </button>
                              <button
                                className="btn-sm ghost"
                                onClick={() => { setShowDeleteForm(false); setDeleteReason(''); setDeleteMsg(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {deleteMsg && (
                          <div style={{ marginTop: '10px', fontSize: '12px', color: deleteMsg.startsWith('✓') ? '#10b981' : '#ef4444' }}>
                            {deleteMsg}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular user — pending request already submitted */}
                    {!isAdmin && deleteRequest && (
                      <div className="form-card" style={{ borderColor: 'rgba(245,166,35,0.3)', marginTop: '16px' }}>
                        <div className="form-card-title">Deletion Request Pending</div>
                        {deleteMsg?.startsWith('✓') && (
                          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '6px', padding: '10px', marginBottom: '12px', fontSize: '12px', color: '#10b981' }}>
                            {deleteMsg}
                          </div>
                        )}
                        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
                          Your request is awaiting admin review.
                        </p>
                        <div className="form-label">YOUR REASON</div>
                        <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px' }}>
                          {deleteRequest.reason}
                        </p>
                      </div>
                    )}

                    {/* Admin — sees pending delete request and can approve or decline */}
                    {isAdmin && deleteRequest && (
                      <div className="form-card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginTop: '16px' }}>
                        <div className="form-card-title">
                          ⚠ Pending Deletion Request
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div className="form-label">REQUESTED BY</div>
                          <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px' }}>
                            {deleteRequest.requestedByName}
                          </p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <div className="form-label">REASON</div>
                          <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px', lineHeight: '1.5' }}>
                            {deleteRequest.reason}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-sm primary"
                            style={{ background: '#ef4444' }}
                            onClick={handleApprove}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? 'Processing…' : 'Approve & Delete'}
                          </button>
                          <button
                            className="btn-sm ghost"
                            onClick={handleDecline}
                            disabled={deleteLoading}
                          >
                            Decline
                          </button>
                        </div>
                        {deleteMsg && (
                          <p style={{ marginTop: '10px', fontSize: '12px', color: '#10b981' }}>{deleteMsg}</p>
                        )}
                      </div>
                    )}
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