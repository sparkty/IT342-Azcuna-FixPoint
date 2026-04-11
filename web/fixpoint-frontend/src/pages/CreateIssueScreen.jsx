// CreateIssueScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService } from '../services/api';
import '../styles/CreateIssueScreen.css';

const CreateIssueScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'MEDIUM',
    description: ''
  });
  
  const [attachments, setAttachments] = useState([]);
  
  const [suggestedTags] = useState([
    'authentication', 'frontend', 'safari-compat', 
    'oauth', 'ui-bug', 'critical'
  ]);

  // Navigation handlers
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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Issue title is required');
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
  const formPayload = new FormData();
  formPayload.append('title', formData.title.trim());
  formPayload.append('description', formData.description.trim());
  formPayload.append('category', formData.category.toUpperCase());
  formPayload.append('priority', formData.priority.toUpperCase());
  // Attach file if present
  if (attachments.length > 0) {
    formPayload.append('attachment', attachments[0].file);
  }

  const response = await issueService.createIssue(formPayload);
  const created = response.data.data;

  setSuccess('Issue created successfully!');
  setFormData({ title: '', category: '', priority: 'MEDIUM', description: '' });
  setAttachments([]);

    setTimeout(() => navigate(`/issue/${created.id}`), 1500);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Failed to create issue. Please try again.';
      setError(msg);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      ...formData,
      attachments,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('issueDraft', JSON.stringify(draft));
    setSuccess('Draft saved locally!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleTagClick = (tag) => {
    setFormData({
      ...formData,
      description: formData.description + (formData.description ? `\n[Tag: ${tag}]` : `[Tag: ${tag}]`)
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      file: file
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;

  return (
    <div className="create-issue-container">
      <nav className="top-nav">
        <div className="nav-logo">
          FIX<span style={{ color: 'var(--text2)' }}>POINT</span>
        </div>
      </nav>

      <div className="content">
        <div className="app-shell">
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
              <div className="sidebar-item" onClick={handleMyIssues}>
                <span className="sidebar-icon">📋</span> My Issues
              </div>
              <div className="sidebar-item active" onClick={handleNewIssue}>
                <span className="sidebar-icon">➕</span> New Issue
              </div>
              <div className="sidebar-item" onClick={handleNotifications}>
                <span className="sidebar-icon">🔔</span> Notifications
                <span className="sidebar-count">0</span>
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

          <div className="main-area">
            <div className="app-topbar">
              <div>
                <div className="page-title">New Issue</div>
                <div className="page-sub">Report a new issue for review</div>
              </div>
              <div className="topbar-actions">
                <button className="btn-sm ghost" onClick={handleBackToDashboard}>
                  ← Back
                </button>
                <button className="btn-sm primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'SUBMITTING...' : 'Submit Issue →'}
                </button>
              </div>
            </div>

            <div className="page-body">
              {error && (
                <div className="error-message" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}
              
              {success && (
                <div className="success-message" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#10b981' }}>
                  ✓ {success}
                </div>
              )}

              <div className="mobile-note">
                🌐 External API integration provides category suggestions and location data based on issue context.
              </div>

              <div className="issue-create-layout">
                <div>
                  <div className="form-card">
                    <div className="form-card-title">Issue Details</div>
                    <div className="form-grid">
                      <div className="form-group form-group-full">
                        <label className="form-label">ISSUE TITLE *</label>
                        <input
                          type="text"
                          name="title"
                          className="form-input"
                          placeholder="Brief, descriptive title for the issue…"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CATEGORY *</label>
                        <select
                          name="category"
                          className="form-input"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select category…</option>
                          <option>Bug</option>
                          <option>Feature</option>
                          <option>Access</option>
                          <option>Performance</option>
                          <option>UI</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">PRIORITY</label>
                        <select
                          name="priority"
                          className="form-input"
                          value={formData.priority}
                          onChange={handleInputChange}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                      <div className="form-group form-group-full">
                        <label className="form-label">DESCRIPTION *</label>
                        <textarea
                          name="description"
                          className="form-textarea"
                          placeholder="Describe the issue in detail. Include steps to reproduce, expected behavior, and actual behavior…"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-card">
                    <div className="form-card-title">
                      API Category Suggestions{' '}
                      <span className="api-badge">— powered by external API</span>
                    </div>
                    <div className="api-suggestion-box">
                      <div className="api-suggestion-title">SUGGESTED TAGS (click to apply)</div>
                      {suggestedTags.map((tag, index) => (
                        <span key={index} className="api-tag" onClick={() => handleTagClick(tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-card">
                    <div className="form-card-title">File Attachments</div>
                    <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
                      <div className="upload-icon">📎</div>
                      <div className="upload-text">Drag & drop files here, or click to browse</div>
                      <div className="upload-hint">Supports: JPG, PNG, GIF, PDF · Max 10MB per file</div>
                    </div>
                    <input
                      type="file"
                      id="fileInput"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                    />
                    <div className="attachments-list">
                      {attachments.map((file) => (
                        <div key={file.id} className="attachment-chip">
                          📄 {file.name} ({file.size})
                          <span className="remove-attachment" onClick={() => handleRemoveAttachment(file.id)}>×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="form-card sticky-preview">
                    <div className="form-card-title">Submission Preview</div>
                    <div className="preview-content">
                      <div>
                        <div className="form-label">SUBMITTED BY</div>
                        <div className="submitted-by">
                          <div className="preview-avatar">{userInitials}</div>
                          <span>{userName}</span>
                        </div>
                      </div>
                      <div className="preview-section">
                        <div className="form-label">INITIAL STATUS</div>
                        <div className="preview-status">
                          <span className="badge pending">Pending</span>
                        </div>
                      </div>
                      <div className="preview-section">
                        <div className="form-label">DATE & TIME</div>
                        <div className="preview-date">
                          {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="preview-section">
                        <div className="form-label">NOTIFICATION</div>
                        <div className="preview-notification">
                          ✉️ Confirmation email will be sent upon submission.
                        </div>
                      </div>
                      <div className="preview-section">
                        <div className="form-label">ATTACHMENTS</div>
                        <div className="preview-attachments">
                          {attachments.length} file(s) attached
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                      {loading ? 'SUBMITTING...' : 'SUBMIT ISSUE →'}
                    </button>
                    <button className="btn-draft" onClick={handleSaveDraft}>
                      SAVE AS DRAFT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIssueScreen;