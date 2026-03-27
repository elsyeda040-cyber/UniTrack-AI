import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Star, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PROGRESS_HISTORY = [
  { week: 'W1', progress: 10 }, { week: 'W2', progress: 22 }, { week: 'W3', progress: 38 },
  { week: 'W4', progress: 50 }, { week: 'W5', progress: 60 }, { week: 'W6', progress: 68 },
];

const MOCK_TASKS = [
  { id: 101, title: 'Draft Research Proposal', status: 'completed', deadline: '2026-03-15' },
  { id: 102, title: 'System Architecture Design', status: 'in_progress', deadline: '2026-04-05' },
  { id: 103, title: 'Frontend UI Implementation', status: 'in_progress', deadline: '2026-04-10' },
  { id: 104, title: 'Backend API Integration', status: 'todo', deadline: '2026-04-20' },
];

const statusConfig = {
  completed: { label: 'Completed', color: 'badge-green', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  in_progress: { label: 'In Progress', color: 'badge-yellow', icon: Clock, iconColor: 'text-amber-500' },
  todo: { label: 'To Do', color: 'badge', icon: AlertCircle, iconColor: 'text-slate-400' },
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4 hover:shadow-card-hover transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  </div>
);

export default function StudentDashboard() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const res = await teamService.getTasks(user.teamId);
      if (res.data && res.data.length > 0) {
        setTasks(res.data);
      } else {
        setTasks(MOCK_TASKS); // fallback to mock data for presentation
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setTasks(MOCK_TASKS); // fallback to mock data for presentation
    } finally {
      setLoading(false);
    }
  };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex items-center justify-between">
        <div className="flex-1">
          <p className="text-blue-100 text-sm mb-1">Welcome back 👋</p>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-blue-200 mt-1 opacity-90">Academic Progress Tracker</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">🏅 Rank #{user?.rank || 1} in Team</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">⭐ Score: {user?.score || 0}/100</span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 text-right">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-10 h-10" />
          </div>
          <p className="text-sm text-blue-200">Current Progress</p>
          <p className="text-3xl font-bold">{Math.round((completed / (tasks.length || 1)) * 100)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Completed Tasks" value={completed} sub={`of ${tasks.length} total`} color="bg-emerald-500" />
        <StatCard icon={Clock} label="In Progress" value={inProgress} color="bg-amber-500" />
        <StatCard icon={AlertCircle} label="To Do" value={todo} color="bg-slate-400" />
        <StatCard icon={Star} label="My Score" value={`${user?.score || 0}/100`} sub="By professor" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Project Velocity</h3>
            <span className="badge badge-blue">Weekly View</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={PROGRESS_HISTORY}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorProgress)" name="Progress %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Your Team</h3>
          </div>
          <div className="space-y-4">
             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Active Team</p>
                <p className="text-lg font-bold text-slate-700 dark:text-white">{user?.teamId || 'T1042 - Alpha Team'}</p>
             </div>
             <p className="text-xs text-slate-400 text-center px-4">Visit the team page to see detailed rankings and group activities.</p>
             <button onClick={() => alert('Viewing team details...')} className="w-full btn-primary py-2 text-sm mt-2">View Team Workspace</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Upcoming Tasks</h3>
          <Link to="/student/tasks" className="text-blue-600 hover:underline text-sm flex items-center gap-1">View board <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="space-y-3">
          {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => {
            const cfg = statusConfig[task.status];
            const Icon = cfg.icon;
            return (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{task.title}</p>
                  <p className="text-xs text-slate-400">Deadline: {task.deadline}</p>
                </div>
                <span className={`badge ${cfg.color} text-xs`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
