import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professorService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Users, CheckCircle2, AlertTriangle, FileDown, Loader2 } from 'lucide-react';

export default function ProfessorAnalytics() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [analyticsRes, teamsRes] = await Promise.all([
        professorService.getAnalytics(user.id),
        professorService.getTeams(user.id)
      ]);
      setAnalytics(analyticsRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await professorService.exportGlobalReport(user.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `professor_report_${user.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  if (!analytics) return (
    <div className="card text-center p-12 animate-fade-in">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold dark:text-white">Failed to Load Analytics</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2">The analytics service is currently unavailable. Please try again later.</p>
      <button onClick={fetchData} className="btn-secondary mt-6">Retry Connection</button>
    </div>
  );
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Teams Analytics</h2>
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary text-sm flex items-center gap-2"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Export CSV Report
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            icon: Users, 
            label: 'Total Students', 
            value: analytics.total_students, 
            color: 'bg-purple-500',
            onClick: () => navigate('/professor/teams')
          },
          { 
            icon: CheckCircle2, 
            label: 'Avg Progress', 
            value: `${Math.round(analytics.avg_progress)}%`, 
            color: 'bg-emerald-500',
            onClick: () => {
              const el = document.getElementById('charts-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          },
          { 
            icon: TrendingUp, 
            label: 'Best Team', 
            value: analytics.best_team_name.split(' ')[0], 
            color: 'bg-blue-500',
            onClick: () => navigate(`/professor/team/${analytics.best_team_id}`)
          },
          { 
            icon: AlertTriangle, 
            label: 'Needs Attention', 
            value: analytics.needs_attention_count, 
            color: 'bg-amber-500',
            onClick: () => navigate('/professor/grades')
          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div 
              key={s.label} 
              onClick={s.onClick}
              className="card flex items-center gap-3 cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform`}><Icon className="w-5 h-5 text-white" /></div>
              <div><p className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{s.value}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p></div>
            </div>
          );
        })}
      </div>

      <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Progress Bar */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Team Progress Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.team_progress_comparison} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="progress" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Progress Line */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Overall Progress Timeline</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.overall_progress_timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} name="Progress %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Teams Detail Table */}
      <div className="card">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Teams Detail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="pb-3 font-semibold">Team</th>
              <th className="pb-3 font-semibold">Project</th>
              <th className="pb-3 font-semibold">Students</th>
              <th className="pb-3 font-semibold">Progress</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {teams.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => navigate(`/professor/team/${t.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                >
                  <td className="py-3 font-semibold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 transition-colors">{t.emoji} {t.name}</td>
                  <td className="py-3 text-slate-500 dark:text-slate-400">{t.project_title}</td>
                  <td className="py-3 text-slate-700 dark:text-slate-200">{t.students?.length || 0}</td>
                  <td className="py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 progress-bar"><div className="progress-fill" style={{ width: `${t.progress}%`, background: t.color }} /></div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`badge text-xs ${t.progress >= 70 ? 'badge-green' : t.progress >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                      {t.progress >= 70 ? 'On Track' : t.progress >= 50 ? 'Moderate' : 'Needs Help'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
