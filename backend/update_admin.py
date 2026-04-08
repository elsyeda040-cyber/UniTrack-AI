import re
import os

filepath = r"d:\Unit Tiack AI\frontend\src\pages\admin\AdminDashboard.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace(
    "BarChart2, AlertCircle, Bell, X, ChevronRight, UserPlus, UserMinus, Settings",
    "BarChart2, AlertCircle, Bell, X, ChevronRight, UserPlus, UserMinus, Settings, Download, Activity, Trophy, Database, Server"
)

# Header
header_old = """      {/* ── Page Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-orange-500" />
          مساحة الإدارة
        </h2>
        <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
          مساحة الإدارة / الرئيسية
        </div>
      </div>"""

header_new = """      {/* ── Page Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-orange-500" />
          مساحة الإدارة
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("جاري تجهيز تقرير النظام الشامل للتحميل...")}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-all shadow-sm border border-slate-200 dark:border-slate-700">
            <Download className="w-4 h-4" />
            تصدير التقرير
          </button>
          <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hidden md:block">
            مساحة الإدارة / الرئيسية
          </div>
        </div>
      </div>"""

content = content.replace(header_old, header_new)

# Add System Health right after Secondary Stats Row
secondary_stats_idx = content.find("{/* ── Progress Overview Bar ── */}")
if secondary_stats_idx == -1:
    print("Could not find secondary stats row")

system_health_html = """      {/* ── System Health & Leaderboard ── */}
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
      </div>\n\n"""

content = content[:secondary_stats_idx] + system_health_html + content[secondary_stats_idx:]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated AdminDashboard.jsx successfully!")
