import axios from 'axios';

const api = axios.create({
  baseURL: "https://unitrack-backend-production-6cb0.up.railway.app"
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const userService = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  getNotifications: (userId) => api.get(`/users/${userId}/notifications`),
};

export const teamService = {
  getTasks: (teamId) => api.get(`/teams/${teamId}/tasks`),
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  getMessages: (teamId) => api.get(`/teams/${teamId}/messages`),
  sendMessage: (teamId, data) => api.post(`/teams/${teamId}/messages`, data),
  getAll: () => api.get('/teams'),
};

export const professorService = {
  getTeams: (profId) => api.get(`/professors/${profId}/teams`),
};

export const assistantService = {
  getTeams: (assistId) => api.get(`/assistants/${assistId}/teams`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
};

export default api;
