import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { professorService } from '../../services/api';
import {
  Bell, CheckCircle, Clock, TrendingUp, Users, Star, AlertCircle,
  MessageSquare, FileText, Loader2, Trash2, Check, Filter, RefreshCw
} from 'lucide-react';

function timeAgo(isoTime) {
  const diff = (new Date() - new Date(isoTime)) / 1000;
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

const NOTIF_TYPES = {
  task_completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'مهمة مكتملة' },
  task_submitted: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'تسليم مهمة' },
  message: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'رسالة جديدة' },
  progress: { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'تحديث تقدم' },
  request: { icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'طلب انضمام' },
  warning: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'تحذير' },
  rating: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'تقييم' },
};

function generateMockNotifications(teams) {
  const notifs = [];
  const now = new Date();
  const makeTime = (minsAgo) => new Date(now - minsAgo * 60 * 1000).toISOString();

  notifs.push(
    { id: 'n1', type: 'task_completed', title: 'مهمة مكتملة', body: 'قام أحمد محمد بإكمال مهمة "تصميم واجهة المستخدم"', team: teams[0]?.name || 'فريق AI', time: makeTime(5), read: false },
    { id: 'n2', type: 'task_submitted', title: 'تسليم جديد', body: 'تم تسليم مهمة "قاعدة البيانات" من فريقك', team: teams[0]?.name || 'فريق AI', time: makeTime(20), read: false },
    { id: 'n3', type: 'progress', title: 'تحديث التقدم', body: `تجاوز ${teams[1]?.name || 'الفريق الثاني'} نسبة 75% من المشروع`, team: teams[1]?.name || 'فريق ML', time: makeTime(45), read: false },
    { id: 'n4', type: 'message', title: 'رسالة جديدة', body: 'سارة خالد: "هل يمكن تمديد موعد التسليم؟"', team: teams[0]?.name || 'فريق AI', time: makeTime(60), read: true },
    { id: 'n5', type: 'request', title: 'طلب انضمام', body: 'طالب جديد يطلب الانضمام إلى الفريق', team: teams[2]?.name || 'فريق Web', time: makeTime(120), read: true },
    { id: 'n6', type: 'warning', title: 'تحذير متأخر', body: 'مهمة "الاختبارات" لم تُسلَّم في موعدها', team: teams[1]?.name || 'فريق ML', time: makeTime(180), read: false },
    { id: 'n7', type: 'task_completed', title: 'مهمة مكتملة', body: 'تم إكمال مهمة "إعداد الخادم" بنجاح', team: teams[2]?.name || 'فريق Web', time: makeTime(240), read: true },
    { id: 'n8', type: 'rating', title: 'تقييم طالب', body: 'تمت مراجعة تقييمك لمحمود علي بنجاح', team: teams[0]?.name || 'فريق AI', time: makeTime(300), read: true },
  );
  return notifs;
}

export default function ProfessorNotifications() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      professorService.getTeams(user.id)
        .then(res => {
          const t = res.data || [];
          setTeams(t);
          setNotifications(generateMockNotifications(t));
        })
        .catch(() => setNotifications(generateMockNotifications([])))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setNotifications(generateMockNotifications(teams));
    setRefreshing(false);
  };

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAll = () => {
    if (window.confirm('حذف كل الإشعارات؟')) setNotifications([]);
  };

  const filterTypes = ['all', 'unread', 'task_completed', 'task_submitted', 'message', 'progress', 'request', 'warning'];
  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-500" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{notifications.length} إشعار · {unreadCount} غير مقروء</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 transition-colors">
              <Check className="w-4 h-4" /> قراءة الكل
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> حذف الكل
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'مهام مكتملة', count: notifications.filter(n => n.type === 'task_completed').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'تسليمات', count: notifications.filter(n => n.type === 'task_submitted').length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'رسائل', count: notifications.filter(n => n.type === 'message').length, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'تحذيرات', count: notifications.filter(n => n.type === 'warning').length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{stat.label}</span>
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {filterTypes.map(f => {
          const cfg = f === 'all' ? null : f === 'unread' ? null : NOTIF_TYPES[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'الكل' : f === 'unread' ? `غير مقروء (${unreadCount})` : cfg?.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
          <p className="text-slate-400 font-medium">لا يوجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const cfg = NOTIF_TYPES[notif.type] || NOTIF_TYPES.progress;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-sm ${
                  !notif.read
                    ? 'bg-white dark:bg-slate-800 border-purple-100 dark:border-purple-900/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{notif.title}</p>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{notif.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(notif.time)}
                    </span>
                    {notif.team && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">
                        {notif.team}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
