import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const roleBadge = {
  student: { label: 'Student Portal', color: 'from-blue-500 to-blue-600' },
  professor: { label: 'Professor Portal', color: 'from-purple-500 to-purple-600' },
  assistant: { label: 'Supervisor Portal', color: 'from-emerald-500 to-emerald-600' },
  admin: { label: 'Admin Portal', color: 'from-orange-500 to-orange-600' },
};

export default function Topbar({ title }) {
  const { user, notifications } = useApp();
  if (!user) return null;
  const badge = roleBadge[user.role];

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h1>
        {badge && (
          <span className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, docs..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 w-48 dark:text-white dark:placeholder-slate-400"
            onChange={(e) => {
              if (e.target.value.length > 2) {
                // Search logic here
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && alert('No results found for "' + e.target.value + '"')}
          />
        </div>
        <Link to={`/${user.role}/notifications`} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
          <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          {notifications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
              {notifications > 99 ? '99+' : notifications}
            </span>
          )}
        </Link>
        <Link to={`/${user.role}/profile`} className="flex items-center gap-2 ml-2 hover:opacity-80 transition-opacity">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${badge.color} overflow-hidden shadow-inner`}>
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none mb-1">{user.name}</div>
            <div className="text-[10px] text-slate-400 capitalize bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md w-fit">
              {user.role}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
