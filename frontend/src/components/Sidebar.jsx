import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Users, BookOpen, Shield, ClipboardList, Sun, Moon, Sparkles, Calendar, HardDrive, Star, Edit3, Book,
  Video, ShoppingBag, Layers, Briefcase, FileCode, Monitor, Cpu, Terminal, LayoutDashboard, CheckSquare, 
  TrendingUp, FileText, MessageCircle, Bot, BarChart2, Trophy, LogOut, Settings, Bell
} from 'lucide-react';

const studentNav = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/student/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/student/files', icon: FileText, label: 'Submissions' },
  { to: '/student/project-files', icon: HardDrive, label: 'Project Files' },
  { to: '/student/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/student/peer-review', icon: Star, label: 'Peer Review' },
  { to: '/student/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/student/insights', icon: BarChart2, label: 'AI Insights' },
  { to: '/student/timeline', icon: Calendar, label: 'Timeline' },
  { to: '/student/scratchpad', icon: Edit3, label: 'Scratchpad' },
  { to: '/student/resource-library', icon: BookOpen, label: 'Library' },
  { to: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/student/reports', icon: BarChart2, label: 'Reports' },
  { to: '/student/market', icon: ShoppingBag, label: 'Help Market' },
  { to: '/student/docs', icon: FileCode, label: 'AI Docs' },
  { to: '/student/career', icon: Briefcase, label: 'Career' },
  { to: '/student/presentation-coach', icon: Monitor, label: 'Pres Coach' },
  { to: '/student/code-mentor', icon: Terminal, label: 'Code Mentor' },
  { to: '/student/skill-matrix', icon: Cpu, label: 'Skill Matrix' },
  { to: '/student/notifications', icon: Bell, label: 'Notifications' },
];

const professorNav = [
  { to: '/professor', icon: LayoutDashboard, label: 'My Teams', end: true },
  { to: '/professor/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/professor/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/professor/grades', icon: Star, label: 'Grades' },
  { to: '/professor/notifications', icon: Bell, label: 'Notifications' },
  { to: '/professor/files', icon: HardDrive, label: 'Project Files' },
  { to: '/professor/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/professor/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/professor/insights', icon: BarChart2, label: 'AI Insights' },
  { to: '/professor/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/professor/timeline', icon: Calendar, label: 'Timeline' },
  { to: '/professor/scratchpad', icon: Edit3, label: 'Team Notes' },
  { to: '/professor/docs', icon: FileCode, label: 'AI Docs' },
  { to: '/professor/skill-matrix', icon: Cpu, label: 'Skill Matrix' },
];

const assistantNav = [
  { to: '/assistant', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/assistant/files', icon: HardDrive, label: 'Project Files' },
  { to: '/assistant/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/assistant/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/assistant/insights', icon: BarChart2, label: 'AI Insights' },
  { to: '/assistant/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/assistant/timeline', icon: Calendar, label: 'Timeline' },
];

const adminNav = [
  { to: '/admin', icon: Shield, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/activity', icon: ClipboardList, label: 'Activity Log' },
  { to: '/admin/insights', icon: BarChart2, label: 'AI Insights' },
  { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const navByRole = { student: studentNav, professor: professorNav, assistant: assistantNav, admin: adminNav };
const colorByRole = { student: 'from-blue-600 to-blue-700', professor: 'from-purple-600 to-purple-700', assistant: 'from-emerald-600 to-emerald-700', admin: 'from-orange-600 to-orange-700' };

export default function Sidebar() {
  const { user, logout, darkMode, toggleDark, notifications, unreadChatCount } = useApp();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;
  const nav = navByRole[user.role] || [];
  const gradientColor = colorByRole[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-all duration-300 shadow-sm ${expanded ? 'w-56' : 'w-16'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-slate-100 dark:border-slate-700`}>
        <div className={`w-10 h-10 flex-shrink-0 bg-gradient-to-br ${gradientColor} rounded-xl flex items-center justify-center shadow`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {expanded && (
          <div className="animate-fade-in">
            <div className="font-bold text-sm text-slate-800 dark:text-white">UniTrack AI</div>
            <div className="text-xs text-slate-400 capitalize">{user.role}</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-none">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? `bg-gradient-to-r ${gradientColor} text-white shadow-md`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'
              }`
            }
          >
            <div className="relative flex-shrink-0">
              <Icon className="w-5 h-5" />
              {label === 'Notifications' && notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
              {label === 'Chat' && unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </div>
            {expanded && <span className="text-sm font-medium animate-fade-in whitespace-nowrap">{label}</span>}
            {!expanded && (
              <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-100 dark:border-slate-700 p-2 space-y-1">
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {expanded && <span className="text-sm font-medium animate-fade-in">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span className="text-sm font-medium animate-fade-in">Sign Out</span>}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <div className={`w-8 h-8 flex-shrink-0 bg-gradient-to-br ${gradientColor} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
            {user.name.charAt(0)}
          </div>
          {expanded && (
            <div className="animate-fade-in min-w-0">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
