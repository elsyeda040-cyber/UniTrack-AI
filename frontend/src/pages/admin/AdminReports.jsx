import React, { useState, useEffect } from 'react';
import { adminService, teamService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  FileDown, Loader2, TrendingUp, Users, CheckCircle, Clock, 
  AlertCircle, Download, Eye, BarChart2, Printer
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

export default function AdminReports() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('overview');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1200));
    // Build a simple printable report
    const printWindow = window.open('', '_blank');
    const professors = users.filter(u => u.role === 'professor');
    const students = users.filter(u => u.role === 'student');
    const avgProgress = teams.length > 0 ? Math.round(teams.reduce((s, t) => s + t.progress, 0) / teams.length) : 0;
    printWindow.document.write(`
      <html><head><title>UniTrack AI — System Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; direction: rtl; }
        h1 { color: #f97316; font-size: 28px; } 
        h2 { color: #334155; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #f1f5f9; padding: 10px; text-align: right; font-size: 13px; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .stat { display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 24px; margin: 8px; text-align: center; }
        .stat-num { font-size: 28px; font-weight: bold; color: #f97316; }
        .badge-green { background: #dcfce7; color: #16a34a; padding: 3px 10px; border-radius: 99px; font-size: 11px; }
        .badge-yellow { background: #fef9c3; color: #ca8a04; padding: 3px 10px; border-radius: 99px; font-size: 11px; }
        .badge-red { background: #fee2e2; color: #dc2626; padding: 3px 10px; border-radius: 99px; font-size: 11px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>📊 تقرير النظام الشامل — UniTrack AI</h1>
      <p style="color:#64748b">📅 تاريخ التوليد: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <h2>📌 ملخص الإحصائيات</h2>
      <div>
        <div class="stat"><div class="stat-num">${teams.length}</div><div>عدد الفرق</div></div>
        <div class="stat"><div class="stat-num">${professors.length}</div><div>الدكاترة</div></div>
        <div class="stat"><div class="stat-num">${students.length}</div><div>الطلاب</div></div>
        <div class="stat"><div class="stat-num">${avgProgress}%</div><div>متوسط التقدم</div></div>
      </div>

      <h2>📋 تفاصيل الفرق</h2>
      <table>
        <thead><tr><th>اسم الفريق</th><th>المشروع</th><th>نسبة الإنجاز</th><th>الحالة</th></tr></thead>
        <tbody>
          ${teams.map(t => `<tr>
            <td>${t.emoji || '🚀'} ${t.name}</td>
            <td>${t.project_title}</td>
            <td>${t.progress}%</td>
            <td><span class="${t.progress >= 70 ? 'badge-green' : t.progress >= 40 ? 'badge-yellow' : 'badge-red'}">${t.progress >= 70 ? 'على المسار' : t.progress >= 40 ? 'متوسط' : 'يحتاج دعم'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>

      <h2>👨‍🏫 الأساتذة المشرفون</h2>
      <table>
        <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>عدد الفرق</th></tr></thead>
        <tbody>
          ${professors.map(p => `<tr>
            <td>${p.name}</td><td>${p.email}</td>
            <td>${teams.filter(t => t.professor_id === p.id).length}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <br/><br/>
      <p style="font-size:11px;color:#94a3b8;text-align:center">تقرير تلقائي مولَّد بواسطة UniTrack AI — جميع الحقوق محفوظة</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    setExporting(false);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  const professors = users.filter(u => u.role === 'professor');
  const students = users.filter(u => u.role === 'student');
  const avgProgress = teams.length > 0 ? Math.round(teams.reduce((s, t) => s + t.progress, 0) / teams.length) : 0;
  const teamsOnTrack = teams.filter(t => t.progress >= 70).length;
  const teamsAtRisk = teams.filter(t => t.progress < 40).length;

  const teamChartData = teams.map(t => ({ name: t.name.split(' ')[0], progress: t.progress }));

  const reportTypes = [
    { id: 'overview', label: 'نظرة شاملة', icon: BarChart2 },
    { id: 'teams', label: 'تقرير الفرق', icon: Users },
    { id: 'professors', label: 'تقرير الأساتذة', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">التقارير الشاملة</h2>
          <p className="text-slate-500 text-sm mt-1">توليد وتصدير تقارير النظام الكاملة</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            exportSuccess 
              ? 'bg-emerald-500 text-white' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {exporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جاري التصدير...</>
          ) : exportSuccess ? (
            <><CheckCircle className="w-4 h-4" /> تم التصدير!</>
          ) : (
            <><Printer className="w-4 h-4" /> طباعة التقرير</>
          )}
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {reportTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveReport(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeReport === id
                ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الفرق', value: teams.length, icon: Users, color: 'bg-blue-500', sub: 'فريق مسجل' },
          { label: 'الأساتذة', value: professors.length, icon: TrendingUp, color: 'bg-purple-500', sub: 'عضو هيئة تدريس' },
          { label: 'الطلاب', value: students.length, icon: Users, color: 'bg-emerald-500', sub: 'طالب نشط' },
          { label: 'متوسط الإنجاز', value: `${avgProgress}%`, icon: BarChart2, color: 'bg-orange-500', sub: 'عبر كل الفرق' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-slate-500 font-medium">{kpi.label}</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{teamsOnTrack}</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">فرق على المسار</p>
            <p className="text-xs text-emerald-500/70">تقدم 70% أو أكثر</p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{teams.length - teamsOnTrack - teamsAtRisk}</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">فرق متوسطة</p>
            <p className="text-xs text-amber-500/70">تقدم بين 40% و 70%</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-700 dark:text-red-400">{teamsAtRisk}</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-500">فرق تحتاج دعم</p>
            <p className="text-xs text-red-500/70">تقدم أقل من 40%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">تقدم الفرق المقارن</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamChartData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} dx={-8} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="progress" radius={[8, 8, 0, 0]} name="نسبة التقدم">
                {teamChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Teams Detail Table */}
      {(activeReport === 'overview' || activeReport === 'teams') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">تفاصيل الفرق</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" /> تصدير
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3 font-semibold">الفريق</th>
                  <th className="pb-3 font-semibold">المشروع</th>
                  <th className="pb-3 font-semibold">الإنجاز</th>
                  <th className="pb-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {teams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: (team.color || '#3b82f6') + '20' }}>
                          {team.emoji || '🚀'}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{team.project_title}</td>
                    <td className="py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${team.progress}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{team.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        team.progress >= 70
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : team.progress >= 40
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {team.progress >= 70 ? '✅ على المسار' : team.progress >= 40 ? '⚠️ متوسط' : '🔴 يحتاج دعم'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Professors Report */}
      {(activeReport === 'overview' || activeReport === 'professors') && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-5">الأساتذة المشرفون</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professors.map((prof, idx) => {
              const profTeams = teams.filter(t => t.professor_id === prof.id);
              const profAvg = profTeams.length > 0 ? Math.round(profTeams.reduce((s, t) => s + t.progress, 0) / profTeams.length) : 0;
              return (
                <div key={prof.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <img src={`https://ui-avatars.com/api/?name=${prof.name}&background=random`} alt={prof.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{prof.name}</p>
                    <p className="text-xs text-slate-500">{prof.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{profTeams.length} فريق — متوسط {profAvg}%</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-4 border-orange-100 dark:border-orange-900/30 flex items-center justify-center">
                      <span className="text-sm font-black text-orange-600">{profAvg}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
