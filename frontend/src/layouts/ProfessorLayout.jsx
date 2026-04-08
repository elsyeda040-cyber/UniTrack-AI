import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const titles = {
  '/professor': 'My Teams',
  '/professor/analytics': 'Analytics',
  '/professor/chat': 'Team Chat',
  '/professor/ai': 'AI Assistant',
  '/professor/timeline': 'Project Timeline',
  '/professor/tasks': 'Task Management',
  '/professor/grades': 'Grades & Evaluation',
  '/professor/schedule': 'Schedule',
  '/professor/notifications': 'Notifications',
};

export default function ProfessorLayout() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/').slice(1, 3).join('/');
  const title = titles[base] || 'Professor Portal';
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
