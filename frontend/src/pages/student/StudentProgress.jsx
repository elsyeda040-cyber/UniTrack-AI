import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { Loader2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#94a3b8'];

export default function StudentProgress() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchProgress = async () => {
    try {
      const res = await teamService.getTasks(user.teamId);
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch progress", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  const pieData = tasks.length > 0 ? [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'To Do', value: todo },
  ] : [
    { name: 'Empty', value: 1 }
  ];

  const taskScores = tasks.filter(t => t.score).map(t => ({ name: t.title.split(' ').slice(0, 2).join(' '), score: t.score }));

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Progress */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Weekly Progress Timeline</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[]}>
              <defs>
                <linearGradient id="prog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Area type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={3} fill="url(#prog)" name="Progress %" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-center py-4 text-slate-400 text-xs">No historical data available for launch</div>
        </div>

        {/* Task Distribution */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Task Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={tasks.length > 0 ? COLORS[i] : '#e2e8f0'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {tasks.length > 0 ? pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{item.name}</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{item.value}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic">No tasks assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Scores */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Task Scores</h3>
        {taskScores.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskScores} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">No scored tasks available.</div>
        )}
      </div>

      {/* Task Status List */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">All Task Progress</h3>
        <div className="space-y-4">
          {tasks.length > 0 ? tasks.map(task => (
            <div key={task.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                <div className="flex items-center gap-2">
                  {task.score && <span className="text-sm font-bold text-emerald-600">{task.score}/100</span>}
                  <span className={`badge ${task.status === 'completed' ? 'badge-green' : task.status === 'in_progress' ? 'badge-yellow' : 'bg-slate-100 text-slate-500'} text-xs`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : '0%' }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Due: {task.deadline}</p>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-400 text-sm italic">No tasks assigned to the team.</div>
          )}
        </div>
      </div>
    </div>
  );
}
