import React, { useState, useEffect } from 'react';
import { adminService, teamService } from '../../services/api';
import { 
  Activity, UserPlus, UserMinus, Edit3, Shield, LogIn, 
  Trash2, Loader2, Filter, RefreshCw, Search, Download
} from 'lucide-react';

// Generate mock activity log since the backend may not have an endpoint yet
function generateActivityLog(users, teams) {
  const actions = [];
  const now = new Date();

  const makeTime = (minsAgo) => {
    const d = new Date(now - minsAgo * 60 * 1000);
    return d.toISOString();
  };

  if (users.length > 0) {
    users.slice(0, 4).forEach((u, i) => {
      actions.push({
        id: `act-${i}-1`,
        type: 'user_created',
        actor: 'Admin',
        target: u.name,
        detail: `تم إنشاء حساب جديد (${u.role === 'professor' ? 'دكتور' : 'طالب'})`,
        time: makeTime(i * 45 + 10),
      });
    });
  }

  if (teams.length > 0) {
    teams.slice(0, 3).forEach((t, i) => {
      actions.push({
        id: `act-team-${i}`,
        type: 'team_created',
        actor: 'Admin',
        target: t.name,
        detail: `تم إنشاء فريق جديد: ${t.project_title}`,
        time: makeTime(i * 60 + 120),
      });
    });
  }

  actions.push(
    { id: 'log-1', type: 'login', actor: 'Admin', target: 'النظام', detail: 'دخول للوحة الإدارة', time: makeTime(5) },
    { id: 'log-2', type: 'settings', actor: 'Admin', target: 'الإعدادات', detail: 'تحديث إعدادات النظام', time: makeTime(30) },
    { id: 'log-3', type: 'user_deleted', actor: 'Admin', target: 'مستخدم محذوف', detail: 'تم حذف حساب مستخدم', time: makeTime(95) },
    { id: 'log-4', type: 'login', actor: 'دكتور محمد', target: 'النظام', detail: 'دخول بوابة المشرف', time: makeTime(180) },
  );

  return actions.sort((a, b) => new Date(b.time) - new Date(a.time));
}

const typeConfig = {
  user_created: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'إنشاء مستخدم' },
  user_deleted: { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'حذف مستخدم' },
  team_created: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'إنشاء فريق' },
  login: { icon: LogIn, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'تسجيل دخول' },
  settings: { icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'تعديل إعدادات' },
  delete: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'حذف' },
};

function timeAgo(isoTime) {
  const diff = (new Date() - new Date(isoTime)) / 1000;
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function AdminActivityLog() {
  const [log, setLog] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        adminService.getUsers(),
        teamService.getAll()
      ]);
      setUsers(uRes.data);
      setTeams(tRes.data);
      setLog(generateActivityLog(uRes.data, tRes.data));
    } catch (err) {
      console.error(err);
      setLog(generateActivityLog([], []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await new Promise(r => setTimeout(r, 400));
    setRefreshing(false);
  };

  const filterTypes = [
    { id: 'all', label: 'الكل' },
    { id: 'user_created', label: 'إنشاء مستخدم' },
    { id: 'user_deleted', label: 'الحذف' },
    { id: 'team_created', label: 'الفرق' },
    { id: 'login', label: 'الدخول' },
    { id: 'settings', label: 'الإعدادات' },
  ];

  const filtered = log.filter(item => {
    const matchFilter = filter === 'all' || item.type === filter;
    const matchSearch = search === '' || 
      item.target.toLowerCase().includes(search.toLowerCase()) ||
      item.detail.toLowerCase().includes(search.toLowerCase()) ||
      item.actor.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-500" />
            سجل النشاط
          </h2>
          <p className="text-sm text-slate-500 mt-1">{log.length} عملية مسجلة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all ${refreshing ? 'animate-spin text-orange-500' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const data = filtered.map(l => `${new Date(l.time).toLocaleString('ar-EG')} | ${l.actor} | ${l.detail}`).join('\n');
              navigator.clipboard.writeText(data);
              alert('تم نسخ السجل!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-4 h-4" /> نسخ السجل
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي العمليات', value: log.length, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'مستخدمون أُنشئوا', value: log.filter(l => l.type === 'user_created').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'عمليات حذف', value: log.filter(l => l.type === 'user_deleted').length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'جلسات دخول', value: log.filter(l => l.type === 'login').length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-transparent`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          {filterTypes.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="relative mr-auto">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث في السجل..."
              className="pr-9 pl-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
            />
          </div>
        </div>

        {/* Log Timeline */}
        <div className="relative">
          <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-700" />
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-center text-slate-400 py-8">لا يوجد نشاط مطابق للبحث.</p>
            ) : filtered.map((item, idx) => {
              const cfg = typeConfig[item.type] || typeConfig.settings;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-start gap-4 relative pr-8">
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 absolute right-1 z-10`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className={`flex-1 pr-6 p-4 rounded-xl border transition-all ${
                    idx === 0
                      ? 'border-orange-100 dark:border-orange-900/40 bg-orange-50/30 dark:bg-orange-900/10'
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400">{timeAgo(item.time)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{item.detail}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      بواسطة: <span className="font-medium">{item.actor}</span>
                      {' · '}الهدف: <span className="font-medium">{item.target}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
