import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired/invalid tokens
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

// AUTH API
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ISSUE API
export const issueService = {
  // GET /issues — user sees own, admin sees all
  getMyIssues: (params = {}) => api.get('/issues', { params }),

  // GET /issues/:id
  getIssueById: (id) => api.get(`/issues/${id}`),

  // POST /issues — multipart/form-data
  createIssue: (formData) =>
    api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // PUT /issues/:id
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),

  // DELETE /issues/:id
  deleteIssue: (id) => api.delete(`/issues/${id}`),
};

export default api;