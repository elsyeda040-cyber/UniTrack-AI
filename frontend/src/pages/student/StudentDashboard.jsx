import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Star, Trophy, ArrowRight, Loader2, FileText, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RiskSimulator from './RiskSimulator';

const PROGRESS_HISTORY = [
  { week: 'W1', progress: 0 }, { week: 'W2', progress: 0 }, { week: 'W3', progress: 0 },
  { week: 'W4', progress: 0 }, { week: 'W5', progress: 0 }, { week: 'W6', progress: 0 },
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
  const { user, hackathonMode } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      const res = await teamService.getTasks(user.teamId);
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const progressPercent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

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
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">🏅 Rank #{user?.rank || '—'} in Team</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">⭐ Score: {user?.score || 0}/100</span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 text-right">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-10 h-10" />
          </div>
          <p className="text-sm text-blue-200">Current Progress</p>
          <p className="text-3xl font-bold">{progressPercent}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={async () => {
            try {
              const res = await teamService.exportReport(user.teamId);
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `report_${user.teamId}.pdf`);
              document.body.appendChild(link);
              link.click();
            } catch (err) { alert("Failed to export report"); }
          }}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-red-500" /> Export PDF Report
        </button>
        <a 
          href={teamService.getCalendarSyncUrl(user.teamId)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-blue-500" /> Sync to Calendar (.ics)
        </a>
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
                 <p className="text-lg font-bold text-slate-700 dark:text-white">{user?.teamId || 'No Team Assigned'}</p>
              </div>
              
              <RiskSimulator />

              <Link to="/student/chat" className="w-full btn-primary py-2 text-sm mt-2 block text-center">Open Team Chat</Link>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="card bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
             <h4 className="font-bold mb-1">Platform Launched! 🚀</h4>
             <p className="text-[11px] opacity-80 leading-relaxed">Welcome to UniTrack AI. Start collaborating with your team now.</p>
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
