// Mock data for UniTrack AI Platform - RESET FOR LAUNCH
export const MOCK_USERS = {
  student: {
    id: 'stu-001',
    name: 'New Student',
    email: 'student@university.edu',
    role: 'student',
    avatar: null,
    teamId: 'team-001',
    score: 0,
    rank: 0,
  },
  professor: {
    id: 'prof-001',
    name: 'Professor',
    email: 'professor@university.edu',
    role: 'professor',
    avatar: null,
    rating: 0,
    teams: ['team-001'],
  },
  assistant: {
    id: 'ta-001',
    name: 'Teaching Assistant',
    email: 'ta@university.edu',
    role: 'assistant',
    avatar: null,
    teams: ['team-001'],
  },
  admin: {
    id: 'admin-001',
    name: 'Administration',
    email: 'admin@university.edu',
    role: 'admin',
    avatar: null,
  },
};

export const MOCK_TEAMS = [
  {
    id: 'team-001',
    name: 'New Team',
    projectTitle: 'Unassigned Project',
    professorId: 'prof-001',
    professorName: 'Professor',
    assistantId: 'ta-001',
    assistantName: 'Assistant',
    progress: 0,
    color: '#3b82f6',
    emoji: '⭐',
    students: [
      { id: 'stu-001', name: 'New Student', score: 0, rank: 0, avatar: null, tasksCompleted: 0, tasksTotal: 0 },
    ],
  },
];

export const MOCK_TASKS = [];
export const MOCK_MESSAGES = [];
export const MOCK_NOTIFICATIONS = [];

export const MOCK_PROFESSORS = [];
export const PROGRESS_HISTORY = [
  { week: 'W1', progress: 0, tasks: 0 },
];
