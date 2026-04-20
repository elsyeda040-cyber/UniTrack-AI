import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Camera, Mail, User, Shield, CheckCircle, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useApp();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || 'Academic enthusiast working on innovative projects.',
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update basic profile info
      await updateUser({ ...formData, avatar: profilePic || user?.avatar });
      
      // 2. Update password if provided
      if (newPassword.trim()) {
        await userService.updatePassword(user.id, newPassword);
        setNewPassword('');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed", err);
      alert("فشل حفظ التعديلات.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-2 md:p-6">
      {/* Profile Header Card */}
      <div className="card relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-500 to-indigo-600 opacity-10" />
        <div className="pt-12 px-6 pb-6 flex flex-col items-center">
          <div className="relative group/avatar">
            <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden border-4 border-white dark:border-slate-800 transition-transform group-hover/avatar:scale-105`}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl shadow-lg flex items-center justify-center text-primary-500 hover:text-primary-600 transition-colors border border-slate-100 dark:border-slate-600"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{user?.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="badge badge-blue">{user?.role}</span>
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium tracking-wide">
                <CheckCircle className="w-3 h-3" /> Verified Member
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Joined</span>
                <span className="text-sm font-semibold dark:text-white">Sep 2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Activity Level</span>
                <span className="text-sm font-semibold text-emerald-500">High</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Projects</span>
                <span className="text-sm font-semibold dark:text-white">12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main form */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 md:p-8 space-y-6 glass-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Security & Identity</h3>
            </div>

            <div className="space-y-4">
              <div className="group text-left">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">الاسم بالكامل</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-400 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="group text-left">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">البريد الإلكتروني (غير قابل للتعديل)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    disabled
                    type="email" 
                    value={formData.email}
                    className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-not-allowed dark:text-slate-400"
                  />
                </div>
              </div>

              <div className="group text-left">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">تغيير كلمة المرور</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="اتركها فارغة إذا كنت لا تريد التغيير"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-400 outline-none transition-all dark:text-white"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              <div className="group text-left">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">نبذة عنك</label>
                <textarea 
                  rows="3" 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-400 outline-none transition-all dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400 italic">تم آخر تعديل: اليوم</p>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`btn-primary px-8 rounded-2xl flex items-center gap-2 group overflow-hidden ${showSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>تم الحفظ!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
