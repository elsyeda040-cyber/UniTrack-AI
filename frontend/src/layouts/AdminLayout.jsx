import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const titles = {
  '/admin': 'Admin Overview',
  '/admin/users': 'User Management',
  '/admin/analytics': 'System Analytics',
  '/admin/settings': 'System Settings',
  '/admin/reports': 'Reports',
  '/admin/activity': 'Activity Log',
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/').slice(1, 3).join('/');
  const title = titles[base] || 'Admin Portal';
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
