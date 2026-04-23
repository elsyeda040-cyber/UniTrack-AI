import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService, adminService } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unitrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('unitrack_dark') === 'true';
  });
  const [notifications, setNotifications] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});
  const [hackathonMode, setHackathonMode] = useState(() => {
    return localStorage.getItem('unitrack_hackathon') === 'true';
  });

  useEffect(() => {
    fetchSystemSettings();
    const interval = setInterval(fetchSystemSettings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await adminService.getSettings();
      const mapped = {};
      Object.entries(res.data).forEach(([k, v]) => {
        mapped[k] = v === 'True' || v === 'true';
      });
      setSystemSettings(mapped);
    } catch (err) {
      console.error("Failed to fetch system settings", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('unitrack_hackathon', hackathonMode);
    if (hackathonMode) document.documentElement.classList.add('hackathon-active');
    else document.documentElement.classList.remove('hackathon-active');
  }, [hackathonMode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('unitrack_user', JSON.stringify(user));
      fetchNotifications();
      
      const interval = setInterval(() => {
        if (!user) return; 
        syncProfile();
        fetchNotifications();
      }, 30000); 
      return () => clearInterval(interval);
    } else {
      localStorage.removeItem('unitrack_user');
    }
  }, [user?.id]);

  const syncProfile = async () => {
    if (!user) return;
    try {
      const res = await userService.getProfile(user.id);
      if (res.data.teamId !== user.teamId) {
        setUser(prev => ({ ...prev, teamId: res.data.teamId }));
      }
    } catch (err) {
      console.error("Profile sync failed", err);
      if (err.response?.status === 401 || err.response?.status === 404) {
        logout();
      }
    }
  };

  // Dark Mode Logic: Priority to System Setting, then Local Storage
  useEffect(() => {
    const isDark = systemSettings.darkModeForAll || darkMode;
    localStorage.setItem('unitrack_dark', darkMode);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode, systemSettings.darkModeForAll]);

  useEffect(() => {
    if (systemSettings.compactLayout) document.documentElement.classList.add('compact-layout');
    else document.documentElement.classList.remove('compact-layout');
  }, [systemSettings.compactLayout]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await userService.getNotifications(user.id);
      const allNotifs = res.data;
      setNotifications(allNotifs.filter(n => !n.read).length);
      const chatUnread = allNotifs.filter(n => n.type === 'chat' && !n.read).length;
      setUnreadChatCount(chatUnread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const clearChatBadge = async () => {
    if (!user) return;
    try {
      await userService.clearChatNotifications(user.id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to clear chat notifications", err);
    }
  };

  const login = async (email, password, expectedRole) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.data.role !== expectedRole) {
        throw new Error("عذراً! هذا الحساب لا يملك صلاحيات الدخول لهذه الواجهة. يرجى اختيار صفتك الصحيحة.");
      }
      setUser(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Login failed";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const toggleDark = () => {
    setDarkMode(d => !d);
  };

  const toggleHackathon = () => {
    setHackathonMode(h => !h);
  };

  const updateUser = async (newData) => {
    try {
      const res = await userService.updateProfile(user.id, { ...user, ...newData });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, login, logout, darkMode, toggleDark, 
      hackathonMode, toggleHackathon,
      notifications, setNotifications, unreadChatCount, clearChatBadge,
      updateUser, loading, systemSettings 
    }}>
      {systemSettings.maintenanceMode && user?.role !== 'admin' ? (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] flex flex-col items-center justify-center p-6 text-center rtl" dir="rtl">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl">🛠️</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">المنصة في وضع الصيانة</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            نحن نقوم حالياً ببعض التحسينات لضمان أفضل تجربة لكم. سنعود للعمل قريباً جداً.
          </p>
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">شكراً لتعاونكم</p>
            <p className="text-sm font-bold text-orange-600">فريق عمل UniTrack AI</p>
          </div>
          {user && (
            <button onClick={logout} className="mt-8 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              تسجيل الخروج
            </button>
          )}
        </div>
      ) : children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
