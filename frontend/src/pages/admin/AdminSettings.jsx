import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Settings, Shield, Loader2, Save, UserX, UserCheck } from 'lucide-react';

export default function AdminSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // System Settings State
  const [sysSettings, setSysSettings] = useState({
    notifications: true,
    allowAccess: true,
    customTheme: false,
    autoBackup: true
  });

  useEffect(() => {
    adminService.getUsers().then(res => {
      setUsers(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إعدادات النظام</h2>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 text-sm text-slate-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-medium">
             <Settings className="w-4 h-4" /> التقارير المتقدمة
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Right Column: User Management */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col h-[600px]">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">إدارة المستخدمين</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200">
                     <option>مسؤول</option>
                     <option>مستخدم</option>
                     <option>مقيد</option>
                   </select>
                   <button className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                     <UserCheck className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Column: System Settings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">الإعدادات العامة</h3>
            <div className="space-y-5">
              
              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">تلقي الإشعارات للنظام</p>
                  <p className="text-xs text-slate-500 mt-1">تفعيل إرسال الإشعارات عبر البريد الإلكتروني للمستخدمين</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={sysSettings.notifications} onChange={() => setSysSettings(s => ({...s, notifications: !s.notifications}))} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">السماح بوصول الضيوف</p>
                  <p className="text-xs text-slate-500 mt-1">تمكين الزوار من رؤية المشاريع العامة بدون تسجيل دخول</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={sysSettings.allowAccess} onChange={() => setSysSettings(s => ({...s, allowAccess: !s.allowAccess}))} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">تخصيص الواجهة بالكامل</p>
                  <p className="text-xs text-slate-500 mt-1">السماح للمستخدمين بتغيير ألوان الواجهة الخاصة بهم</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={sysSettings.customTheme} onChange={() => setSysSettings(s => ({...s, customTheme: !s.customTheme}))} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                 <Shield className="w-5 h-5"/>
               </div>
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">إعدادات الأمان</h3>
             </div>
             <p className="text-sm text-slate-500 mb-6">هذه الإعدادات تؤثر على قواعد بيانات النظام بالكامل. يرجى توخي الحذر عند تغييرها.</p>
             
             <div className="mt-auto">
               <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
               >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5"/> حفظ التغييرات الآن</>}
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
