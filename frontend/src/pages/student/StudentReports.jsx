import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FileDown, TrendingUp, Loader2 } from 'lucide-react';

export default function StudentReports() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.teamId) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const res = await teamService.getTasks(user.teamId);
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks for report', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await teamService.exportReport(user.teamId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${user.teamId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const completed = tasks.filter(t => t.status === 'completed');
  const progressPercent = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, t) => s + (t.score || 0), 0) / completed.length)
    : 0;

  // Build a simple week-by-week chart from task completion
  const weeklyData = Array.from({ length: 6 }, (_, i) => ({
    week: `W${i + 1}`,
    progress: i < Math.ceil(progressPercent / 20) ? Math.min((i + 1) * (progressPercent / 6), 100) : 0,
  }));

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Project Performance Report</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.teamId ? `Active Team: ${user.teamId}` : 'No team assigned yet'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !user?.teamId}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'text-blue-600' },
          { label: 'Completed', value: completed.length, color: 'text-emerald-600' },
          { label: 'Avg Score', value: `${avgScore}/100`, color: 'text-purple-600' },
          { label: 'Overall Progress', value: `${progressPercent}%`, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" /> Weekly Progress
        </h3>
        {tasks.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400">
            <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No task data yet. Progress will appear as tasks are completed.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={32}>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="progress" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Progress %" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Task Table */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Task Summary</h3>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No tasks have been assigned to your team yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3 font-semibold">Task</th>
                  <th className="pb-3 font-semibold">Deadline</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 font-medium text-slate-700 dark:text-slate-200">{t.title}</td>
                    <td className="py-3 text-slate-400">{t.deadline || '—'}</td>
                    <td className="py-3">
                      <span className={`badge text-xs ${
                        t.status === 'completed' ? 'badge-green'
                        : t.status === 'in_progress' ? 'badge-yellow'
                        : 'bg-slate-100 text-slate-500'
                      }`}>
                        {(t.status || 'todo').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-200">
                      {t.score != null ? `${t.score}/100` : '—'}
                    </td>
                    <td className="py-3 text-slate-400 text-xs max-w-xs truncate">
                      {t.feedback || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
