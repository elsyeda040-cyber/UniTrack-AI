import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import {
  Settings, Shield, Loader2, Save, CheckCircle, Bell, Database,
  Lock, Globe, Palette, RefreshCw, Trash2, AlertTriangle, Download,
  UserCheck, UserX, Search, Eye, EyeOff, Key, Server, ToggleLeft, ToggleRight
} from 'lucide-react';

// ─── Toggle Switch ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input id={id} type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer 
        peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
        peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:start-[2px] 
        after:bg-white after:border-slate-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all 
        peer-checked:bg-orange-500" 
      />
    </label>
  );
}

// ─── Settings Row ────────────────────────────────────────────────────────────
function SettingRow({ icon: Icon, iconColor = 'text-slate-500', title, description, children }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{title}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconBg, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPermissions, setUserPermissions] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  // ── Settings State ──
  const [settings, setSettings] = useState({
    // General
    notifications: true,
    allowGuestAccess: false,
    maintenanceMode: false,
    // Appearance
    customTheme: false,
    darkModeForAll: false,
    compactLayout: false,
    // Security
    autoBackup: true,
    twoFactorAuth: false,
    sessionTimeout: true,
    // Platform
    aiAssistant: true,
    peerReview: true,
    leaderboard: true,
    chatFeature: true,
    fileUploads: true,
  });

  useEffect(() => {
    adminService.getUsers()
      .then(res => {
        setUsers(res.data);
        const perms = {};
        res.data.forEach(u => {
          perms[u.id] = u.role === 'admin' ? 'admin' : u.role === 'professor' ? 'full' : 'read';
        });
        setUserPermissions(perms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = async () => {
    try {
      const response = await adminService.exportDatabase();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'unitrack_backup.db');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل تصدير البيانات. المرجو المحاولة لاحقاً.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'general', label: 'عام', icon: Settings },
    { id: 'permissions', label: 'الصلاحيات', icon: Shield },
    { id: 'platform', label: 'المنصة', icon: Globe },
    { id: 'security', label: 'الأمان', icon: Lock },
  ];

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8 rtl" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إعدادات النظام</h2>
          <p className="text-sm text-slate-500 mt-1">إدارة الإعدادات العامة والصلاحيات</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            saveSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
          ) : saveSuccess ? (
            <><CheckCircle className="w-4 h-4" /> تم الحفظ!</>
          ) : (
            <><Save className="w-4 h-4" /> حفظ التغييرات</>
          )}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── General Tab ── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="الإعدادات العامة" icon={Settings} iconBg="bg-orange-500">
            <SettingRow icon={Bell} iconColor="text-blue-500" title="إشعارات البريد الإلكتروني" description="إرسال تنبيهات للمستخدمين">
              <Toggle id="notifications" checked={settings.notifications} onChange={() => toggle('notifications')} />
            </SettingRow>
            <SettingRow icon={Globe} iconColor="text-emerald-500" title="وصول الضيوف" description="رؤية المشاريع بدون تسجيل دخول">
              <Toggle id="guestAccess" checked={settings.allowGuestAccess} onChange={() => toggle('allowGuestAccess')} />
            </SettingRow>
            <SettingRow icon={AlertTriangle} iconColor="text-red-500" title="وضع الصيانة" description="إيقاف الوصول مؤقتاً للصيانة">
              <Toggle id="maintenance" checked={settings.maintenanceMode} onChange={() => toggle('maintenanceMode')} />
            </SettingRow>
          </Section>

          <Section title="المظهر والتخصيص" icon={Palette} iconBg="bg-purple-500">
            <SettingRow icon={Palette} iconColor="text-purple-500" title="السماح بتخصيص الألوان" description="تغيير ألوان الواجهة لكل مستخدم">
              <Toggle id="customTheme" checked={settings.customTheme} onChange={() => toggle('customTheme')} />
            </SettingRow>
            <SettingRow icon={Eye} iconColor="text-slate-500" title="الوضع الداكن للجميع" description="تفعيل الوضع الداكن لكل المستخدمين">
              <Toggle id="darkMode" checked={settings.darkModeForAll} onChange={() => toggle('darkModeForAll')} />
            </SettingRow>
            <SettingRow icon={Settings} iconColor="text-indigo-500" title="التخطيط المضغوط" description="عرض أكثر محتوى في مساحة أصغر">
              <Toggle id="compact" checked={settings.compactLayout} onChange={() => toggle('compactLayout')} />
            </SettingRow>
          </Section>

          {/* Danger Zone */}
          <div className="lg:col-span-2 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-700 dark:text-red-400">منطقة الخطر</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { if (window.confirm('هل أنت متأكد من إعادة ضبط المنصة؟ هذا الإجراء لا يمكن التراجع عنه.')) alert('تم إرسال طلب إعادة الضبط!'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> إعادة ضبط المنصة
              </button>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/40 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
              >
                <Download className="w-4 h-4" /> تصدير كل البيانات
              </button>
              <button
                onClick={() => { if (window.confirm('حذف كل الفرق غير النشطة؟')) alert('تم الحذف!'); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900/40 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> حذف الفرق غير النشطة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions Tab ── */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>

          {/* Role Legend */}
          <div className="flex gap-3 flex-wrap text-xs">
            {[
              { role: 'admin', label: 'مسؤول كامل', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40' },
              { role: 'full', label: 'وصول كامل', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40' },
              { role: 'read', label: 'قراءة فقط', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' },
              { role: 'restricted', label: 'مقيد', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/40' },
            ].map(({ role, label, color }) => (
              <span key={role} className={`px-3 py-1.5 rounded-lg border font-semibold ${color}`}>{label}</span>
            ))}
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {filteredUsers.map(user => {
                const perm = userPermissions[user.id] || 'read';
                const permColors = {
                  admin: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
                  full: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                  read: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300',
                  restricted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
                };
                return (
                  <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${permColors[perm]}`}>
                        {perm === 'admin' ? 'مسؤول' : perm === 'full' ? 'كامل' : perm === 'read' ? 'قراءة' : 'مقيد'}
                      </span>
                      <select
                        value={perm}
                        onChange={e => setUserPermissions(p => ({ ...p, [user.id]: e.target.value }))}
                        className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="admin">مسؤول كامل</option>
                        <option value="full">وصول كامل</option>
                        <option value="read">قراءة فقط</option>
                        <option value="restricted">مقيد</option>
                      </select>
                      <button
                        onClick={() => {
                          const newPerm = perm === 'restricted' ? 'read' : perm === 'read' ? 'full' : perm === 'full' ? 'admin' : 'restricted';
                          setUserPermissions(p => ({ ...p, [user.id]: newPerm }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="تبديل الصلاحية"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> حفظ...</> : saveSuccess ? <><CheckCircle className="w-4 h-4" /> تم حفظ الصلاحيات!</> : <><Save className="w-4 h-4" /> حفظ الصلاحيات</>}
          </button>
        </div>
      )}

      {/* ── Platform Tab ── */}
      {activeTab === 'platform' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="ميزات المنصة" icon={Globe} iconBg="bg-blue-500">
            <SettingRow icon={Shield} iconColor="text-purple-500" title="المساعد الذكي (AI)" description="تفعيل الميزات المدعومة بالذكاء الاصطناعي">
              <Toggle id="ai" checked={settings.aiAssistant} onChange={() => toggle('aiAssistant')} />
            </SettingRow>
            <SettingRow icon={UserCheck} iconColor="text-emerald-500" title="المراجعة بالأقران" description="تقييم الطلاب لبعضهم البعض">
              <Toggle id="peerReview" checked={settings.peerReview} onChange={() => toggle('peerReview')} />
            </SettingRow>
            <SettingRow icon={Settings} iconColor="text-amber-500" title="لوحة المتصدرين" description="عرض ترتيب الطلاب والفرق">
              <Toggle id="leaderboard" checked={settings.leaderboard} onChange={() => toggle('leaderboard')} />
            </SettingRow>
            <SettingRow icon={Bell} iconColor="text-blue-500" title="غرفة الدردشة" description="تفعيل المحادثات الجماعية للفرق">
              <Toggle id="chat" checked={settings.chatFeature} onChange={() => toggle('chatFeature')} />
            </SettingRow>
            <SettingRow icon={Download} iconColor="text-indigo-500" title="رفع الملفات" description="السماح برفع ومشاركة الملفات">
              <Toggle id="files" checked={settings.fileUploads} onChange={() => toggle('fileUploads')} />
            </SettingRow>
          </Section>

          <Section title="معلومات النظام" icon={Server} iconBg="bg-slate-700">
            {[
              { label: 'إصدار المنصة', value: 'UniTrack AI v3.0' },
              { label: 'قاعدة البيانات', value: 'PostgreSQL (Railway)' },
              { label: 'البيئة', value: 'Production' },
              { label: 'آخر نسخة احتياطية', value: 'اليوم، 02:00 ص' },
              { label: 'حالة الخادم', value: '🟢 يعمل بشكل طبيعي' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</span>
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="إعدادات الأمان" icon={Lock} iconBg="bg-red-500">
            <SettingRow icon={Database} iconColor="text-blue-500" title="النسخ الاحتياطي التلقائي" description="نسخ البيانات تلقائياً كل 24 ساعة">
              <Toggle id="autoBackup" checked={settings.autoBackup} onChange={() => toggle('autoBackup')} />
            </SettingRow>
            <SettingRow icon={Key} iconColor="text-amber-500" title="التحقق بخطوتين (2FA)" description="طبقة أمان إضافية عند تسجيل الدخول">
              <Toggle id="2fa" checked={settings.twoFactorAuth} onChange={() => toggle('twoFactorAuth')} />
            </SettingRow>
            <SettingRow icon={Clock} iconColor="text-red-500" title="انتهاء الجلسة التلقائي" description="تسجيل الخروج بعد 30 دقيقة من الخمول">
              <Toggle id="session" checked={settings.sessionTimeout} onChange={() => toggle('sessionTimeout')} />
            </SettingRow>
          </Section>

          <Section title="سجل الوصول" icon={Eye} iconBg="bg-purple-500">
            <div className="space-y-2">
              {[
                { action: 'تسجيل دخول', user: 'Admin', time: 'منذ 5 دقائق', color: 'text-emerald-500' },
                { action: 'حذف مستخدم', user: 'Admin', time: 'منذ 2 ساعة', color: 'text-red-500' },
                { action: 'تغيير الإعدادات', user: 'Admin', time: 'منذ يوم', color: 'text-blue-500' },
                { action: 'إضافة فريق', user: 'Admin', time: 'منذ 3 أيام', color: 'text-purple-500' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${log.color === 'text-emerald-500' ? 'bg-emerald-500' : log.color === 'text-red-500' ? 'bg-red-500' : log.color === 'text-blue-500' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <span className={`text-sm font-semibold ${log.color}`}>{log.action}</span>
                    <span className="text-xs text-slate-400">— {log.user}</span>
                  </div>
                  <span className="text-xs text-slate-400">{log.time}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Password Policy */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" /> سياسة كلمات المرور
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'الحد الأدنى للأحرف', value: '8 أحرف', icon: '🔤' },
                { label: 'انتهاء صلاحية الكلمة', value: '90 يوم', icon: '⏰' },
                { label: 'عدد المحاولات المسموح', value: '5 محاولات', icon: '🔒' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => alert('تم فتح نافذة تعديل سياسة كلمات المرور!')}
              className="mt-4 text-sm text-orange-600 font-semibold hover:underline flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" /> تعديل السياسة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
