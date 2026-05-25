import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1` 
    : 'http://localhost:8080/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const clearAuthState = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const isStoredAuthValid = () => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');

  if (!token || !user) return false;

  try {
    JSON.parse(user);

    const [, payload] = token.split('.');
    if (!payload) return false;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    );
    const decodedPayload = JSON.parse(window.atob(paddedPayload));

    if (!decodedPayload.exp) return false;

    return decodedPayload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthState();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register:    (data) => api.post('/auth/register', data),
  login:       (data) => api.post('/auth/login', data),
  googleLogin: (accessToken) => api.post('/auth/google', { idToken: accessToken }),
  logout:      () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
};

export const issueService = {
  getMyIssues:  (params = {}) => api.get('/issues', { params }),
  getIssueById: (id)          => api.get(`/issues/${id}`),
  createIssue:  (formData)    => api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateIssue:  (id, data)    => api.put(`/issues/${id}`, data),
  deleteIssue:  (id)          => api.delete(`/issues/${id}`),
  getUsersWithIssues: ()      => api.get('/issues/users'),
};

export const commentService = {
  getComments: (issueId) => api.get(`/issues/${issueId}/comments`),
  addComment:  (issueId, data) => api.post(`/issues/${issueId}/comments`, data),
};

export const notificationService = {
  getNotifications: ()   => api.get('/notifications'),
  markAsRead:       (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead:    ()   => api.put('/notifications/read-all'),
  deleteAllRead:    ()   => api.delete('/notifications/read'),
};
export const deleteRequestService = {
  // Submit a deletion request for an issue
  submit: (issueId, reason) => 
    api.post(`/issues/${issueId}/request-deletion`, null, {
      params: { reason }
    }),
  
  // Get pending deletion request for an issue
  getPending: (issueId) => 
    api.get(`/issues/${issueId}/request-deletion`),
  
  // Approve a deletion request (Admin only)
  approve: (requestId) => 
    api.put(`/requests/${requestId}/approve`),
  
  // Decline a deletion request (Admin only)
  decline: (requestId) => 
    api.put(`/requests/${requestId}/decline`),
};

export default api;
