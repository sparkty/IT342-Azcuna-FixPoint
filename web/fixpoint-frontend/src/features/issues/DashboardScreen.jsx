import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService } from '../../shared/api/api';
import './DashboardScreen.css';
import Sidebar from '../../shared/components/Sidebar';
import TopNav from '../../shared/components/TopNav';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [usersWithIssues, setUsersWithIssues] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [activeDashboardTab, setActiveDashboardTab] = useState('issues');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  // Fetch issues on component mount
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await issueService.getMyIssues({ page: 0, size: 50 });
      const issuesData = response.data.data?.content ?? response.data.data ?? [];
      setIssues(issuesData);
      calculateStats(issuesData);
      if (isAdmin) {
        fetchUsersWithIssues();
      }
    } catch (err) {
      const status = err.response?.status;
      if (!status || status === 404) {
        setIssues([]);
        calculateStats([]);
      } else {
        setError('Failed to load issues. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersWithIssues = async () => {
    setUsersLoading(true);
    try {
      const response = await issueService.getUsersWithIssues();
      setUsersWithIssues(response.data.data ?? []);
    } catch (err) {
      console.error('Failed to load users with issues:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const calculateStats = (issuesData) => {
    const total = issuesData.length;
    const pending = issuesData.filter(i => i.status === 'PENDING' || i.status === 'Pending').length;
    const inProgress = issuesData.filter(i => i.status === 'IN_PROGRESS' || i.status === 'In Progress').length;
    const resolved = issuesData.filter(i => i.status === 'RESOLVED' || i.status === 'Resolved').length;
    setStats({ total, pending, inProgress, resolved });
  };

  const getIssueRouteId = (issue) => {
    return user.role === 'ADMIN' ? issue.id : (issue.displayId ?? issue.id);
  };

  const handleViewIssue = (issue) => {
    navigate(`/issue/${getIssueRouteId(issue)}`);
  };

  const handleNewIssue = () => {
    navigate('/create-issue');
  };

  const toggleUserIssues = (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Filter issues based on search and filters
  const filteredIssues = issues.filter(issue => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch ||
      issue.title?.toLowerCase().includes(normalizedSearch) ||
      issue.description?.toLowerCase().includes(normalizedSearch) ||
      String(issue.displayId ?? issue.id ?? '').includes(normalizedSearch);
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || issue.category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || issue.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

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

  if (loading) {
    return (
      <div className="dashboard-container">
        <nav className="top-nav">
          <TopNav />
        </nav>
        <div className="content">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>Loading issues...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="top-nav">
        <TopNav />
      </nav>

      <div className="content">
        <div className="app-shell">
          <Sidebar />

          <div className="main-area">
            <div className="app-topbar">
              <div>
                <div className="page-title">My Issues</div>
                <div className="page-sub">Track and manage your reported issues</div>
              </div>
              <div className="topbar-actions">
                <button className="btn-sm ghost">Export</button>
                <button className="btn-sm primary" onClick={handleNewIssue}>
                  + New Issue
                </button>
              </div>
            </div>

            <div className="page-body">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">TOTAL ISSUES</div>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-trend">All time</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">PENDING</div>
                  <div className="stat-value yellow">{stats.pending}</div>
                  <div className="stat-trend">Awaiting review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">IN PROGRESS</div>
                  <div className="stat-value blue">{stats.inProgress}</div>
                  <div className="stat-trend">Being worked on</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">RESOLVED</div>
                  <div className="stat-value green">{stats.resolved}</div>
                  <div className="stat-trend">Closed</div>
                </div>
              </div>

              {error && (
                <div className="error-message" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px', marginBottom: '16px', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}

              {isAdmin && (
                <div className="dashboard-tabs">
                  <button
                    type="button"
                    className={`dashboard-tab ${activeDashboardTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveDashboardTab('users')}
                  >
                    Users
                  </button>
                  <button
                    type="button"
                    className={`dashboard-tab ${activeDashboardTab === 'issues' ? 'active' : ''}`}
                    onClick={() => setActiveDashboardTab('issues')}
                  >
                    Issues
                  </button>
                </div>
              )}

              {isAdmin && activeDashboardTab === 'users' ? (
                <div className="users-panel">
                  {usersLoading ? (
                    <div className="panel-empty">Loading users...</div>
                  ) : usersWithIssues.length === 0 ? (
                    <div className="panel-empty">No users found.</div>
                  ) : (
                    usersWithIssues.map((siteUser) => {
                      const isExpanded = Boolean(expandedUsers[siteUser.id]);
                      const initials = `${siteUser.firstname?.charAt(0) || 'U'}${siteUser.lastname?.charAt(0) || ''}`.toUpperCase();
                      const fullName = `${siteUser.firstname || 'User'} ${siteUser.lastname || ''}`.trim();

                      return (
                        <div key={siteUser.id} className="user-group">
                          <button
                            type="button"
                            className="user-row"
                            onClick={() => toggleUserIssues(siteUser.id)}
                            aria-expanded={isExpanded}
                          >
                            <div className="user-avatar">{initials}</div>
                            <div className="user-info">
                              <div className="user-name">{fullName}</div>
                              <div className="user-email">{siteUser.email}</div>
                            </div>
                            <span className={`badge ${siteUser.role === 'ADMIN' ? 'high' : 'low'}`}>{siteUser.role}</span>
                            <div className="user-issue-count">{siteUser.issueCount} issue{siteUser.issueCount === 1 ? '' : 's'}</div>
                            <div className="user-chevron">{isExpanded ? '-' : '+'}</div>
                          </button>

                          {isExpanded && (
                            <div className="user-issues">
                              {siteUser.issues.length === 0 ? (
                                <div className="user-issue-empty">No issues submitted by this user.</div>
                              ) : (
                                siteUser.issues.map((issue) => (
                                  <button
                                    type="button"
                                    key={issue.id}
                                    className="user-issue-row"
                                    onClick={() => handleViewIssue(issue)}
                                  >
                                    <div className="issue-id">#{issue.displayId ?? issue.id}</div>
                                    <div className="issue-title-cell">
                                      <div className="issue-title-text">{issue.title}</div>
                                      <div className="issue-desc">{issue.description?.substring(0, 100)}...</div>
                                    </div>
                                    <span className="badge low">{issue.category}</span>
                                    <span className={getPriorityBadgeClass(issue.priority)}>
                                      {getPriorityDisplay(issue.priority)}
                                    </span>
                                    <span className={getStatusBadgeClass(issue.status)}>
                                      {getStatusDisplay(issue.status)}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <>
                  <div className="filter-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search issues by title, description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BILLING">Billing</option>
                  <option value="GENERAL">General</option>
                  <option value="OTHER">Other</option>
                </select>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="ALL">All Priority</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="issues-table">
                <div className="table-header">
                  <div className="th">#</div>
                  <div className="th">ISSUE</div>
                  <div className="th">CATEGORY</div>
                  <div className="th">PRIORITY</div>
                  <div className="th">STATUS</div>
                  <div className="th">CREATED</div>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="no-issues" style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
                    No issues found. Click "+ New Issue" to create one.
                  </div>
                ) : (
                  filteredIssues.map((issue, index) => (
                    <div 
                      key={issue.id} 
                      className="issue-row"
                      onClick={() => handleViewIssue(issue)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="issue-id">#{issue.displayId ?? index + 1}</div>
                      <div className="issue-title-cell">
                        <div className="issue-title-text">{issue.title}</div>
                        <div className="issue-desc">{issue.description?.substring(0, 100)}...</div>
                      </div>
                      <div>
                        <span className="badge low">{issue.category}</span>
                      </div>
                      <div>
                        <span className={getPriorityBadgeClass(issue.priority)}>
                          {getPriorityDisplay(issue.priority)}
                        </span>
                      </div>
                      <div>
                        <span className={getStatusBadgeClass(issue.status)}>
                          {getStatusDisplay(issue.status)}
                        </span>
                      </div>
                      <div className="issue-date">{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : '-'}</div>
                    </div>
                  ))
                )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
