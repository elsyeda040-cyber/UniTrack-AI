import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { professorService, teamService } from '../../services/api';
import {
  Plus, CheckCircle2, Circle, Clock, Trash2, Edit3, Calendar,
  Users, Loader2, X, Save, ChevronDown, ChevronUp, AlertCircle, Filter
} from 'lucide-react';

const STATUS_CONFIG = {
  todo: { label: 'لم تبدأ', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700', icon: Circle },
  in_progress: { label: 'قيد التنفيذ', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  completed: { label: 'مكتملة', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  high: { label: 'عالي', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40' },
  medium: { label: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40' },
  low: { label: 'منخفض', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700' },
};

export default function ProfessorTasks() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [saving, setSaving] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    status: 'todo',
  });

  useEffect(() => {
    if (user?.id) fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    try {
      const res = await professorService.getTeams(user.id);
      setTeams(res.data);
      if (res.data.length > 0) {
        setSelectedTeam(res.data[0]);
        await fetchTasks(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (teamId) => {
    try {
      const res = await teamService.getTasks(teamId);
      setTasks(res.data);
    } catch (err) {
      setTasks([]);
    }
  };

  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    await fetchTasks(team.id);
    setLoading(false);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setSaving(true);
    try {
      // Optimistic update with mock task
      const mockTask = {
        id: `mock-${Date.now()}`,
        ...newTask,
        team_id: selectedTeam.id,
        created_at: new Date().toISOString(),
      };
      setTasks(prev => [mockTask, ...prev]);
      setShowModal(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'medium', status: 'todo' });
    } catch (err) {
      alert('فشل إنشاء المهمة. حاول مجدداً.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('هل تريد حذف هذه المهمة؟')) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة المهام</h2>
          <p className="text-sm text-slate-500 mt-1">إنشاء وتتبع مهام الفرق</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!selectedTeam}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> مهمة جديدة
        </button>
      </div>

      {/* Team Selector */}
      <div className="flex gap-3 flex-wrap">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => handleSelectTeam(team)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              selectedTeam?.id === team.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
            }`}
          >
            <span>{team.emoji || '🚀'}</span>
            {team.name}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`${cfg.bg} rounded-2xl p-4 border border-transparent cursor-pointer transition-all hover:shadow-sm ${filterStatus === key ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${cfg.color}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cfg.label}</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{statusCounts[key]}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex gap-2">
          {['all', 'todo', 'in_progress', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'الكل' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mr-auto">
          {['all', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterPriority === p
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p === 'all' ? 'كل الأولويات' : PRIORITY_CONFIG[p]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {!selectedTeam ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>اختر فريقاً لعرض مهامه</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
          <p className="text-slate-400 font-medium">لا توجد مهام مطابقة</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-purple-600 font-semibold hover:underline">
            + أضف أول مهمة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const statusCfg = STATUS_CONFIG[task.status || 'todo'];
            const priorityCfg = PRIORITY_CONFIG[task.priority || 'medium'];
            const StatusIcon = statusCfg.icon;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${priorityCfg.bg} p-5 hover:shadow-sm transition-all group`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleUpdateStatus(task.id, task.status === 'completed' ? 'todo' : task.status === 'in_progress' ? 'completed' : 'in_progress')}
                    className={`mt-0.5 flex-shrink-0 ${statusCfg.color} hover:scale-110 transition-transform`}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold text-slate-800 dark:text-white ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${priorityCfg.bg} ${priorityCfg.color}`}>
                        {priorityCfg.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> متأخر
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {task.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-md ${statusCfg.bg} ${statusCfg.color} font-semibold`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={task.status || 'todo'}
                      onChange={e => handleUpdateStatus(task.id, e.target.value)}
                      className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      <option value="todo">لم تبدأ</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="completed">مكتملة</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" /> مهمة جديدة
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">عنوان المهمة *</label>
                <input
                  required
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="مثال: تصميم واجهة المستخدم"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الوصف</label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  placeholder="تفاصيل إضافية عن المهمة..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ التسليم</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الأولوية</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="high">🔴 عالي</option>
                    <option value="medium">🟡 متوسط</option>
                    <option value="low">⚪ منخفض</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
