import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const issueService = {
  // GET /issues — users see own; admins see all
  getMyIssues: (params = {}) => api.get('/issues', { params }),

  // GET /issues/:id
  getIssueById: (id) => api.get(`/issues/${id}`),

  // POST /issues — must send as multipart/form-data
  createIssue: (formData) =>
    api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // PUT /issues/:id
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),

  // DELETE /issues/:id (admin only)
  deleteIssue: (id) => api.delete(`/issues/${id}`),
};

export default api;