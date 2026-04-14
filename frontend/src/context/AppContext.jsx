import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';

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

  useEffect(() => {
    if (user) {
      localStorage.setItem('unitrack_user', JSON.stringify(user));
      fetchNotifications();
      
      const interval = setInterval(() => {
        syncProfile();
        fetchNotifications();
      }, 5000); 
      return () => clearInterval(interval);
    } else {
      localStorage.removeItem('unitrack_user');
    }
  }, [user]);

  const syncProfile = async () => {
    if (!user) return;
    try {
      const res = await userService.getProfile(user.id);
      if (res.data.teamId !== user.teamId) {
        setUser(res.data);
        window.location.reload();
      }
    } catch (err) {
      console.error("Profile sync failed", err);
      if (err.response?.status === 404) {
        console.log("User no longer exists. Logging out...");
        logout();
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('unitrack_dark', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await userService.getNotifications(user.id);
      const allNotifs = res.data;
      console.log(`[SYNC] Found ${allNotifs.length} notifications for ${user.id}`);
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
      console.log(`[SYNC] Clearing chat badge for ${user.id}`);
      await userService.clearChatNotifications(user.id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to clear chat notifications", err);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      setUser(res.data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Login failed");
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
      notifications, setNotifications, unreadChatCount, clearChatBadge,
      updateUser, loading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
