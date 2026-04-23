import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { assistantService } from '../../services/api';
import { CheckCircle2, Clock, AlertTriangle, ChevronRight, ThumbsUp, Loader2 } from 'lucide-react';

export default function AssistantDashboard() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const res = await assistantService.getTeams(user.id);
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to fetch assistant teams", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
        <p className="text-emerald-200">Supervising {teams.length} teams · {teams.reduce((s,t) => s + (t.students?.length || 0), 0)} students</p>
        <div className="flex gap-4 mt-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">📋 Active Monitoring</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">✅ Full Access</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Teams', value: teams.length, color: 'bg-emerald-500', icon: CheckCircle2 },
          { label: 'Students', value: teams.reduce((s,t) => s + (t.students?.length || 0), 0), color: 'bg-amber-500', icon: Clock },
          { label: 'Avg Progress', value: `${Math.round(teams.reduce((s,t) => s + t.progress, 0) / (teams.length || 1))}%`, color: 'bg-blue-500', icon: ThumbsUp },
          { label: 'Admin Status', value: 'Active', color: 'bg-red-400', icon: AlertTriangle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
              <div><p className="text-xl font-bold text-slate-800 dark:text-white">{s.value}</p><p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p></div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">My Supervised Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map(team => (
            <Link key={team.id} to={`/assistant/team/${team.id}`} className="card hover:shadow-card-hover transition-all group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: team.color + '20' }}>{team.emoji}</div>
                <div className="flex-1"><p className="font-bold text-slate-800 dark:text-white">{team.name}</p><p className="text-xs text-slate-400">{team.project_title}</p></div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1"><span className="text-xs text-slate-500">Progress</span><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{team.progress}%</span></div>
                <div className="progress-bar"><div className="h-full rounded-full transition-all" style={{ width: `${team.progress}%`, background: team.color }} /></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.students?.slice(0,4).map(s => (
                    <div key={s.id} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold" style={{ background: team.color }}>{s.name.charAt(0)}</div>
                  ))}
                </div>
                <span className="text-xs text-slate-400">{team.students?.length || 0} students</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
