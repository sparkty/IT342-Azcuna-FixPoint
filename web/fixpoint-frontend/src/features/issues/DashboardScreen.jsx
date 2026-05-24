import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService } from '../../shared/api/api';
import './DashboardScreen.css';
import Sidebar from '../../shared/components/Sidebar';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');

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

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Filter issues based on search and filters
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'All Categories' || issue.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All Priority' || issue.priority === priorityFilter;
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

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = `${user.firstname?.charAt(0) || 'U'}${user.lastname?.charAt(0) || 'R'}`;
  const userName = `${user.firstname || 'User'} ${user.lastname || ''}`;

  if (loading) {
    return (
      <div className="dashboard-container">
        <nav className="top-nav">
          <div className="nav-logo">FIX<span style={{ color: 'var(--text2)' }}>POINT</span></div>
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
        <div className="nav-logo">
          FIX<span style={{ color: 'var(--text2)' }}>POINT</span>
        </div>
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
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
                <select
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option>All Categories</option>
                  <option>Bug</option>
                  <option>Feature</option>
                  <option>Access</option>
                </select>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option>All Priority</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;