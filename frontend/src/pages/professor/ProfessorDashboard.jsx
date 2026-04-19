import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { professorService } from '../../services/api';
import { Users, TrendingUp, CheckCircle2, Clock, ChevronRight, Loader2, Sparkles, AlertTriangle, Trophy, MessageSquare, Target, Calendar } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function ProfessorDashboard() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedbackTeam, setSelectedFeedbackTeam] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [teamsRes, tasksRes] = await Promise.all([
        professorService.getTeams(user.id),
        professorService.getTasks(user.id)
      ]);
      
      const mappedTeams = teamsRes.data.map(t => ({
        id: t.id,
        name: t.name,
        projectTitle: t.project_title,
        progress: t.progress,
        color: t.color,
        emoji: t.emoji,
        studentsCount: t.students?.length || 0
      }));

      setTeams(mappedTeams);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error("Failed to fetch professor dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-purple-100 text-sm mb-1">Welcome Professor</p>
        <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
        <p className="text-purple-200">You are supervising {teams.length} teams this semester.</p>
        <div className="flex gap-4 mt-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">📊 {teams.length} Active Teams</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">⭐ Rating: {user?.rating || 4.8}/5</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Students', value: teams.reduce((s, t) => s + (t.studentsCount || 0), 0), color: 'bg-purple-500', path: '/professor/teams' },
          { icon: CheckCircle2, label: 'Tasks (Supervised)', value: tasks.length, color: 'bg-emerald-500', path: '/professor/tasks' },
          { icon: Clock, label: 'Avg Progress', value: `${teams.length ? Math.round(teams.reduce((s, t) => s + t.progress, 0) / teams.length) : 0}%`, color: 'bg-amber-500', path: '/professor/analytics' },
          { icon: Sparkles, label: 'AI Health', value: teams.length > 0 ? 'Healthy' : 'N/A', color: 'bg-indigo-600', path: '/professor/analytics' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div 
              key={s.label} 
              onClick={() => navigate(s.path)}
              className="card flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl cursor-pointer hover:scale-[1.01] transition-all group" onClick={() => navigate('/professor/skill-matrix')}>
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
               <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
               <h3 className="font-bold text-lg">Team Skill Heatmap</h3>
               <p className="text-indigo-300 text-xs font-medium">Analyze expertise balance across all supervised teams.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines Widget */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Upcoming Deadlines
            </h3>
            <span className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-bold px-2 py-1 rounded">Next 7 Days</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] scrollbar-none">
            {tasks.length > 0 ? (
               tasks.slice(0, 5).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((task, idx) => {
                  const team = teams.find(t => t.id === task.team_id);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className={`w-2 h-10 rounded-full ${task.color || 'bg-slate-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 truncate">{team?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{task.deadline}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  );
               })
            ) : (
               <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Clock className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No upcoming deadlines</p>
               </div>
            )}
          </div>
        </div>

        {/* Student Progress Radar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Cohort Competency Radar
            </h3>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                { subject: 'Frontend', A: 0, B: 0, fullMark: 100 },
                { subject: 'Backend', A: 0, B: 0, fullMark: 100 },
                { subject: 'UI/UX', A: 0, B: 0, fullMark: 100 },
                { subject: 'AI/ML', A: 0, B: 0, fullMark: 100 },
                { subject: 'DevOps', A: 0, B: 0, fullMark: 100 },
                { subject: 'Testing', A: 0, B: 0, fullMark: 100 },
              ]}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Alpha Devs" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                <Radar name="Beta Coders" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Assigned Teams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map(team => (
            <div key={team.id} className="card hover:shadow-card-hover transition-all group relative flex flex-col">
              {team.progress >= 90 && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                  <Trophy className="w-3 h-3" /> Top Team
                </div>
              )}
              {team.progress < 30 && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                  <AlertTriangle className="w-3 h-3" /> At Risk
                </div>
              )}
              
              <Link to={`/professor/team/${team.id}`} className="block flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: team.color + '20' }}>
                    {team.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{team.name}</p>
                    <p className="text-xs text-slate-400 truncate">{team.projectTitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{team.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${team.progress}%`, background: team.color }} />
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700 mt-2">
                <span className="text-xs text-slate-400">{team.studentsCount} Students</span>
                <button 
                  onClick={(e) => { e.preventDefault(); setSelectedFeedbackTeam(team); setFeedbackModalOpen(true); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" /> Quick Feedback
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setFeedbackModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                Provide Quick Feedback to {selectedFeedbackTeam?.name}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Message</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 dark:text-white"
                placeholder="Write your constructive feedback or instructions here..."
              ></textarea>
              <div className="flex justify-end gap-3">
                <button onClick={() => setFeedbackModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={() => { alert('Feedback sent successfully!'); setFeedbackModalOpen(false); }} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                  Send Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
