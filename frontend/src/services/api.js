import axios from 'axios';

// في الـ production، الطلبات تروح عن طريق /api → Vercel proxy → Railway
// محلياً، VITE_API_URL بتحدد العنوان المباشر للـ backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: false,
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
  createUser: (data) => api.post('/admin/users', data),
  createTeam: (data) => api.post('/admin/teams', data),
  updateUserTeam: (userId, teamId) => api.put(`/admin/users/${userId}/team`, { team_id: teamId }),
};

export const aiService = {
  chat: (message, context = null) => api.post('/ai/chat', { message, context }),
};

export default api;
