import axios from 'axios';

// في الـ production، الطلبات تروح عن طريق /api → Vercel proxy → Railway
// محلياً، VITE_API_URL بتحدد العنوان المباشر للـ backend
const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const userService = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}/profile`, data),
  updatePassword: (userId, password) => api.put(`/users/${userId}/password`, { password }),
  getNotifications: (userId) => api.get(`/users/${userId}/notifications`),
  clearChatNotifications: (userId) => api.post(`/users/${userId}/notifications/clear-chat`),
  getBadges: (userId) => api.get(`/users/${userId}/badges`),
  getLeaderboard: () => api.get('/leaderboard'),
  analyzeCareer: (userId) => api.post(`/users/${userId}/analyze-career`),
};

export const teamService = {
  getTeam: (teamId) => api.get(`/teams/${teamId}`),
  getTasks: (teamId) => api.get(`/teams/${teamId}/tasks`),
  createTask: (teamId, data) => api.post(`/teams/${teamId}/tasks`, data),
  updateStudentEvaluation: (userId, data) => api.put(`/users/${userId}/evaluation`, data),
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  getMessages: (teamId, recipientId = null) => api.get(`/teams/${teamId}/messages`, { params: recipientId ? { recipient_id: recipientId } : {} }),
  sendMessage: (teamId, data, recipientId = null) => api.post(`/teams/${teamId}/messages`, { ...data, recipient_id: recipientId }),
  getChatSummary: (teamId) => api.post(`/teams/${teamId}/chat-summary`),
  updateMessage: (teamId, msgId, data) => api.put(`/teams/${teamId}/messages/${msgId}`, data),
  deleteMessage: (teamId, msgId, senderId) => api.delete(`/teams/${teamId}/messages/${msgId}`, { params: { sender_id: senderId } }),
  getTimeline: (teamId) => api.get(`/teams/${teamId}/timeline`),
  getFiles: (teamId) => api.get(`/teams/${teamId}/files`),
  getReviews: (teamId) => api.get(`/teams/${teamId}/reviews`),
  getTeamInsights: (teamId) => api.post(`/teams/${teamId}/insights`),
  getScratchpad: (teamId) => api.get(`/teams/${teamId}/scratchpad`),
  updateScratchpad: (teamId, content) => api.post(`/teams/${teamId}/scratchpad`, { content }),
  exportReport: (teamId) => api.post(`/teams/${teamId}/report/export`, {}, { responseType: 'blob' }),
  getCalendarSyncUrl: (teamId) => `${api.defaults.baseURL}/teams/${teamId}/calendar/sync`,
  createReview: (data) => api.post('/reviews', data),
  createEvent: (data) => api.post('/events', data),
  getAll: () => api.get('/teams'),
  
  // Advanced Features
  generateDocs: (teamId, docType) => api.post(`/teams/${teamId}/generate-docs`, null, { params: { doc_type: docType } }),
  getDocs: (teamId) => api.get(`/teams/${teamId}/docs`),
  getMeetings: (teamId) => api.get(`/teams/${teamId}/meetings`),
  createMeeting: (teamId, data) => api.post(`/teams/${teamId}/meetings`, data),
  getWhiteboard: (teamId) => api.get(`/teams/${teamId}/whiteboard`),
  updateWhiteboard: (teamId, data) => api.post(`/teams/${teamId}/whiteboard`, { team_id: teamId, data }),
  getRiskAssessment: (teamId) => api.get(`/teams/${teamId}/risk-assessment`),

  // v3.0 Futuristic Features
  reviewPresentation: (data) => api.post('/presentations/review', data),
  getPresentations: (teamId) => api.get(`/teams/${teamId}/presentations`),
  reviewCode: (code, language) => api.post('/ai/code-review', { code, language }),
  simulateRisk: (teamId, hypothetical_delays) => api.post(`/teams/${teamId}/simulate-risk`, { team_id: teamId, hypothetical_delays }),
  getSkillMatrix: (teamId) => api.get(`/teams/${teamId}/skill-matrix`),
  sendVoiceCommand: (message) => api.post('/ai/voice-command', { message })
};

export const communityService = {
  getHelpRequests: () => api.get('/help-requests'),
  createHelpRequest: (data) => api.post('/help-requests', data),
  solveHelpRequest: (reqId, solverId) => api.post(`/help-requests/${reqId}/solve`, null, { params: { solver_id: solverId } }),
};


export const professorService = {
  getTeams: (profId) => api.get(`/professors/${profId}/teams`),
  getTasks: (profId) => api.get(`/professors/${profId}/tasks`),
  getAnalytics: (profId) => api.get(`/professors/${profId}/analytics`),
  getEvents: (profId) => api.get(`/professors/${profId}/events`),
  exportGlobalReport: (profId) => api.post(`/professors/${profId}/report/export`, {}, { responseType: 'blob' }),
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
  updateUserPassword: (userId, password) => api.put(`/admin/users/${userId}/password`, { password }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  exportDatabase: () => api.get('/admin/database/export', { responseType: 'blob' }),
};

export const aiService = {
  chat: (message, context = null) => api.post('/ai/chat', { message, context }),
};

export default api;
