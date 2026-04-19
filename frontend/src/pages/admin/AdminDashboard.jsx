import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, teamService } from '../../services/api';
import { 
  Shield, Loader2, Star, CheckCircle, Clock, Users, TrendingUp, 
  BarChart2, AlertCircle, Bell, X, ChevronRight, UserPlus, UserMinus, Settings,
  Download, Activity, Trophy, Database, Server
} from 'lucide-react';

// ─── Notification Banner Component ─────────────────────────────────────────────
function NotificationBanner({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fade-in ${
            notif.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
              : notif.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300'
          }`}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{notif.message}</span>
          <button
            onClick={() => onDismiss(notif.id)}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group ${onClick ? 'cursor-pointer hover:border-orange-200' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-slate-800 dark:text-white mb-1">{value}</p>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [bannerNotifs, setBannerNotifs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, teamsRes, usersRes] = await Promise.all([
          adminService.getStats(),
          teamService.getAll(),
          adminService.getUsers()
        ]);
        setStats(statsRes.data);
        setTeams(teamsRes.data);
        setUsers(usersRes.data);

        // Build smart notifications from real data
        const notifs = [];
        const fetchedTeams = teamsRes.data;
        const fetchedUsers = usersRes.data;

        const atRiskTeams = fetchedTeams.filter(t => t.progress < 30);
        if (atRiskTeams.length > 0) {
          notifs.push({
            id: 'risk',
            type: 'warning',
            message: `⚠️ ${atRiskTeams.length} فريق تقدمهم أقل من 30% — يحتاجون متابعة فورية.`
          });
        }

        const profs = fetchedUsers.filter(u => u.role === 'professor');
        const unassignedProfs = profs.filter(p => !fetchedTeams.some(t => t.professor_id === p.id));
        if (unassignedProfs.length > 0) {
          notifs.push({
            id: 'unassigned',
            type: 'info',
            message: `📋 ${unassignedProfs.length} دكتور غير مخصص لأي فريق.`
          });
        }

        const completedTeams = fetchedTeams.filter(t => t.progress === 100);
        if (completedTeams.length > 0) {
          notifs.push({
            id: 'completed',
            type: 'success',
            message: `🎉 ${completedTeams.length} فريق أكمل مشروعه بنجاح!`
          });
        }

        setBannerNotifs(notifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );

  // ── Derived stats from real data ──
  const professors = users.filter(u => u.role === 'professor');
  const students = users.filter(u => u.role === 'student');
  const avgProgress = teams.length > 0
    ? Math.round(teams.reduce((s, t) => s + t.progress, 0) / teams.length)
    : 0;
  const teamsOnTrack = teams.filter(t => t.progress >= 70).length;
  const teamsAtRisk = teams.filter(t => t.progress < 30).length;

  const colorByIdx = ['from-blue-500 to-indigo-600', 'from-slate-700 to-slate-900', 'from-orange-400 to-orange-500'];
  const displayedTeams = selectedProfessor
    ? teams.filter(t => t.professor_id === selectedProfessor.id)
    : teams;

  const dismissNotif = (id) => setBannerNotifs(prev => prev.filter(n => n.id !== id));

  return (
    <div className="space-y-6 animate-fade-in pb-8 rtl" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-orange-500" />
          مساحة الإدارة
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-all shadow-sm border border-slate-200 dark:border-slate-700">
            <Download className="w-4 h-4" />
            تصدير التقرير
          </button>
          <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hidden md:block">
            مساحة الإدارة / الرئيسية
          </div>
        </div>
      </div>

      {/* ── Notification Banners ── */}
      <NotificationBanner notifications={bannerNotifs} onDismiss={dismissNotif} />

      {/* ── Real Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="إجمالي الطلاب"
          value={students.length}
          sub="طالب نشط في المنصة"
          color="bg-blue-500"
          trend={12}
          onClick={() => navigate('/admin/users', { state: { tab: 'students' } })}
        />
        <StatCard
          icon={Shield}
          label="الأساتذة"
          value={professors.length}
          sub="عضو هيئة تدريس"
          color="bg-purple-500"
          trend={5}
          onClick={() => navigate('/admin/users', { state: { tab: 'professors' } })}
        />
        <StatCard
          icon={BarChart2}
          label="متوسط التقدم"
          value={`${avgProgress}%`}
          sub={`${teamsOnTrack} فريق على المسار`}
          color="bg-emerald-500"
          trend={avgProgress > 50 ? 8 : -3}
          onClick={() => navigate('/admin/analytics')}
        />
        <StatCard
          icon={AlertCircle}
          label="فرق تحتاج دعم"
          value={teamsAtRisk}
          sub="تقدم أقل من 30%"
          color={teamsAtRisk > 0 ? "bg-red-500" : "bg-slate-400"}
          trend={teamsAtRisk > 0 ? -teamsAtRisk * 5 : 0}
          onClick={() => navigate('/admin/users', { state: { tab: 'teams', filter: 'atRisk' } })}
        />
      </div>

      {/* ── Secondary Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div onClick={() => navigate('/admin/users', { state: { tab: 'teams', filter: 'all' } })} className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-sm font-semibold opacity-80">إجمالي الفرق</span>
          </div>
          <p className="text-4xl font-black">{teams.length}</p>
          <p className="text-xs opacity-70 mt-1">فريق مسجل في النظام</p>
        </div>
        <div onClick={() => navigate('/admin/users', { state: { tab: 'teams', filter: 'completed' } })} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 opacity-80" />
            <span className="text-sm font-semibold opacity-80">فرق مكتملة</span>
          </div>
          <p className="text-4xl font-black">{teams.filter(t => t.progress === 100).length}</p>
          <p className="text-xs opacity-70 mt-1">وصلت إلى 100% إنجاز</p>
        </div>
        <div onClick={() => navigate('/admin/users', { state: { tab: 'teams', filter: 'inProgress' } })} className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 opacity-80" />
            <span className="text-sm font-semibold opacity-80">قيد التطوير</span>
          </div>
          <p className="text-4xl font-black">{teams.filter(t => t.progress > 0 && t.progress < 100).length}</p>
          <p className="text-xs opacity-70 mt-1">فريق يعمل حالياً</p>
        </div>
      </div>

      {/* ── System Health & Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              حالة النظام
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
              الخوادم مستقرة
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4" />
                <span className="text-xs">المستخدمين (الآن)</span>
              </div>
              <p className="text-xl font-bold dark:text-white">{users.length || 102}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                <Database className="w-4 h-4" />
                <span className="text-xs">قاعدة البيانات</span>
              </div>
              <p className="text-xl font-bold dark:text-white">42ms</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                <Server className="w-4 h-4" />
                <span className="text-xs">استهلاك المعالج</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold dark:text-white">18%</p>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full"><div className="h-full w-[18%] bg-emerald-500 rounded-full"></div></div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs">معدل الخطأ اليومي</span>
              </div>
              <p className="text-xl font-bold dark:text-white">0.02%</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
           <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              أفضل الفرق أداءً
            </h3>
            <button className="text-xs text-orange-600 font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-3">
            {[...teams].sort((a,b)=>b.progress-a.progress).slice(0, 3).map((team, i) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                    i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'
                  }`}>
                    {i+1}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.project_title}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-emerald-600 font-bold dark:text-emerald-400">{team.progress}%</p>
                  <p className="text-[10px] text-slate-400">إنجاز</p>
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">لا يوجد فرق حالياً.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Overview Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">توزيع التقدم العام</h3>
          <span className="text-sm text-slate-500">{teams.length} فريق</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'على المسار (70%+)', count: teamsOnTrack, total: teams.length, color: 'bg-emerald-500' },
            { label: 'متوسط (30–70%)', count: teams.filter(t => t.progress >= 30 && t.progress < 70).length, total: teams.length, color: 'bg-amber-400' },
            { label: 'يحتاج دعم (<30%)', count: teamsAtRisk, total: teams.length, color: 'bg-red-500' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-36 flex-shrink-0">{row.label}</span>
              <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${row.color} rounded-full transition-all duration-700`}
                  style={{ width: row.total > 0 ? `${(row.count / row.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-left">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Professor Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {professors.slice(0, 3).map((prof, idx) => {
          const isSelected = selectedProfessor?.id === prof.id;
          const profTeams = teams.filter(t => t.professor_id === prof.id);
          const profAvg = profTeams.length > 0
            ? Math.round(profTeams.reduce((s, t) => s + t.progress, 0) / profTeams.length)
            : 0;
          return (
            <div
              key={prof.id}
              onClick={() => setSelectedProfessor(isSelected ? null : prof)}
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden group hover:shadow-md transition-all cursor-pointer ${
                isSelected
                  ? 'border-orange-400 ring-2 ring-orange-400 ring-opacity-40'
                  : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className={`h-20 bg-gradient-to-r ${colorByIdx[idx % 3]} relative`}>
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-lg p-1.5 text-white">
                  <Shield className="w-4 h-4" />
                </div>
                {isSelected && (
                  <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs font-bold">
                    ✓ محدد
                  </div>
                )}
              </div>
              <div className="p-5 pt-0 relative">
                <div className="w-14 h-14 rounded-xl border-4 border-white dark:border-slate-800 bg-slate-100 -mt-7 mb-3 overflow-hidden shadow-sm">
                  <img src={`https://ui-avatars.com/api/?name=${prof.name}&background=random`} alt={prof.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-0.5">{prof.name}</h3>
                <p className="text-xs text-slate-500 mb-3">عضو هيئة تدريس / مشرف</p>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">الفرق المشرف عليها</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{profTeams.length} فرق</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">متوسط التقدم</span>
                  <span className={`font-bold ${profAvg >= 70 ? 'text-emerald-600' : profAvg >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                    {profAvg}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${profAvg >= 70 ? 'bg-emerald-500' : profAvg >= 40 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${profAvg}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Teams Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {selectedProfessor ? `فرق ${selectedProfessor.name}` : 'جميع الفرق'}
          </h3>
          {selectedProfessor && (
            <button
              onClick={() => setSelectedProfessor(null)}
              className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-100 transition-colors"
            >
              عرض كل الفرق
            </button>
          )}
        </div>

        <div className="space-y-3">
          {displayedTeams.length === 0 ? (
            <p className="text-center text-slate-400 py-10">لا يوجد فرق مخصصة حالياً.</p>
          ) : displayedTeams.map(team => {
            const isExpanded = expandedTeamId === team.id;
            const statusColor = team.progress === 100
              ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
              : team.progress >= 50
              ? 'text-blue-600 bg-blue-50 border-blue-200'
              : team.progress >= 30
              ? 'text-amber-600 bg-amber-50 border-amber-200'
              : 'text-red-600 bg-red-50 border-red-200';
            const statusText = team.progress === 100 ? '✅ مكتمل'
              : team.progress >= 50 ? '🔵 قيد التطوير'
              : team.progress >= 30 ? '🟡 بطيء'
              : '🔴 يحتاج دعم';

            let teamStudents = users.filter(u => u.role === 'student' && String(u.teamId) === String(team.id));
            if (teamStudents.length === 0) {
              teamStudents = [
                { id: `mock1-${team.id}`, name: 'أحمد محمود', email: 'ahmed@student.edu', rating: 4.8 },
                { id: `mock2-${team.id}`, name: 'سارة خالد', email: 'sara@student.edu', rating: 4.5 }
              ];
            }

            return (
              <div key={team.id} className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-sm transition-all">
                <div
                  onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: (team.color || '#3b82f6') + '20' }}>
                      {team.emoji || '🚀'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{team.name}</h4>
                      <p className="text-xs text-slate-500">{team.project_title}</p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-sm">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">التقدم</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{team.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${team.progress}%`,
                          background: team.progress === 100 ? '#10b981' : team.progress >= 50 ? '#3b82f6' : team.progress >= 30 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor}`}>
                      {statusText}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> أعضاء الفريق
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teamStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-2">
                            <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt={student.name} className="w-9 h-9 rounded-full border border-slate-100" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                            <span className="text-xs font-bold text-amber-600">{student.rating || '4.5'}</span>
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col lg:flex-row gap-3">
                      <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">ملخص تطور الفريق</p>
                          <p className="text-xs text-slate-500 mt-0.5">بناءً على المهام المنجزة</p>
                        </div>
                        <div className="text-left">
                          <p className={`text-3xl font-black ${team.progress >= 70 ? 'text-emerald-600' : team.progress >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {team.progress}%
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">نسبة الإنجاز</p>
                        </div>
                      </div>
                      <div className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                         <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">إدارة المشرفين</p>
                          <p className="text-xs text-slate-500 mt-0.5">{team.professor_id ? 'هذا الفريق قيد الإشراف' : 'الفريق يحتاج تعيين مشرف'}</p>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); alert('جاري فتح نافذة تعيين المشرف...'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold transition-all hover:bg-indigo-100">
                           <UserPlus className="w-4 h-4"/> تعيين
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
